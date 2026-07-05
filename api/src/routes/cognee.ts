import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyJWT, AuthenticatedRequest } from '../middleware/verifyJWT';
import { tierCheck } from '../middleware/tierCheck';

const router = Router();
const prisma = new PrismaClient();
const SIDECAR_URL = process.env.SIDECAR_URL || 'http://sidecar:8000';

// Apply JWT verification
router.use(verifyJWT);

// 5. Validate Key endpoint (Runs before tierCheck as it does not require a pre-configured key)
router.post('/validate-key', async (req: AuthenticatedRequest, res: Response) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const sidecarResult = await callSidecar('/validate-key', 'POST', { api_key: apiKey }, apiKey);
    return res.json(sidecarResult);
  } catch (error: any) {
    console.error('Error validating API key:', error);
    return res.status(400).json({ error: 'API key validation check failed. Verify your key in Google AI Studio.' });
  }
});

// Apply Tier limit verification to remaining endpoints
router.use(tierCheck);

// Helper function to forward request to sidecar
async function callSidecar(endpoint: string, method: string, body: any, geminiKey: string): Promise<any> {
  const url = `${SIDECAR_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Gemini-Key': geminiKey
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sidecar error: ${errorText}`);
  }

  return response.json();
}

// 1. Log Attempt endpoint
router.post('/log-attempt', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userTier = req.user?.tier;
  const geminiKey = userTier === 'pro' ? process.env.GEMINI_SERVER_KEY : (req.headers['x-gemini-key'] as string);

  if (!userId || !geminiKey) {
    return res.status(400).json({ error: 'Missing authorization or Gemini API key context' });
  }

  const { problemTitle, pattern, difficulty, result, mistakeNote } = req.body;

  if (!problemTitle || !pattern || !difficulty || !result) {
    return res.status(400).json({ error: 'Problem title, pattern, difficulty, and result are required' });
  }

  try {
    // A. Forward structured logging operation to Cognee sidecar
    const sidecarResult = await callSidecar('/log-attempt', 'POST', {
      user_id: userId,
      problem_title: problemTitle,
      pattern,
      difficulty,
      result,
      mistake_note: mistakeNote || ''
    }, geminiKey);

    const mistakeSummary = sidecarResult.structured?.mistake_summary || mistakeNote || '';

    // B. Calculate consecutiveCorrectCount and update status based on results
    const lastAttempt = await prisma.problemAttempt.findFirst({
      where: { userId, pattern },
      orderBy: { createdAt: 'desc' }
    });

    let consecutiveCorrectCount = 0;
    if (result === 'Solved') {
      consecutiveCorrectCount = (lastAttempt?.consecutiveCorrectCount || 0) + 1;
    } else {
      consecutiveCorrectCount = 0;
    }

    // Determine status based on result AND streak
    // - Failed / Solved with Hints → always active_weak_spot
    // - Solved with streak >= 3     → mastered_forgotten (triggers forget())
    // - Solved with streak < 3      → not a weak spot; keep previous status or neutral
    const isMastered = consecutiveCorrectCount >= 3;
    let status: string;
    if (isMastered) {
      status = 'mastered_forgotten';
    } else if (result === 'Solved') {
      // A correct solve is not a weak spot — preserve last status or default neutral
      status = lastAttempt?.status || 'active_weak_spot';
    } else {
      // Failed or Solved with Hints → this IS a weak spot
      status = 'active_weak_spot';
    }

    // C. Create Problem Attempt record in Postgres
    const newAttempt = await prisma.problemAttempt.create({
      data: {
        userId,
        problemTitle,
        pattern,
        difficulty,
        result,
        mistakeSummary,
        consecutiveCorrectCount,
        status
      }
    });

    // D. If a mastered pattern gets failed or hints again, restore all attempts to active
    if (result !== 'Solved' && lastAttempt?.status === 'mastered_forgotten') {
      await prisma.problemAttempt.updateMany({
        where: { userId, pattern },
        data: { status: 'active_weak_spot' }
      });
      newAttempt.status = 'active_weak_spot';
    }

    // E. Increment user usage tracking count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.usage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        logCount: { increment: 1 }
      },
      create: {
        userId,
        date: today,
        logCount: 1
      }
    });

    // F. If mastered, automatically run forget() in background to clear warning nodes from Cognee
    if (isMastered) {
      try {
        await callSidecar('/forget', 'POST', { user_id: userId, pattern }, geminiKey);
        console.log(`Automatic cognee.forget() executed for mastered pattern: ${pattern}`);
      } catch (err) {
        console.error(`Background forget error:`, err);
      }
    }

    // G. Get updated today count
    const usageRecord = await prisma.usage.findUnique({
      where: { userId_date: { userId, date: today } }
    });

    return res.json({
      success: true,
      attempt: newAttempt,
      todayLogsCount: usageRecord?.logCount || 1,
      structured: sidecarResult.structured
    });

  } catch (error: any) {
    console.error('Error in log-attempt endpoint:', error);
    return res.status(500).json({ error: error.message || 'Failed to log coding practice attempt' });
  }
});

// 2. Check Before Solving endpoint (recall)
router.post('/check-before-solving', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userTier = req.user?.tier;
  const geminiKey = userTier === 'pro' ? process.env.GEMINI_SERVER_KEY : (req.headers['x-gemini-key'] as string);

  if (!userId || !geminiKey) {
    return res.status(400).json({ error: 'Missing authorization or Gemini API key context' });
  }

  const { pattern } = req.body;
  if (!pattern) {
    return res.status(400).json({ error: 'Pattern is required for pre-solving checks' });
  }

  try {
    // Check if the pattern is currently marked as mastered in Postgres
    const lastAttempt = await prisma.problemAttempt.findFirst({
      where: { userId, pattern },
      orderBy: { createdAt: 'desc' }
    });

    // If marked mastered_forgotten, return clean immediately
    if (lastAttempt && lastAttempt.status === 'mastered_forgotten') {
      return res.json({
        warning_found: false,
        briefing: 'You have proven mastery over this pattern. Memory warning nodes are cleared.'
      });
    }

    // Call sidecar to check cognee.recall() and format briefing
    const sidecarResult = await callSidecar('/check-before-solving', 'POST', {
      user_id: userId,
      pattern
    }, geminiKey);

    return res.json(sidecarResult);
  } catch (error: any) {
    console.error('Error in check-before-solving endpoint:', error);
    return res.status(500).json({ error: error.message || 'Failed to perform memory check' });
  }
});

// 3. Improve endpoint
router.post('/improve', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userTier = req.user?.tier;
  const geminiKey = userTier === 'pro' ? process.env.GEMINI_SERVER_KEY : (req.headers['x-gemini-key'] as string);

  if (!userId || !geminiKey) {
    return res.status(400).json({ error: 'Missing authorization or Gemini API key context' });
  }

  const { pattern } = req.body;
  if (!pattern) {
    return res.status(400).json({ error: 'Pattern is required' });
  }

  try {
    const sidecarResult = await callSidecar('/improve', 'POST', {
      user_id: userId,
      pattern,
      status: 'active_weak_spot'
    }, geminiKey);

    return res.json(sidecarResult);
  } catch (error: any) {
    console.error('Error in improve endpoint:', error);
    return res.status(500).json({ error: error.message || 'Failed to execute memory improvement' });
  }
});

// 4. Forget endpoint
router.post('/forget', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const userTier = req.user?.tier;
  const geminiKey = userTier === 'pro' ? process.env.GEMINI_SERVER_KEY : (req.headers['x-gemini-key'] as string);

  if (!userId || !geminiKey) {
    return res.status(400).json({ error: 'Missing authorization or Gemini API key context' });
  }

  const { pattern } = req.body;
  if (!pattern) {
    return res.status(400).json({ error: 'Pattern is required' });
  }

  try {
    // Update attempts status to mastered_forgotten
    await prisma.problemAttempt.updateMany({
      where: { userId, pattern },
      data: { status: 'mastered_forgotten' }
    });

    const sidecarResult = await callSidecar('/forget', 'POST', {
      user_id: userId,
      pattern
    }, geminiKey);

    return res.json(sidecarResult);
  } catch (error: any) {
    console.error('Error in forget endpoint:', error);
    return res.status(500).json({ error: error.message || 'Failed to execute forget instruction' });
  }
});



export default router;

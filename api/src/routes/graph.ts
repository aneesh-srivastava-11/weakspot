import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyJWT, AuthenticatedRequest } from '../middleware/verifyJWT';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyJWT);

// GET /graph -> Returns attempts and mastered states for the current user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User context not found' });
  }

  try {
    // 1. Fetch user record to check tier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Fetch all problem attempts for this user
    const attempts = await prisma.problemAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Compute mastered patterns dictionary
    // A pattern is mastered if its status is 'mastered_forgotten' in the DB (streak >= 3)
    const masteredPatterns: Record<string, boolean> = {};
    
    // We group by pattern and find if the latest status is 'mastered_forgotten'
    const uniquePatterns = Array.from(new Set(attempts.map(a => a.pattern)));
    for (const pattern of uniquePatterns) {
      const latestForPattern = attempts.find(a => a.pattern === pattern);
      masteredPatterns[pattern] = latestForPattern?.status === 'mastered_forgotten';
    }

    // 4. Fetch daily log count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usage = await prisma.usage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today
        }
      }
    });

    return res.json({
      attempts: attempts.map(a => ({
        id: a.id,
        problemTitle: a.problemTitle,
        pattern: a.pattern,
        difficulty: a.difficulty,
        result: a.result,
        mistakeNote: a.mistakeSummary || '',
        timestamp: a.createdAt,
        status: a.status
      })),
      masteredPatterns,
      userState: {
        email: user.email,
        tier: user.tier === 'pro' ? 'Pro' : 'Free',
        logsCountToday: usage?.logCount || 0
      }
    });

  } catch (error) {
    console.error('Error fetching graph and history:', error);
    return res.status(500).json({ error: 'Failed to compile graph and attempt history data' });
  }
});

export default router;

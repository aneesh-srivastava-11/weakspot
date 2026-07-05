import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './verifyJWT';

const prisma = new PrismaClient();

export async function tierCheck(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'User context not found in request' });
  }

  try {
    // Live lookup of user and their current tier
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach user record for downstream route handlers
    req.user = {
      userId: user.id,
      email: user.email,
      tier: user.tier,
      geminiKey: user.geminiKey
    };

    if (user.tier === 'free') {
      // 1. Validate Gemini Key is resolved from DB or provided in header
      const geminiKey = user.geminiKey || req.headers['x-gemini-key'];
      if (!geminiKey || geminiKey === 'undefined' || geminiKey === 'null') {
        return res.status(400).json({
          error: 'Gemini API Key is required for the Free Tier. Please configure your key in Onboarding or Upgrade to Pro.'
        });
      }

      // 2. Enforce limits only for /log-attempt endpoint
      if (req.path === '/log-attempt') {
        // Enforce 15 daily logs limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usage = await prisma.usage.findUnique({
          where: {
            userId_date: {
              userId: user.id,
              date: today
            }
          }
        });

        if (usage && usage.logCount >= 15) {
          return res.status(403).json({
            error: 'Daily limit of 15 logs reached on Free Tier. Upgrade to Pro for unlimited memory logs.'
          });
        }

        // Enforce 50 active nodes tracked limit
        const activeNodesCount = await prisma.problemAttempt.count({
          where: {
            userId: user.id,
            status: 'active_weak_spot'
          }
        });

        if (activeNodesCount >= 50) {
          return res.status(403).json({
            error: 'Active weak spot limit (50 nodes) reached. Solve existing spots or upgrade to Pro to track more.'
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error in tierCheck middleware:', error);
    return res.status(500).json({ error: 'Internal server error during authorization verification' });
  }
}

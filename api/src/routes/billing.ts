import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { verifyJWT, AuthenticatedRequest } from '../middleware/verifyJWT';

const router = Router();
const prisma = new PrismaClient();

// Razorpay test credentials from env
const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_change_me';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_change_me';

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET
});

// Protect all billing routes with JWT check
router.use(verifyJWT);

router.post('/create-order', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const options = {
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `receipt_order_${req.user?.userId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: 'Failed to initialize payment order' });
  }
});

router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const userId = req.user?.userId;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    return res.status(400).json({ error: 'Missing payment signature verification parameters' });
  }

  try {
    // Generate signature payload
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature verification failed. Tampering detected.' });
    }

    // Update user's tier to Pro in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tier: 'pro' }
    });

    return res.json({
      success: true,
      message: 'Upgrade to PRO completed successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        tier: updatedUser.tier
      }
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Helper route to simulate downgrade/upgrade instantly for developers
router.post('/simulate-toggle', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { targetTier } = req.body;

  if (!userId || !['free', 'pro'].includes(targetTier)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tier: targetTier }
    });

    return res.json({
      success: true,
      message: `Tier toggled to ${targetTier} in simulation.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        tier: updatedUser.tier
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle tier' });
  }
});

export default router;

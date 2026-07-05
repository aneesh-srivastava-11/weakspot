import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import billingRoutes from './routes/billing';
import cogneeRoutes from './routes/cognee';
import graphRoutes from './routes/graph';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for Next.js frontend calls
app.use(cors({
  origin: '*', // For development flexibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gemini-Key']
}));

app.use(express.json());

// Main diagnostic check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Register api route handlers
app.use('/auth', authRoutes);
app.use('/billing', billingRoutes);
app.use('/api', cogneeRoutes);
app.use('/graph', graphRoutes);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`WeakSpot API Server running on port ${PORT}`);
  });
}

export default app;

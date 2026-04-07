import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { sessionMiddleware } from './middleware/session.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';

const app = express();

// Middleware order matters: cors -> body parser -> session -> routes -> error handler

app.use(corsMiddleware);
app.use(express.json());
app.use(sessionMiddleware);

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);

// Error handler MUST be last
app.use(errorHandler);

export default app;

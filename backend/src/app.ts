import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { sessionMiddleware } from './middleware/session.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import firmenRouter from './routes/firmen.js';
import personenRouter from './routes/personen.js';
import abteilungenRouter from './routes/abteilungen.js';
import adressenRouter from './routes/adressen.js';
import aktivitaetenRouter from './routes/aktivitaeten.js';
import chancenRouter from './routes/chancen.js';
import vertraegeRouter from './routes/vertraege.js';
import gehaelterRouter from './routes/gehaelter.js';
import dashboardRouter from './routes/dashboard.js';
import auswertungenRouter from './routes/auswertungen.js';
import savedReportsRouter from './routes/savedReports.js';
import dashboardConfigRouter from './routes/dashboardConfig.js';

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
app.use('/api/firmen', firmenRouter);
app.use('/api/personen', personenRouter);
app.use('/api/abteilungen', abteilungenRouter);
app.use('/api/adressen', adressenRouter);
app.use('/api/aktivitaeten', aktivitaetenRouter);
app.use('/api/chancen', chancenRouter);
app.use('/api/vertraege', vertraegeRouter);
app.use('/api/gehaelter', gehaelterRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/auswertungen', auswertungenRouter);
app.use('/api/saved-reports', savedReportsRouter);
app.use('/api/dashboard-config', dashboardConfigRouter);

// Error handler MUST be last
app.use(errorHandler);

export default app;

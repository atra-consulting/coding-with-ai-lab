import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runGeocodingBatch } from '../services/geocodingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/admin/geocode-addresses
 *
 * Triggers Nominatim geocoding for adresse rows that lack coordinates.
 * Pass ?force=true to re-geocode rows that already have coordinates.
 *
 * REQ-008 — Synchronous blocking behaviour:
 * This handler awaits `runGeocodingBatch` which runs sequentially (one Nominatim
 * request per address, each separated by sleepMs). For a large table this can
 * take many minutes, blocking the Node.js event loop's outbound HTTP activity
 * for the duration. Reverse proxies (nginx, AWS ALB) impose read-timeouts
 * (typically 60–300 s). Operators should raise the proxy read-timeout or use an
 * async job queue before deploying to production at scale.
 */
router.post(
  '/geocode-addresses',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const force = req.query['force'] === 'true';
    const result = await runGeocodingBatch({ force });
    res.json(result);
  }),
);

export default router;

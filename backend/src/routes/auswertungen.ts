import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { auswertungService } from '../services/auswertungService.js';
import { reportService } from '../services/reportService.js';
import { validate, ReportQuerySchema } from '../utils/validation.js';

const router = Router();
const PERM = 'AUSWERTUNGEN';

// GET /api/auswertungen/pipeline/kpis
router.get(
  '/pipeline/kpis',
  requireAuth,
  requirePermission(PERM),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(auswertungService.getPipelineKpis());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auswertungen/pipeline/by-phase
router.get(
  '/pipeline/by-phase',
  requireAuth,
  requirePermission(PERM),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(auswertungService.getPhaseAggregates());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auswertungen/pipeline/top-firmen?limit=10
router.get(
  '/pipeline/top-firmen',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const limit = req.query['limit'] ? parseInt(String(req.query['limit']), 10) : 10;
      res.json(auswertungService.getTopFirmen(isNaN(limit) || limit <= 0 ? 10 : limit));
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auswertungen/report
router.post(
  '/report',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dto = validate(ReportQuerySchema, req.body);
      res.json(reportService.executeReport(dto));
    } catch (err) {
      next(err);
    }
  }
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { dashboardService } from '../services/dashboardService.js';

const router = Router();
const ALL_ROLES = ['ADMIN', 'VERTRIEB', 'PERSONAL'];
const SALARY_ROLES = ['ADMIN', 'PERSONAL']; // NOT VERTRIEB

// GET /api/dashboard/stats
router.get(
  '/stats',
  requireAuth,
  requireRole(...ALL_ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(dashboardService.getStats());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/recent-activities
router.get(
  '/recent-activities',
  requireAuth,
  requireRole(...ALL_ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(dashboardService.getRecentActivities());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/top-companies
router.get(
  '/top-companies',
  requireAuth,
  requireRole(...ALL_ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(dashboardService.getTopCompanies());
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/salary-statistics — ADMIN and PERSONAL only, NOT VERTRIEB
router.get(
  '/salary-statistics',
  requireAuth,
  requireRole(...SALARY_ROLES),
  (_req: Request, res: Response, next: NextFunction): void => {
    try {
      res.json(dashboardService.getSalaryStatistics());
    } catch (err) {
      next(err);
    }
  }
);

export default router;

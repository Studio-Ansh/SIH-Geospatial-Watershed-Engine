import { Router, Request, Response } from 'express';
import { computeChangeDetection } from '../services/changeDetectionEngine.js';

const router = Router();

// GET /api/change-detection
router.get('/', (req: Request, res: Response) => {
  const watershedId = (req.query.watershedId as string) || 'sw-04';
  const baseYear = parseInt((req.query.baseYear as string) || '2024', 10);
  const comparisonYear = parseInt((req.query.comparisonYear as string) || '2026', 10);

  const result = computeChangeDetection(watershedId, baseYear, comparisonYear);
  res.json({ success: true, data: result });
});

export default router;

import { Router, Request, Response } from 'express';
import { activeSatelliteProvider, availableProviders } from '../services/satelliteProvider.js';

const router = Router();

// GET /api/satellite/providers
router.get('/providers', (req: Request, res: Response) => {
  res.json({
    success: true,
    activeProvider: activeSatelliteProvider.providerId,
    providers: Object.values(availableProviders).map(p => p.getStatus())
  });
});

// GET /api/satellite/layers
router.get('/layers', async (req: Request, res: Response) => {
  try {
    const providerId = (req.query.providerId as string) || activeSatelliteProvider.providerId;
    const provider = availableProviders[providerId] || activeSatelliteProvider;
    const layers = await provider.getLayers('sw-04');
    res.json({
      success: true,
      provider: provider.providerId,
      providerName: provider.providerName,
      status: provider.getStatus(),
      data: layers
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/satellite/provider-status
router.get('/provider-status', (req: Request, res: Response) => {
  const providerId = (req.query.providerId as string) || activeSatelliteProvider.providerId;
  const provider = availableProviders[providerId] || activeSatelliteProvider;
  res.json({
    success: true,
    data: provider.getStatus()
  });
});

export default router;

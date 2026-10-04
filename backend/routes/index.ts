import { Router } from 'express';
import watershedRoutes from './watershedRoutes.js';
import imageRoutes from './imageRoutes.js';
import interventionRoutes from './interventionRoutes.js';
import satelliteRoutes from './satelliteRoutes.js';
import changeDetectionRoutes from './changeDetectionRoutes.js';
import aiRoutes from './aiRoutes.js';

const apiRouter = Router();

apiRouter.use('/watersheds', watershedRoutes);
apiRouter.use('/images', imageRoutes);
apiRouter.use('/interventions', interventionRoutes);
apiRouter.use('/satellite', satelliteRoutes);
apiRouter.use('/change-detection', changeDetectionRoutes);
apiRouter.use('/ai', aiRoutes);

export default apiRouter;

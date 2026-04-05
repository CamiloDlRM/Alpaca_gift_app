import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import giftsRoutes from './modules/gifts/gifts.routes';
import kycRoutes from './modules/kyc/kyc.routes';
import agreementsRoutes from './modules/agreements/agreements.routes';
import portfolioRoutes from './modules/portfolio/portfolio.routes';
import etfsRoutes from './modules/etfs/etfs.routes';
import { errorMiddleware } from './shared/middleware/error.middleware';

// Import modules that register event listeners
import './modules/alpaca/alpaca.service';
import './modules/notifications/notifications.service';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/agreements', agreementsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/etfs', etfsRoutes);

app.use(errorMiddleware);

export default app;

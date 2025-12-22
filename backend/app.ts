import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initSentry } from './src/lib/sentry.js';

// Init Sentry
initSentry();

import loginHandler from './src/api/auth/login.js';
import signupHandler from './src/api/auth/signup.js';
import searchHandler from './src/api/spots/search.js';
import createBookingHandler from './src/api/bookings/create.js';
import checkoutHandler from './src/api/payments/checkout.js';
import webhookHandler from './src/api/payments/webhook.js';
import listBuildingsHandler from './src/api/buildings/list.js';
import healthHandler from './src/api/health.js';
import statsHandler from './src/api/admin/stats.js';
import pricesHandler from './src/api/admin/prices.js';
import forgotPasswordHandler from './src/api/auth/forgot-password.js';
import resetPasswordHandler from './src/api/auth/reset-password.js';
import workerHandler from './src/api/cron/worker.js';
import reconcileHandler from './src/api/cron/reconcile.js';
import adminAnalyticsHandler from './src/api/admin/analytics.js';
import adminUsersHandler from './src/api/admin/users.js';

import compression from 'compression';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './src/middleware/rateLimiter.js';

console.log("DEBUG: Initializing express app in app.ts");
const app = express();
app.use(compression());

// Enable Helmet
app.use((helmet as any)({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    xFrameOptions: { action: 'deny' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
        }
    }
}));

// Rate limiter disabled until Redis is fixed
// app.use(generalLimiter);

// app.use(cors({...}));
app.use(express.json());

// Shim for Vercel Request/Response
import { errorHandler } from './src/middleware/errorHandler.js';

const asyncHandler = <Req extends VercelRequest | Request = VercelRequest, Res extends VercelResponse | Response = VercelResponse>(
    fn: (req: Req, res: Res, next?: NextFunction) => Promise<any> | any
) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as Req, res as unknown as Res, next)).catch(next);
};

// All Handlers Enabled
app.post('/api/auth/login', /* authLimiter, */ asyncHandler(loginHandler));
app.post('/api/auth/signup', /* authLimiter, */ asyncHandler(signupHandler));
app.post('/api/auth/forgot-password', asyncHandler(forgotPasswordHandler));
app.post('/api/auth/reset-password', asyncHandler(resetPasswordHandler));
app.get('/api/spots/search', asyncHandler(searchHandler));
app.post('/api/bookings/create', asyncHandler(createBookingHandler));
app.post('/api/payments/checkout', asyncHandler(checkoutHandler));
app.post('/api/payments/webhook', asyncHandler(webhookHandler));
app.get('/api/buildings', asyncHandler(listBuildingsHandler));
app.get('/api/admin/stats', asyncHandler(statsHandler));
app.put('/api/admin/prices', asyncHandler(pricesHandler));

import buildingsAdminHandler from './src/api/admin/buildings.js';
app.all('/api/admin/buildings', asyncHandler(buildingsAdminHandler));

import conciergeDashboardHandler from './src/api/concierge/dashboard.js';
import conciergeVerifyHandler from './src/api/concierge/verify.js';
app.get('/api/concierge/dashboard', asyncHandler(conciergeDashboardHandler));
app.post('/api/concierge/verify', asyncHandler(conciergeVerifyHandler));

app.get('/api/cron/worker', asyncHandler(workerHandler));
app.get('/api/cron/reconcile', asyncHandler(reconcileHandler));
app.get('/api/admin/analytics', asyncHandler(adminAnalyticsHandler));
app.all('/api/admin/users', asyncHandler(adminUsersHandler));

import salesDashboardHandler from './src/api/sales/dashboard.js';
import salesBuildingsHandler from './src/api/sales/buildings.js';
app.get('/api/sales/dashboard', asyncHandler(salesDashboardHandler));
app.get('/api/sales/buildings', asyncHandler(salesBuildingsHandler));

app.get('/api/health', asyncHandler(healthHandler));

app.use(errorHandler);

export { app };

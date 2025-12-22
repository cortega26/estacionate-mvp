import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initSentry } from './lib/sentry.js';


// Init Sentry
initSentry();
import loginHandler from './api/auth/login.js';
import signupHandler from './api/auth/signup.js';
import searchHandler from './api/spots/search.js';
import createBookingHandler from './api/bookings/create.js';
import checkoutHandler from './api/payments/checkout.js';
import webhookHandler from './api/payments/webhook.js';
import listBuildingsHandler from './api/buildings/list.js';
import healthHandler from './api/health.js';
import statsHandler from './api/admin/stats.js';
import pricesHandler from './api/admin/prices.js';
import forgotPasswordHandler from './api/auth/forgot-password.js';
import resetPasswordHandler from './api/auth/reset-password.js';
import workerHandler from './api/cron/worker.js';
import reconcileHandler from './api/cron/reconcile.js';
import adminAnalyticsHandler from './api/admin/analytics.js';
import adminUsersHandler from './api/admin/users.js';

import compression from 'compression';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';

const app = express();
app.use(compression());
app.use(helmet({
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
app.use(generalLimiter);
// CORS is handled by individual Vercel-style handlers (e.g. login.ts) via lib/cors.ts wrapper.
// Do NOT add global CORS here to avoid duplicate headers and dev/prod parity issues.
// app.use(cors({...}));
app.use(express.json());

// Shim for Vercel Request/Response if needed, but Express req/res are compatible enough for basic JSON usage.
// VercelRequest extends http.IncomingMessage, Express Request does too.

import { errorHandler } from './middleware/errorHandler.js';

// ... (previous imports)

// Helper to catch async errors
// Compatible with both Express Request and VercelRequest (which extends IncomingMessage)
const asyncHandler = <Req extends VercelRequest | Request = VercelRequest, Res extends VercelResponse | Response = VercelResponse>(
    fn: (req: Req, res: Res, next?: NextFunction) => Promise<any> | any
) => (req: Request, res: Response, next: NextFunction) => {
    // Cast strict Express req/res to compatible union for the handler
    Promise.resolve(fn(req as unknown as Req, res as unknown as Res, next)).catch(next);
};

// ... (app setup)

app.post('/api/auth/login', authLimiter, asyncHandler(loginHandler));

app.post('/api/auth/signup', authLimiter, asyncHandler(signupHandler));

app.post('/api/auth/forgot-password', asyncHandler(forgotPasswordHandler));

app.post('/api/auth/reset-password', asyncHandler(resetPasswordHandler));

app.get('/api/spots/search', asyncHandler(searchHandler));

app.post('/api/bookings/create', asyncHandler(createBookingHandler));

app.post('/api/payments/checkout', asyncHandler(checkoutHandler));

app.post('/api/payments/webhook', asyncHandler(webhookHandler));

app.get('/api/buildings', asyncHandler(listBuildingsHandler));

app.get('/api/admin/stats', asyncHandler(statsHandler));

app.put('/api/admin/prices', asyncHandler(pricesHandler));

import buildingsAdminHandler from './api/admin/buildings.js';
app.all('/api/admin/buildings', asyncHandler(buildingsAdminHandler));

import conciergeDashboardHandler from './api/concierge/dashboard.js';
import conciergeVerifyHandler from './api/concierge/verify.js';

app.get('/api/concierge/dashboard', asyncHandler(conciergeDashboardHandler));

app.post('/api/concierge/verify', asyncHandler(conciergeVerifyHandler));

app.get('/api/cron/worker', asyncHandler(workerHandler));

app.get('/api/cron/reconcile', asyncHandler(reconcileHandler));

// Admin Dashboard
app.get('/api/admin/analytics', asyncHandler(adminAnalyticsHandler));

app.all('/api/admin/users', asyncHandler(adminUsersHandler));

import salesDashboardHandler from './api/sales/dashboard.js';
import salesBuildingsHandler from './api/sales/buildings.js';

app.get('/api/sales/dashboard', asyncHandler(salesDashboardHandler));

app.get('/api/sales/buildings', asyncHandler(salesBuildingsHandler));

app.get('/api/health', asyncHandler(healthHandler));

// Global Error Handler
app.use(errorHandler);

export { app };

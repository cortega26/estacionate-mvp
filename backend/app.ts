import 'dotenv/config';
import express from 'express';
import { initSentry } from './lib/sentry.js';
import { logger } from './lib/logger.js';

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

import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';

const app = express();
app.use(compression());
app.use(helmet());
app.use(generalLimiter);
// CORS is handled by individual Vercel-style handlers (e.g. login.ts) via lib/cors.ts wrapper.
// Do NOT add global CORS here to avoid duplicate headers and dev/prod parity issues.
// app.use(cors({...}));
app.use(express.json());

// Shim for Vercel Request/Response if needed, but Express req/res are compatible enough for basic JSON usage.
// VercelRequest extends http.IncomingMessage, Express Request does too.

import { errorHandler } from './middleware/errorHandler.js';
import { AppError, ErrorCode } from './lib/errors.js';

// ... (previous imports)

// Helper to catch async errors
const asyncHandler = (fn: (...args: any[]) => any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ... (app setup)

app.post('/api/auth/login', authLimiter, asyncHandler((req: any, res: any) => {
    // Cast to any to satisfy Vercel vs Express type mismatch if strict
    return loginHandler(req, res);
}));

app.post('/api/auth/signup', authLimiter, asyncHandler((req: any, res: any) => {
    return signupHandler(req, res);
}));

app.post('/api/auth/forgot-password', asyncHandler((req: any, res: any) => {
    return forgotPasswordHandler(req, res);
}));

app.post('/api/auth/reset-password', asyncHandler((req: any, res: any) => {
    return resetPasswordHandler(req, res);
}));

app.get('/api/spots/search', asyncHandler((req: any, res: any) => {
    return searchHandler(req, res);
}));

app.post('/api/bookings/create', asyncHandler((req: any, res: any) => {
    return createBookingHandler(req, res);
}));

app.post('/api/payments/checkout', asyncHandler((req: any, res: any) => {
    return checkoutHandler(req, res);
}));

app.post('/api/payments/webhook', asyncHandler((req: any, res: any) => {
    return webhookHandler(req, res);
}));

app.get('/api/buildings', asyncHandler((req: any, res: any) => {
    return listBuildingsHandler(req, res);
}));

app.get('/api/admin/stats', asyncHandler((req: any, res: any) => {
    return statsHandler(req, res);
}));

app.put('/api/admin/prices', asyncHandler((req: any, res: any) => {
    return pricesHandler(req, res);
}));

import buildingsAdminHandler from './api/admin/buildings.js';
app.all('/api/admin/buildings', asyncHandler((req: any, res: any) => {
    return buildingsAdminHandler(req, res);
}));

import conciergeDashboardHandler from './api/concierge/dashboard.js';
import conciergeVerifyHandler from './api/concierge/verify.js';

app.get('/api/concierge/dashboard', asyncHandler((req: any, res: any) => {
    return conciergeDashboardHandler(req, res);
}));

app.post('/api/concierge/verify', asyncHandler((req: any, res: any) => {
    return conciergeVerifyHandler(req, res);
}));

app.get('/api/cron/worker', asyncHandler((req: any, res: any) => {
    return workerHandler(req, res);
}));

app.get('/api/cron/reconcile', asyncHandler((req: any, res: any) => {
    return reconcileHandler(req, res);
}));

// Admin Dashboard
app.get('/api/admin/analytics', asyncHandler((req: any, res: any) => {
    return adminAnalyticsHandler(req, res);
}));

app.all('/api/admin/users', asyncHandler((req: any, res: any) => {
    return adminUsersHandler(req, res);
}));

import salesDashboardHandler from './api/sales/dashboard.js';
import salesBuildingsHandler from './api/sales/buildings.js';

app.get('/api/sales/dashboard', asyncHandler((req: any, res: any) => {
    return salesDashboardHandler(req, res);
}));

app.get('/api/sales/buildings', asyncHandler((req: any, res: any) => {
    return salesBuildingsHandler(req, res);
}));

app.get('/api/health', asyncHandler((req: any, res: any) => {
    return healthHandler(req, res);
}));

// Global Error Handler
app.use(errorHandler as any);

export { app };

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
import statsHandler from './api/admin/stats.js';
import pricesHandler from './api/admin/prices.js';
import forgotPasswordHandler from './api/auth/forgot-password.js';
import resetPasswordHandler from './api/auth/reset-password.js';
import workerHandler from './api/cron/worker.js';

import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Shim for Vercel Request/Response if needed, but Express req/res are compatible enough for basic JSON usage.
// VercelRequest extends http.IncomingMessage, Express Request does too.

app.post('/api/auth/login', (req, res) => {
    // Cast to any to satisfy Vercel vs Express type mismatch if strict
    loginHandler(req as any, res as any);
});

app.post('/api/auth/signup', (req, res) => {
    signupHandler(req as any, res as any);
});

app.post('/api/auth/forgot-password', (req, res) => {
    forgotPasswordHandler(req as any, res as any);
});

app.post('/api/auth/reset-password', (req, res) => {
    resetPasswordHandler(req as any, res as any);
});

app.get('/api/spots/search', (req, res) => {
    searchHandler(req as any, res as any);
});

app.post('/api/bookings/create', (req, res) => {
    createBookingHandler(req as any, res as any);
});

app.post('/api/payments/checkout', (req, res) => {
    checkoutHandler(req as any, res as any);
});

app.post('/api/payments/webhook', (req, res) => {
    webhookHandler(req as any, res as any);
});

app.get('/api/buildings', (req, res) => {
    listBuildingsHandler(req as any, res as any);
});

app.get('/api/admin/stats', (req, res) => {
    statsHandler(req as any, res as any);
});

app.put('/api/admin/prices', (req, res) => {
    pricesHandler(req as any, res as any);
});

import buildingsAdminHandler from './api/admin/buildings.js';
app.all('/api/admin/buildings', (req, res) => {
    buildingsAdminHandler(req as any, res as any);
});

import conciergeDashboardHandler from './api/concierge/dashboard.js';
import conciergeVerifyHandler from './api/concierge/verify.js';

app.get('/api/concierge/dashboard', (req, res) => {
    conciergeDashboardHandler(req as any, res as any);
});

app.post('/api/concierge/verify', (req, res) => {
    conciergeVerifyHandler(req as any, res as any);
});

app.get('/api/cron/worker', (req, res) => {
    workerHandler(req as any, res as any);
});

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`Local Dev Server running on http://localhost:${PORT}`);
});

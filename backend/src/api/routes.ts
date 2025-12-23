import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';

import loginHandler from './auth/login.js';
import signupHandler from './auth/signup.js';
import forgotPasswordHandler from './auth/forgot-password.js';
import resetPasswordHandler from './auth/reset-password.js';

import searchHandler from './spots/search.js';

import createBookingHandler from './bookings/create.js';
import cancelBookingHandler from './bookings/cancel.js';

import webhookHandler from './payments/webhook.js';

import listBuildingsHandler from './buildings/list.js';

import healthHandler from './health.js';

import statsHandler from './admin/stats.js';
import pricesHandler from './admin/prices.js';
import buildingsAdminHandler from './admin/buildings.js';
import adminAnalyticsHandler from './admin/analytics.js';
import adminUsersHandler from './admin/users.js';
import adminBookingsHandler from './admin/bookings.js';

import workerHandler from './cron/worker.js';
import reconcileHandler from './cron/reconcile.js';

import salesDashboardHandler from './sales/dashboard.js';
import salesBuildingsHandler from './sales/buildings.js';

import conciergeDashboardHandler from './concierge/dashboard.js';
import conciergeVerifyHandler from './concierge/verify.js';

const router = Router();

// Auth
router.post('/auth/login', asyncHandler(loginHandler));
router.post('/auth/signup', asyncHandler(signupHandler));
router.post('/auth/forgot-password', asyncHandler(forgotPasswordHandler));
router.post('/auth/reset-password', asyncHandler(resetPasswordHandler));

// Spots
router.get('/spots/search', asyncHandler(searchHandler));

// Bookings
router.post('/bookings/create', asyncHandler(createBookingHandler));
router.post('/bookings/cancel', asyncHandler(cancelBookingHandler));

// Payments
// Payments
router.post('/payments/webhook', asyncHandler(webhookHandler));

// Buildings
router.get('/buildings', asyncHandler(listBuildingsHandler));

// Admin
router.get('/admin/stats', asyncHandler(statsHandler));
router.put('/admin/prices', asyncHandler(pricesHandler));
router.all('/admin/buildings', asyncHandler(buildingsAdminHandler));
router.get('/admin/analytics', asyncHandler(adminAnalyticsHandler));
router.all('/admin/users', asyncHandler(adminUsersHandler));
router.get('/admin/bookings', asyncHandler(adminBookingsHandler));

// Cron
router.get('/cron/worker', asyncHandler(workerHandler));
router.get('/cron/reconcile', asyncHandler(reconcileHandler));

// Concierge
router.get('/concierge/dashboard', asyncHandler(conciergeDashboardHandler));
router.post('/concierge/verify', asyncHandler(conciergeVerifyHandler));

// Sales
router.get('/sales/dashboard', asyncHandler(salesDashboardHandler));
router.get('/sales/buildings', asyncHandler(salesBuildingsHandler));

// Health
router.get('/health', asyncHandler(healthHandler));

export default router;

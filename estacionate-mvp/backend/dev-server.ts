import 'dotenv/config';
import express from 'express';
import loginHandler from './api/auth/login';
import signupHandler from './api/auth/signup';
import searchHandler from './api/spots/search';
import createBookingHandler from './api/bookings/create';
import checkoutHandler from './api/payments/checkout';
import webhookHandler from './api/payments/webhook';
import listBuildingsHandler from './api/buildings/list';
import statsHandler from './api/admin/stats';
import pricesHandler from './api/admin/prices';

import cors from 'cors';

const app = express();
app.use(cors());
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Local Dev Server running on http://localhost:${PORT}`);
});

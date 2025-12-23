import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { initSentry } from './src/lib/sentry.js';

// Init Sentry
initSentry();

import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './src/middleware/errorHandler.js';
import v1Router from './src/api/routes.js';

const app = express();

// Request ID Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).id = uuidv4();
    next();
});

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

const whitelist = [
    'http://localhost:5173',
    'https://cortega26.github.io',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (whitelist.indexOf(origin) !== -1 || origin.match(/^https:\/\/.*\.vercel\.app$/)) {
            return callback(null, true)
        } else {
            console.error(`Blocked by CORS: ${origin}`);
            return callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());

// API Routes
app.use('/api/v1', v1Router);
app.use('/api', v1Router); // Backward compatibility

app.use(errorHandler);

export { app };

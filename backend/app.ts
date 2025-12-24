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
import { corsOptions } from './src/lib/cors.js';

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

// Enable CORS with centralized options
app.use(cors(corsOptions));

app.use(express.json());

// API Routes
app.use('/api/v1', v1Router);
app.use('/api', v1Router); // Backward compatibility

app.use(errorHandler);

export { app };


import { VercelRequest, VercelResponse } from '@vercel/node';
import Cors, { CorsOptions } from 'cors';
import { AppError, ErrorCode } from './errors.js';

// Centralized Whitelist
const whitelist = [
    'http://localhost:5173',
    'https://cortega26.github.io',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

const isApprovedLocalDevOrigin = (origin: string) => {
    try {
        const parsed = new URL(origin)
        const isLoopbackHost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
        const port = Number(parsed.port)

        return parsed.protocol === 'http:'
            && isLoopbackHost
            && Number.isInteger(port)
            && port >= 5173
            && port <= 5199
    } catch {
        return false
    }
}

// Helper to check origin
const checkOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1 || isApprovedLocalDevOrigin(origin) || origin.match(/^https:\/\/.*\.vercel\.app$/)) {
        return callback(null, true);
    } else {
        return callback(AppError.forbidden(ErrorCode.SYSTEM_RESOURCE_NOT_FOUND, 'CORS: Origin not allowed', undefined, { origin }));
    }
};

/**
 * Standard CORS Options for Express App
 */
export const corsOptions: CorsOptions = {
    origin: checkOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// --- Legacy Vercel Support (Wraps Express Middleware for Vercel Functions) ---

// Helper method to wait for a middleware to execute before continuing
function initMiddleware(middleware: (req: VercelRequest, res: VercelResponse, next: (err?: any) => void) => void) {
    return (req: VercelRequest, res: VercelResponse) =>
        new Promise((resolve, reject) => {
            middleware(req, res, (result: any) => {
                if (result instanceof Error) {
                    return reject(result);
                }
                return resolve(result);
            });
        });
}

export const vercelCorsMiddleware = initMiddleware(Cors(corsOptions));
export default vercelCorsMiddleware;

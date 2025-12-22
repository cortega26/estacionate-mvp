import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { logger } from './logger.js';

export function initSentry() {
    if (!process.env.SENTRY_DSN) {
        logger.warn('⚠️ Sentry initialized (Mock Mode - No DSN).');
        return;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of the transactions (adjust for prod)
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development',
    });

    logger.info('✅ Sentry initialized.');
}

// Helper to capture exceptions with context
export function captureException(error: any, context?: Record<string, any>) {
    if (!process.env.SENTRY_DSN) return;

    Sentry.captureException(error, {
        extra: context
    });
}

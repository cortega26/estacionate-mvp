import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { ZodError } from 'zod';

import { captureException } from '../lib/sentry.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let error = err;

    // 1. Transform Third-Party Errors to AppError
    if (err instanceof ZodError) {
        error = new AppError({
            code: ErrorCode.VALIDATION_BAD_REQUEST,
            statusCode: 400,
            publicMessage: 'Invalid input data',
            internalMessage: 'Zod Validation Failed',
            context: { issues: err.errors }
        });
    }

    // 2. Wrap Unknown Errors
    if (!(error instanceof AppError)) {
        // Use the original error message for internal logs, but keep public message generic
        const internalMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        error = AppError.internal(internalMsg, err);
    }

    const appError = error as AppError;

    // Capture in Sentry
    captureException(err, {
        code: appError.code,
        internalMessage: appError.internalMessage,
        requestId: (req as any).id,
        method: req.method,
        path: req.path
    });

    // 3. Structured Logging
    logger.error({
        code: appError.code,
        internalMessage: appError.internalMessage,
        context: appError.context,
        stack: appError.stack,
        method: req.method,
        path: req.path,
        ip: req.ip,
        requestId: (req as any).id
    }, `[${appError.code}] ${appError.internalMessage}`);

    // 4. Send Response
    // We include 'error' field for backward compatibility with frontend toast messages
    res.status(appError.statusCode).json({
        success: false,
        code: appError.code,
        message: appError.publicMessage,
        error: appError.publicMessage, // Back-compat
        context: appError.context,
        debug_internal: appError.internalMessage, // Exposed for now (useful for debugging, maybe hide in prod?)
        trace_id: (req as any).id, // Critical for support
        // debug_stack: appError.stack // Consider removing stack in prod
    });
};

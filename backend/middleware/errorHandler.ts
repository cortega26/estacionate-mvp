import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { ZodError } from 'zod';

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
        error = AppError.internal('Unknown error occurred', err);
    }

    const appError = error as AppError;

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
        context: appError.context
    });
};

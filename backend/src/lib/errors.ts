export enum ErrorCode {
    // Auth - Login
    AUTH_INVALID_CREDENTIALS = 'AUTH-LOGIN-1001',
    AUTH_ACCOUNT_LOCKED = 'AUTH-LOGIN-1002',
    AUTH_NOT_VERIFIED = 'AUTH-LOGIN-1003',
    AUTH_INACTIVE = 'AUTH-LOGIN-1004',

    // Auth - Token
    AUTH_INVALID_TOKEN = 'AUTH-TOKEN-1001',
    AUTH_NO_TOKEN = 'AUTH-TOKEN-1002',

    // Validation
    VALIDATION_BAD_REQUEST = 'VAL-INPUT-1001',

    // System
    SYSTEM_INTERNAL_ERROR = 'SYS-INTERNAL-5000',
    SYSTEM_METHOD_NOT_ALLOWED = 'SYS-HTTP-405',
    SYSTEM_RESOURCE_NOT_FOUND = 'SYS-RESOURCE-404'
}

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly publicMessage: string;
    public readonly internalMessage: string;
    public readonly context?: Record<string, any>;

    constructor(params: {
        code: string;
        statusCode: number;
        publicMessage: string;
        internalMessage?: string;
        context?: Record<string, any>;
        originalError?: any;
    }) {
        super(params.internalMessage || params.publicMessage);
        this.name = 'AppError';
        this.code = params.code;
        this.statusCode = params.statusCode;
        this.publicMessage = params.publicMessage;
        this.internalMessage = params.internalMessage || params.publicMessage;
        this.context = params.context;

        // Preserve stack trace
        if (params.originalError instanceof Error) {
            this.stack = params.originalError.stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Factory Methods
    static badRequest(code: string, publicMessage: string, internalMessage?: string, context?: Record<string, any>) {
        return new AppError({ code, statusCode: 400, publicMessage, internalMessage, context });
    }

    static unauthorized(code: string, publicMessage: string, internalMessage?: string, context?: Record<string, any>) {
        return new AppError({ code, statusCode: 401, publicMessage, internalMessage, context });
    }

    static forbidden(code: string, publicMessage: string, internalMessage?: string, context?: Record<string, any>) {
        return new AppError({ code, statusCode: 403, publicMessage, internalMessage, context });
    }

    static notFound(code: string, publicMessage: string, internalMessage?: string, context?: Record<string, any>) {
        return new AppError({ code, statusCode: 404, publicMessage, internalMessage, context });
    }

    static internal(internalMessage: string, originalError?: any, context?: Record<string, any>) {
        return new AppError({
            code: ErrorCode.SYSTEM_INTERNAL_ERROR,
            statusCode: 500,
            publicMessage: 'An internal server error occurred',
            internalMessage,
            originalError,
            context
        });
    }
}

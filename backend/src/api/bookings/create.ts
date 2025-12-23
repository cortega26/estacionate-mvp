import type { VercelResponse } from '@vercel/node'
import type { AuthenticatedRequest } from '../../types/express-shim.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'
import cors from '../../lib/cors.js'
import { BookingService } from '../../services/BookingService.js'
import { AppError, ErrorCode } from '../../lib/errors.js'

export default async function handler(req: AuthenticatedRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') {
        throw new AppError({
            code: ErrorCode.SYSTEM_METHOD_NOT_ALLOWED,
            statusCode: 405,
            publicMessage: 'Method not allowed'
        });
    }

    // 1. Auth Check
    const token = getTokenFromRequest(req)
    if (!token) throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Missing token');

    const user = verifyToken(token)
    if (!user) throw AppError.unauthorized(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid token');

    // Only residents can create bookings for themselves
    if (user.role !== 'RESIDENT') {
        throw AppError.forbidden(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Only residents can make bookings');
    }

    const meta = {
        ip: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'),
        userAgent: req.headers['user-agent'] || 'unknown',
        country: (req.headers['x-vercel-ip-country'] as string || 'unknown')
    };

    const bookingUser = {
        userId: user.userId,
        role: user.role!, // Asserted 'RESIDENT' above
        buildingId: user.buildingId
    };

    // 2. Delegate to Service (Validation + Creation + Payment Init)
    const result = await BookingService.createBooking(bookingUser, req.body, meta);

    return res.status(201).json({
        success: true,
        ...result // { booking, payment }
    });
}

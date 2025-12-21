import { VercelRequest, VercelResponse } from '@vercel/node';
import { SalesService } from '../../services/salesService.js';
import { verifyToken } from '../../services/auth.js';
import { AppError, ErrorCode } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Missing token');

    const decoded = verifyToken(token);
    // Explicitly check for sales_rep role, maybe allow admin too for debugging but usually this is personal
    if (!decoded || (decoded.role !== 'sales_rep' && decoded.role !== 'admin')) {
        throw AppError.forbidden(ErrorCode.AUTH_INVALID_TOKEN, 'Access denied');
    }

    try {
        const stats = await SalesService.getDashboardStats(decoded.userId);
        return res.status(200).json(stats);
    } catch (error) {
        logger.error(error, 'Sales Dashboard Error');
        throw AppError.internal('Failed to fetch dashboard stats', error);
    }
}

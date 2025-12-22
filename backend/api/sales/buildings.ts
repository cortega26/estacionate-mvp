import { VercelRequest, VercelResponse } from '@vercel/node';
import { SalesService } from '../../services/SalesService.js';
import { verifyToken } from '../../services/auth.js';
import { AppError, ErrorCode } from '../../lib/errors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Missing token');

    const decoded = verifyToken(token);
    // Explicitly check for role
    if (!decoded || (decoded.role !== 'sales_rep' && decoded.role !== 'admin')) {
        throw AppError.forbidden(ErrorCode.AUTH_INVALID_TOKEN, 'Access denied');
    }

    const buildings = await SalesService.getManagedBuildings(decoded.userId);
    return res.status(200).json(buildings);
}

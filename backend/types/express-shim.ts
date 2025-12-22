
import type { VercelRequest } from '@vercel/node';

export interface TokenPayload {
    userId: string;
    buildingId?: string;
    unitId?: string;
    role?: string;
}

export interface AuthenticatedRequest extends VercelRequest {
    user?: TokenPayload;
}

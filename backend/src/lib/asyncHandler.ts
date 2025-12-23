import { Request, Response, NextFunction } from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const asyncHandler = <Req extends VercelRequest | Request = VercelRequest, Res extends VercelResponse | Response = VercelResponse>(
    fn: (req: Req, res: Res, next?: NextFunction) => Promise<any> | any
) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as Req, res as unknown as Res, next)).catch(next);
};

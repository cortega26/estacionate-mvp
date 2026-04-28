import { verifyToken, getTokenFromRequest } from '../services/auth.js'
import { AppError, ErrorCode } from './errors.js'
import type { TokenPayload } from '../services/auth.js'
import type { VercelRequest } from '@vercel/node'
import type { Request } from 'express'

const GLOBAL_ROLES = ['admin', 'support', 'finance', 'sales_manager', 'legal_viewer'] as const
const SCOPED_ROLES = ['building_admin', 'concierge', 'sales_rep', 'committee_viewer'] as const

/**
 * Extract and verify the JWT from the request. Throws 401 if missing or invalid.
 */
export function resolveActorOrThrow(req: Request | VercelRequest): TokenPayload {
    const token = getTokenFromRequest(req as VercelRequest)
    if (!token) throw AppError.unauthorized(ErrorCode.AUTH_NO_TOKEN, 'Unauthorized')
    const actor = verifyToken(token)
    if (!actor) throw AppError.unauthorized(ErrorCode.AUTH_INVALID_TOKEN, 'Invalid token')
    return actor
}

/**
 * Verify the actor has one of the allowed roles. Throws 403 if not.
 */
export function requireRoles(actor: TokenPayload, allowed: string[]): void {
    if (!actor.role || !allowed.includes(actor.role)) {
        throw AppError.forbidden(
            ErrorCode.AUTH_INVALID_TOKEN,
            'Forbidden',
            `Role '${actor.role}' is not authorized. Required: ${allowed.join(', ')}`,
            { role: actor.role, allowedRoles: allowed }
        )
    }
}

/**
 * Derive the effective buildingId for a request.
 *
 * - Global roles (admin, support, finance, …): may pass any buildingId via params, or none
 *   to operate across all buildings.
 * - Scoped roles (building_admin, concierge, sales_rep, …): must have a buildingId in their
 *   JWT. If the request provides a buildingId that differs from the token's buildingId, throws 403.
 *
 * Returns the effective buildingId (undefined means "all buildings" for global roles).
 */
export function resolveBuildingScope(actor: TokenPayload, requestedBuildingId?: string): string | undefined {
    if (actor.role && (GLOBAL_ROLES as readonly string[]).includes(actor.role)) {
        return requestedBuildingId
    }

    if (actor.role && (SCOPED_ROLES as readonly string[]).includes(actor.role)) {
        if (!actor.buildingId) {
            throw AppError.forbidden(
                ErrorCode.AUTH_INVALID_TOKEN,
                `${actor.role} has no assigned building`,
                `Scoped actor without buildingId in token`,
                { role: actor.role }
            )
        }
        if (requestedBuildingId && requestedBuildingId !== actor.buildingId) {
            throw AppError.forbidden(
                ErrorCode.AUTH_INVALID_TOKEN,
                'Access denied to this building',
                'Scoped actor attempted cross-building access',
                { role: actor.role, tokenBuildingId: actor.buildingId, requestedBuildingId }
            )
        }
        return actor.buildingId
    }

    return requestedBuildingId
}

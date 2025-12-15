import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { parse } from 'cookie'
import type { VercelRequest } from '@vercel/node'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET is not defined in production environment')
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me'

// JWT
export interface TokenPayload {
    userId: string
    buildingId?: string
    unitId?: string
    role?: string
}

export const signToken = (payload: TokenPayload, expiresIn: string | number = '7d') => {
    const signOptions: SignOptions = { expiresIn: expiresIn as any }
    return jwt.sign({ ...payload }, JWT_SECRET, signOptions)
}

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
        return null
    }
}


export const getTokenFromRequest = (req: VercelRequest): string | null => {
    // 1. Try Cookie
    if (req.headers.cookie) {
        const cookies = parse(req.headers.cookie)
        if (cookies.token) return cookies.token
    }
    // 2. Try Header (Fallback)
    const authHeader = req.headers.authorization || req.headers.Authorization
    if (authHeader && typeof authHeader === 'string') {
        return authHeader.replace('Bearer ', '')
    }
    return null
}

// Password
export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash)
}

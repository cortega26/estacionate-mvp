import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me'

// JWT
export interface TokenPayload {
    userId: string
    buildingId: string
    unitId?: string
    role?: string
}

export const signToken = (payload: TokenPayload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn })
}

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload
    } catch (error) {
        return null
    }
}

// Password
export const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const comparePassword = async (password: string, hash: string) => {
    return bcrypt.compare(password, hash)
}

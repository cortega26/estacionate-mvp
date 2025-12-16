import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const buildings = await db.building.findMany({
            select: {
                id: true,
                name: true,
                address: true
            }
        })

        return res.status(200).json({
            success: true,
            data: buildings
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

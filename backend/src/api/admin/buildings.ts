import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'
import { verifyToken, getTokenFromRequest } from '../../services/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)

    // Auth Check
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const user = verifyToken(token)
    if (!user || user.role !== 'admin') { // Strict Admin Only
        return res.status(403).json({ error: 'Forbidden: Super Admin only' })
    }

    try {
        if (req.method === 'GET') {
            // List all buildings with detailed revenue/financial info
            // Fetch buildings
            const buildings = await db.building.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { visitorSpots: true, units: true }
                    },
                    salesRep: { select: { id: true, email: true } }
                }
            });

            const isBrief = req.query.brief === 'true';
            if (isBrief) {
                const data = buildings.map(b => ({
                    id: b.id,
                    name: b.name,
                    salesRepId: b.salesRepId,
                    salesRepCommissionRate: b.salesRepCommissionRate,
                    salesRep: b.salesRep
                }));
                return res.status(200).json({ success: true, data });
            }

            // Calculate revenue per building using Raw SQL for performance (O(1) memory vs O(N))
            const revenueStats = await db.$queryRaw<{ building_id: string, total_revenue: bigint }[]>`
                SELECT 
                    s.building_id,
                    COALESCE(SUM(b.amount_clp), 0) as total_revenue
                FROM bookings b
                JOIN availability_blocks ab ON b.availability_block_id = ab.id
                JOIN visitor_spots s ON ab.spot_id = s.id
                WHERE b.status = 'completed'
                GROUP BY s.building_id
            `;

            const revenueMap = new Map<string, number>();
            revenueStats.forEach(stat => {
                // Prisma returns BigInt for SUM, convert to Number (safe for currency < 9 quadrillion)
                revenueMap.set(stat.building_id, Number(stat.total_revenue));
            });

            const data = buildings.map(b => {
                const totalRevenue = revenueMap.get(b.id) || 0;
                // Commission Revenue = Total Revenue * Rate
                const platformRevenue = Math.round(totalRevenue * b.platformCommissionRate);

                return {
                    id: b.id,
                    name: b.name,
                    address: b.address,
                    adminCompany: b.adminCompany,
                    totalVisitorSpots: b._count.visitorSpots,
                    platformCommissionRate: b.platformCommissionRate,
                    salesRepCommissionRate: b.salesRepCommissionRate,
                    salesRep: b.salesRep,
                    softwareMonthlyFeeClp: b.softwareMonthlyFeeClp,
                    stats: {
                        totalRevenueClp: totalRevenue, // Total passing through building
                        platformCommissionClp: platformRevenue, // Our cut
                        softwareFeeClp: b.softwareMonthlyFeeClp, // Fixed fee
                        totalEarningsClp: platformRevenue + b.softwareMonthlyFeeClp // Total for Platform
                    }
                };
            });

            return res.status(200).json({ success: true, data });
        }

        if (req.method === 'PUT') {
            // Update Building Settings
            const { id, platformCommissionRate, softwareMonthlyFeeClp, name, address } = req.body;

            if (!id) return res.status(400).json({ error: 'Missing building ID' });

            const updated = await db.building.update({
                where: { id },
                data: {
                    platformCommissionRate: platformCommissionRate !== undefined ? Number(platformCommissionRate) : undefined,
                    softwareMonthlyFeeClp: softwareMonthlyFeeClp !== undefined ? Number(softwareMonthlyFeeClp) : undefined,
                    salesRepCommissionRate: req.body.salesRepCommissionRate !== undefined ? Number(req.body.salesRepCommissionRate) : undefined,
                    salesRepId: req.body.salesRepId || undefined,
                    name,
                    address
                }
            });

            return res.status(200).json({ success: true, data: updated });
        }

        return res.status(405).json({ error: 'Method not allowed' })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

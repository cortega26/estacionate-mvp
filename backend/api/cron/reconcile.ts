import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import { logger } from '../../lib/logger.js'
import { SalesService } from '../../services/salesService.js'
import { startOfYesterday, endOfYesterday } from 'date-fns'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    // Define Reconciliation Window (Yesterday, Cash Basis)
    const startDate = startOfYesterday()
    const endDate = endOfYesterday()

    logger.info({ startDate, endDate }, '[Reconcile] Starting Daily Reconciliation')

    try {
        const buildings = await db.building.findMany()
        const results = []

        for (const building of buildings) {
            // Check for existing payout to ensure idempotency
            const existingPayout = await db.payout.findFirst({
                where: {
                    buildingId: building.id,
                    periodStart: startDate,
                    periodEnd: endDate
                }
            })

            if (existingPayout) {
                logger.info({ buildingId: building.id }, '[Reconcile] Payout already exists, skipping')
                results.push({ building: building.name, status: 'skipped_exists' })
                continue
            }

            // Fetch Confirmed Bookings for this Building in the window
            // Path: Booking -> AvailabilityBlock -> VisitorSpot -> Building
            const bookings = await db.booking.findMany({
                where: {
                    status: 'confirmed',
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    },
                    availabilityBlock: {
                        spot: {
                            buildingId: building.id
                        }
                    }
                },
                include: {
                    payment: true
                }
            })

            // Calculate Totals
            let totalRevenue = 0
            let totalCommission = 0

            for (const booking of bookings) {
                totalRevenue += booking.amountClp
                totalCommission += booking.commissionClp

                // Sanity Check: Payment vs Booking Amount
                const paidAmount = booking.payment?.amountClp || 0
                if (paidAmount !== booking.amountClp) {
                    logger.error({
                        bookingId: booking.id,
                        expected: booking.amountClp,
                        actual: paidAmount
                    }, '[Reconcile] Payment Mismatch Detected!')
                }
            }

            const buildingShare = totalRevenue - totalCommission

            // Create Payout Record
            // Create Payout Record
            const payout = await db.payout.create({
                data: {
                    buildingId: building.id,
                    periodStart: startDate,
                    periodEnd: endDate,
                    totalRevenueClp: totalRevenue,
                    platformCommissionClp: totalCommission,
                    buildingShareClp: buildingShare,
                    status: 'calculated'
                }
            })

            // Calculate and Record Sales Commission if applicable
            await SalesService.calculateCommission(payout).catch(err => {
                logger.error({ error: err, payoutId: payout.id }, '[Reconcile] Failed to calculate sales commission')
            })

            logger.info({
                buildingId: building.id,
                revenue: totalRevenue,
                commission: totalCommission
            }, '[Reconcile] Payout Created')

            results.push({
                building: building.name,
                status: 'created',
                revenue: totalRevenue
            })
        }

        return res.status(200).json({ success: true, results })

    } catch (error: any) {
        logger.error({ error: error.message }, '[Reconcile] Job Failed')
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

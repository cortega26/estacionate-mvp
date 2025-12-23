import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'
import { logger } from '../../lib/logger.js'
import { SalesService } from '../../services/SalesService.js'
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
            let payout;
            try {
                payout = await db.payout.create({
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
            } catch (err: any) {
                if (err.code === 'P2002') {
                    logger.warn({ buildingId: building.id }, '[Reconcile] Race condition detected: Payout created by another process. Skipping.')
                    results.push({ building: building.name, status: 'skipped_race_condition' })
                    continue
                }
                if (err.code === 'P2003') {
                    logger.warn({ buildingId: building.id }, '[Reconcile] Race condition detected: Building deleted during processing. Skipping.')
                    results.push({ building: building.name, status: 'skipped_building_deleted' })
                    continue
                }
                // Catch other errors to avoid crashing the whole job
                logger.error({ error: err.message, buildingId: building.id }, '[Reconcile] Error processing building')
                results.push({ building: building.name, status: 'error', error: err.message })
                continue
            }

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

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : 'No stack'
        logger.error({ error: msg, stack }, '[Reconcile] Job Failed')
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

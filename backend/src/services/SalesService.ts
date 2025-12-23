import { db as prisma } from '../lib/db.js';
import { Payout, Prisma } from '@prisma/client';
import { logger } from '../lib/logger.js';

export class SalesService {
    /**
     * Calculates and creates a commission record for a Sales Rep if applicable.
     * This should be called after a Payout is successfully created/calculated.
     */
    static async calculateCommission(payout: Payout) {
        logger.info(`Calculating commission for Payout ${payout.id} (Building ${payout.buildingId})`);

        // Idempotency Check: Don't double pay
        const existing = await prisma.salesRepCommission.findFirst({
            where: { payoutId: payout.id }
        });
        if (existing) {
            logger.info(`Commission already exists for Payout ${payout.id}. Skipping.`);
            return existing;
        }

        const building = await prisma.building.findUnique({
            where: { id: payout.buildingId },
            include: { salesRep: true }
        });

        if (!building) {
            logger.error(`Building ${payout.buildingId} not found during commission calculation.`);
            return;
        }

        if (!building.salesRepId) {
            logger.info(`Building ${building.name} has no Sales Rep. Skipping commission.`);
            return;
        }

        // Commission Base: Based on Platform Commission (Net Revenue for SaaS)
        const commissionBase = payout.platformCommissionClp;

        // Use the building's specific rate (default 0.05 if not set, though schema handles default)
        const rate = building.salesRepCommissionRate || 0.05;

        const commissionAmount = Math.floor(commissionBase * rate);

        if (commissionAmount <= 0) {
            logger.info(`Calculated commission is 0 (Base: ${commissionBase}, Rate: ${rate}). Skipping.`);
            return;
        }

        // Create Commission Record

        try {
            const commission = await prisma.salesRepCommission.create({
                data: {
                    salesRepId: building.salesRepId,
                    buildingId: building.id,
                    payoutId: payout.id,
                    amountClp: commissionAmount,
                    status: 'pending',
                    periodStart: payout.periodStart,
                    periodEnd: payout.periodEnd
                }
            });
            logger.info(`Created Commission ${commission.id} for Sales Rep ${building.salesRep?.email}: ${commissionAmount} CLP`);
            return commission;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                logger.info(`Commission creation race condition caught for Payout ${payout.id}. Returning existing record.`);
                const existing = await prisma.salesRepCommission.findFirst({
                    where: { payoutId: payout.id }
                });
                return existing;
            }
            throw error;
        }



    }

    static async getDashboardStats(salesRepId: string) {
        const [totalEarnings, activeBuildingsCount, monthlyEarnings, recentCommissions] = await Promise.all([
            prisma.salesRepCommission.aggregate({
                where: { salesRepId },
                _sum: { amountClp: true }
            }),
            prisma.building.count({
                where: { salesRepId }
            }),
            prisma.salesRepCommission.aggregate({
                where: {
                    salesRepId,
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // First day of current month
                    }
                },
                _sum: { amountClp: true }
            }),
            prisma.salesRepCommission.findMany({
                where: { salesRepId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    building: {
                        select: { name: true }
                    }
                }
            })
        ]);

        return {
            totalEarnings: totalEarnings._sum.amountClp || 0,
            monthlyEarnings: monthlyEarnings._sum.amountClp || 0,
            activeBuildingsCount,
            recentCommissions: recentCommissions.map(c => ({
                ...c,
                buildingName: c.building.name
            }))
        };
    }

    static async getManagedBuildings(salesRepId: string) {
        return prisma.building.findMany({
            where: { salesRepId },
            select: {
                id: true,
                name: true,
                address: true,
                totalUnits: true,
                visitorSpotsCount: true,
                payouts: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        totalRevenueClp: true,
                        createdAt: true
                    }
                }
            }
        });
    }
}

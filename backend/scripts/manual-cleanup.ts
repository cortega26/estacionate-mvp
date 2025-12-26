
import { PrismaClient } from '@prisma/client'
import { subMinutes } from 'date-fns'

const db = new PrismaClient()

async function main() {
    console.log('Running manual cleanup...')
    const cutOffTime = subMinutes(new Date(), 15) // Clean anything older than 15 mins

    // 1. Find Expired
    const expiredBookings = await db.booking.findMany({
        where: {
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: { lt: cutOffTime }
        }
    })

    console.log(`Found ${expiredBookings.length} expired bookings.`)

    if (expiredBookings.length === 0) return

    const bookingIds = expiredBookings.map(b => b.id)
    const blockIds = expiredBookings.map(b => b.availabilityBlockId)

    // 2. Cancel Bookings
    await db.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: { status: 'cancelled', specialInstructions: 'Manual Cleanup (Fix)' }
    })

    // 3. Release Spots (if they have an availabilityBlockId - schema check might be needed if nullable)
    // Assuming schema allows it or filtering out nulls.
    // The previous file assumed all had block ids.
    const validBlockIds = blockIds.filter((id): id is string => id !== null)

    if (validBlockIds.length > 0) {
        await db.availabilityBlock.updateMany({
            where: { id: { in: validBlockIds } },
            data: { status: 'available' }
        })
    }

    console.log('Cleanup complete.')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await db.$disconnect())

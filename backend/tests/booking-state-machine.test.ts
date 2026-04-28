import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient, DurationType } from '@prisma/client'
import crypto from 'crypto'
import { BookingService } from '../src/services/BookingService.js'

const prisma = new PrismaClient()

describe('Booking State Machine', () => {
    let unique: string
    let buildingId: string
    let unitId: string
    let residentId: string
    let spotId: string
    let blockId: string

    const makeBooking = async (status: string = 'confirmed') => {
        const block = await prisma.availabilityBlock.create({
            data: {
                spotId,
                startDatetime: new Date(Date.now() + 3600_000),
                endDatetime: new Date(Date.now() + 7200_000),
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 5000,
                status: 'reserved',
            },
        })
        const booking = await prisma.booking.create({
            data: {
                residentId,
                availabilityBlockId: block.id,
                visitorName: 'Test Visitor',
                vehiclePlate: 'AB1234',
                amountClp: 5000,
                commissionClp: 500,
                status: status as any,
                confirmationCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
            },
        })
        return { booking, block }
    }

    beforeAll(async () => {
        unique = crypto.randomUUID().slice(0, 8)

        const building = await prisma.building.create({
            data: { name: `SM-${unique}`, address: 'SM St', totalUnits: 5, contactEmail: `sm-${unique}@test.com` },
        })
        buildingId = building.id

        const unit = await prisma.unit.create({ data: { buildingId, unitNumber: unique.slice(0, 5) } })
        unitId = unit.id

        const resident = await prisma.resident.create({
            data: {
                email: `sm-res-${unique}@test.com`,
                passwordHash: 'hash',
                firstName: 'SM',
                lastName: 'Test',
                unitId,
                rut: Buffer.from('enc').toString('base64'),
                rutHash: `hash-${unique}`,
                phone: Buffer.from('enc').toString('base64'),
            },
        })
        residentId = resident.id

        const spot = await prisma.visitorSpot.create({
            data: { buildingId, spotNumber: unique.slice(0, 5), isActive: true },
        })
        spotId = spot.id
    })

    afterAll(async () => {
        await prisma.accessEvent.deleteMany({ where: { booking: { residentId } } })
        await prisma.booking.deleteMany({ where: { residentId } })
        await prisma.availabilityBlock.deleteMany({ where: { spotId } })
        await prisma.visitorSpot.deleteMany({ where: { id: spotId } })
        await prisma.resident.deleteMany({ where: { id: residentId } })
        await prisma.unit.deleteMany({ where: { id: unitId } })
        await prisma.building.deleteMany({ where: { id: buildingId } })
        await prisma.$disconnect()
    })

    // ── Valid transitions ────────────────────────────────────────────────────

    it('pending → confirmed via payment_approved', async () => {
        const { booking } = await makeBooking('pending')
        const result = await BookingService.transition(booking.id, 'payment_approved', 'system')
        expect(result.status).toBe('confirmed')
    })

    it('confirmed → checked_in via check_in; creates AccessEvent', async () => {
        const { booking } = await makeBooking('confirmed')
        const actorId = 'concierge-actor-id'
        const result = await BookingService.transition(booking.id, 'check_in', actorId, {
            plateObserved: 'AB1234',
        })
        expect(result.status).toBe('checked_in')

        const events = await prisma.accessEvent.findMany({ where: { bookingId: booking.id } })
        expect(events).toHaveLength(1)
        expect(events[0].type).toBe('check_in')
        expect(events[0].actorId).toBe(actorId)
        expect(events[0].plateObserved).toBe('AB1234')
    })

    it('checked_in → checked_out via check_out; creates AccessEvent', async () => {
        const { booking } = await makeBooking('checked_in')
        const result = await BookingService.transition(booking.id, 'check_out', 'concierge-actor')
        expect(result.status).toBe('checked_out')

        const events = await prisma.accessEvent.findMany({ where: { bookingId: booking.id } })
        expect(events.some((e) => e.type === 'check_out')).toBe(true)
    })

    it('checked_in → overstay', async () => {
        const { booking } = await makeBooking('checked_in')
        const result = await BookingService.transition(booking.id, 'overstay', 'system')
        expect(result.status).toBe('overstay')
    })

    it('overstay → checked_out', async () => {
        const { booking } = await makeBooking('overstay')
        const result = await BookingService.transition(booking.id, 'check_out', 'concierge-actor')
        expect(result.status).toBe('checked_out')
    })

    it('confirmed → no_show; creates AccessEvent of type no_show_marked', async () => {
        const { booking } = await makeBooking('confirmed')
        const result = await BookingService.transition(booking.id, 'no_show', 'system')
        expect(result.status).toBe('no_show')

        const events = await prisma.accessEvent.findMany({ where: { bookingId: booking.id } })
        expect(events.some((e) => e.type === 'no_show_marked')).toBe(true)
    })

    // ── Invalid transitions ──────────────────────────────────────────────────

    it('pending → checked_in is rejected (invalid transition)', async () => {
        const { booking } = await makeBooking('pending')
        await expect(BookingService.transition(booking.id, 'check_in', 'actor')).rejects.toThrow(
            /invalid transition/i
        )
    })

    it('confirmed → check_out is rejected (must check_in first)', async () => {
        const { booking } = await makeBooking('confirmed')
        await expect(BookingService.transition(booking.id, 'check_out', 'actor')).rejects.toThrow(
            /invalid transition/i
        )
    })

    it('double check_in on same booking is rejected', async () => {
        const { booking } = await makeBooking('confirmed')
        await BookingService.transition(booking.id, 'check_in', 'actor')
        // After check_in the booking is checked_in — another check_in is invalid
        await expect(BookingService.transition(booking.id, 'check_in', 'actor')).rejects.toThrow(
            /invalid transition/i
        )
    })

    it('terminal state checked_out rejects any further transition', async () => {
        const { booking } = await makeBooking('checked_out')
        await expect(BookingService.transition(booking.id, 'no_show', 'system')).rejects.toThrow(
            /terminal state/i
        )
    })

    it('terminal state cancelled rejects any further transition', async () => {
        const { booking } = await makeBooking('cancelled')
        await expect(BookingService.transition(booking.id, 'check_in', 'actor')).rejects.toThrow(
            /terminal state/i
        )
    })
})

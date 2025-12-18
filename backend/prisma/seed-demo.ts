import { PrismaClient, DurationType, SpotStatus } from '@prisma/client'
import { hashPassword } from '../services/auth.js'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Demo Data...')

    // 1. Create Building
    const building = await prisma.building.create({
        data: {
            name: 'Edificio Demo Centro',
            address: 'Av. Providencia 2000',
            contactEmail: 'contacto@demo.cl',
            totalUnits: 50,
            visitorSpotsCount: 5
        }
    })
    console.log(`Checking Building: ${building.name}`)

    // 2. Create Units
    const unitsData = ['101', '102', '201', '202', '301']
    for (const num of unitsData) {
        await prisma.unit.create({
            data: { buildingId: building.id, unitNumber: num }
        })
    }

    // 3. Create Demo Resident
    const unit101 = await prisma.unit.findFirst({ where: { buildingId: building.id, unitNumber: '101' } })
    if (unit101) {
        const pass = await hashPassword('123456')
        const resident = await prisma.resident.create({
            data: {
                unitId: unit101.id,
                email: 'demo@resident.cl',
                firstName: 'Juan',
                lastName: 'Pérez',
                rut: '12345678-9',
                passwordHash: pass,
                isVerified: true
            }
        })
        console.log(`User Created: demo@resident.cl / 123456`)
    }

    // 4. Create Visitor Spots
    const spots = []
    for (let i = 1; i <= 5; i++) {
        const spot = await prisma.visitorSpot.create({
            data: {
                buildingId: building.id,
                spotNumber: `V-0${i}`,
                description: `Estacionamiento de Visita ${i}`
            }
        })
        spots.push(spot)
    }

    // 5. Create Availability (Next 7 Days)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const spot of spots) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(today)
            date.setDate(date.getDate() + d)

            // Create an 11h block (Morning)
            const startAM = new Date(date)
            startAM.setHours(8, 0, 0, 0)
            const endAM = new Date(date)
            endAM.setHours(19, 0, 0, 0)

            // Randomly reserve some
            const isReserved = Math.random() > 0.7

            await prisma.availabilityBlock.create({
                data: {
                    spotId: spot.id,
                    startDatetime: startAM,
                    endDatetime: endAM,
                    durationType: DurationType.ELEVEN_HOURS,
                    basePriceClp: 2500,
                    status: isReserved ? SpotStatus.reserved : SpotStatus.available
                }
            })
        }
    }
    console.log(`✅ Demo Data Seeded! You can now Search in the App.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

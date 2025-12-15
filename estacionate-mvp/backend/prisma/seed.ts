import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding...')

    const building = await prisma.building.create({
        data: {
            name: 'Torres del Parque',
            address: 'Av. Kennedy 1234',
            contactEmail: 'admin@torres.cl',
            totalUnits: 100
        }
    })

    console.log(`Created Building: ${building.id}`)

    const unit = await prisma.unit.create({
        data: {
            buildingId: building.id,
            unitNumber: '101'
        }
    })

    console.log(`Created Unit: ${unit.id} (101)`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

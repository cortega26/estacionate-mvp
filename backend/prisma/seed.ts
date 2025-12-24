import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding...')

    // Hash password for all demo users
    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Building
    const building = await prisma.building.upsert({
        where: { id: '478c9ef2-7087-42cc-a255-70200d1e7618' },
        update: {},
        create: {
            id: '478c9ef2-7087-42cc-a255-70200d1e7618',
            name: 'Torres del Parque (Demo)',
            address: 'Av. Kennedy 1234',
            contactEmail: 'admin@torres.cl',
            totalUnits: 100
        }
    })
    console.log(`Building: ${building.name}`)

    // 2. Unit
    const unit = await prisma.unit.upsert({
        where: { buildingId_unitNumber: { buildingId: building.id, unitNumber: '101' } },
        update: {},
        create: {
            buildingId: building.id,
            unitNumber: '101'
        }
    })
    console.log(`Unit: ${unit.unitNumber}`)

    // 3. Super Admin
    try {
        await prisma.user.upsert({
            where: { email: 'admin@estacionate.cl' },
            update: { passwordHash, isActive: true, role: 'admin' },
            create: {
                email: 'admin@estacionate.cl',
                role: 'admin',
                passwordHash,
                isActive: true
            }
        })
        console.log('User: admin@estacionate.cl / password123')
    } catch (e) { console.error('Error creating admin', e) }

    // 4. Building Admin
    try {
        await prisma.user.upsert({
            where: { email: 'badmin@estacionate.cl' },
            update: { passwordHash, isActive: true, role: 'building_admin', buildingId: building.id },
            create: {
                email: 'badmin@estacionate.cl',
                role: 'building_admin',
                buildingId: building.id,
                passwordHash,
                isActive: true
            }
        })
        console.log('User: badmin@estacionate.cl / password123')
    } catch (e) { console.error('Error creating building admin', e) }

    // 5. Concierge
    try {
        await prisma.user.upsert({
            where: { email: 'concierge@estacionate.cl' },
            update: { passwordHash, isActive: true, role: 'concierge', buildingId: building.id },
            create: {
                email: 'concierge@estacionate.cl',
                role: 'concierge',
                buildingId: building.id,
                passwordHash,
                isActive: true
            }
        })
        console.log('User: concierge@estacionate.cl / password123')
    } catch (e) { console.error('Error creating concierge', e) }

    // 6. Resident
    try {
        // Residents table is separate
        await prisma.resident.upsert({
            where: { email: 'resident@estacionate.cl' },
            update: { passwordHash, isVerified: true, isActive: true, unitId: unit.id },
            create: {
                unitId: unit.id,
                email: 'resident@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Resident',
                rut: '12345678-9',
                passwordHash,
                isVerified: true,
                isActive: true
            }
        })
        console.log('Resident: resident@estacionate.cl / password123')
    } catch (e) { console.error('Error creating resident', e) }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

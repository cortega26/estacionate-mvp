import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prepareResidentSensitiveFields } from '../src/lib/crypto.js'

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
            totalUnits: 100,
            isDemo: true
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
        const residentSensitiveFields = await prepareResidentSensitiveFields({ rut: '12345678-9' })

        // Residents table is separate
        await prisma.resident.upsert({
            where: { email: 'resident@estacionate.cl' },
            update: {
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: true,
                unitId: unit.id
            },
            create: {
                unitId: unit.id,
                email: 'resident@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Resident',
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: true
            }
        })
        console.log('Resident: resident@estacionate.cl / password123')
    } catch (e) { console.error('Error creating resident', e) }

    try {
        const residentSensitiveFields = await prepareResidentSensitiveFields({ rut: '12345670-0' })

        await prisma.resident.upsert({
            where: { email: 'resident-lockout@estacionate.cl' },
            update: {
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: true,
                unitId: unit.id
            },
            create: {
                unitId: unit.id,
                email: 'resident-lockout@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Lockout',
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: true
            }
        })
        console.log('Resident: resident-lockout@estacionate.cl / password123')
    } catch (e) { console.error('Error creating lockout resident', e) }

    try {
        const residentSensitiveFields = await prepareResidentSensitiveFields({ rut: '12345671-9' })

        await prisma.resident.upsert({
            where: { email: 'resident-unverified@estacionate.cl' },
            update: {
                ...residentSensitiveFields,
                passwordHash,
                isVerified: false,
                isActive: true,
                unitId: unit.id
            },
            create: {
                unitId: unit.id,
                email: 'resident-unverified@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Pending',
                ...residentSensitiveFields,
                passwordHash,
                isVerified: false,
                isActive: true
            }
        })
        console.log('Resident: resident-unverified@estacionate.cl / password123')
    } catch (e) { console.error('Error creating unverified resident', e) }

    try {
        const residentSensitiveFields = await prepareResidentSensitiveFields({ rut: '12345672-7' })

        await prisma.resident.upsert({
            where: { email: 'resident-inactive@estacionate.cl' },
            update: {
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: false,
                unitId: unit.id
            },
            create: {
                unitId: unit.id,
                email: 'resident-inactive@estacionate.cl',
                firstName: 'Demo',
                lastName: 'Inactive',
                ...residentSensitiveFields,
                passwordHash,
                isVerified: true,
                isActive: false
            }
        })
        console.log('Resident: resident-inactive@estacionate.cl / password123')
    } catch (e) { console.error('Error creating inactive resident', e) }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

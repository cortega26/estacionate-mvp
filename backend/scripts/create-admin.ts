import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../services/auth.js'

const prisma = new PrismaClient()

async function main() {
    const args = process.argv.slice(2)
    if (args.length < 2) {
        console.error('Usage: npx tsx scripts/create-admin.ts <email> <password>')
        process.exit(1)
    }

    const [email, password, roleInput, buildingId] = args

    // Default to 'admin' (Super Admin)
    let role: Role = Role.admin
    if (roleInput) {
        if (Object.values(Role).includes(roleInput as Role)) {
            role = roleInput as Role
        } else {
            console.error(`Invalid role. Available: ${Object.values(Role).join(', ')}`)
            process.exit(1)
        }
    }

    console.log(`Creating User: ${email} | Role: ${role} | Building: ${buildingId || 'All'}`)

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
        console.error('User already exists')
        process.exit(1)
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role,
            buildingId: buildingId || null,
            isActive: true
        }
    })

    console.log(`✅ Admin Created: ${user.id} (${user.email})`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

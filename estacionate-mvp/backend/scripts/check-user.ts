import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'demo@resident.cl'
    console.log(`Checking ${email}...`)

    const resident = await prisma.resident.findUnique({ where: { email } })
    console.log('Resident Table:', resident ? `FOUND (ID: ${resident.id})` : 'NOT FOUND')

    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User Table:', user ? `FOUND (ID: ${user.id})` : 'NOT FOUND')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

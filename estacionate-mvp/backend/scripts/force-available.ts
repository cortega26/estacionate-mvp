import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Make one block available
    const block = await prisma.availabilityBlock.findFirst()
    if (block) {
        await prisma.availabilityBlock.update({
            where: { id: block.id },
            data: { status: 'available' }
        })
        console.log(`✅ Forced Block ${block.id} to available`)
    } else {
        console.log('No blocks found at all.')
    }
}

main()
    .finally(() => prisma.$disconnect())

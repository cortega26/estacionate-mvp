import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Database Content ---');

    const userCount = await prisma.user.count();
    console.log(`Total Admin/Staff Users: ${userCount}`);

    if (userCount > 0) {
        const users = await prisma.user.findMany({ take: 5, select: { email: true, role: true, isActive: true } });
        console.table(users);
    }

    const residentCount = await prisma.resident.count();
    console.log(`Total Residents: ${residentCount}`);

    if (residentCount > 0) {
        const residents = await prisma.resident.findMany({ take: 5, select: { email: true, isActive: true } });
        console.table(residents);
    }

    // Check specifically for common demo users if known, e.g., admin@test.com
    const demoAdmin = await prisma.user.findUnique({ where: { email: 'admin@estacionate.cl' } }); // Guessing common demo email
    console.log('Demo Admin (admin@estacionate.cl):', demoAdmin ? 'Found' : 'Not Found');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

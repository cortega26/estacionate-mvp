import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@resident.cl';
    console.log(`Diagnosing: ${email}`);

    const resident = await prisma.resident.findUnique({
        where: { email }
    });
    console.log('Resident Table:', resident ? 'FOUND' : 'NOT FOUND');
    if (resident) {
        console.log(' - ID:', resident.id);
        console.log(' - PasswordHash:', resident.passwordHash ? 'SET' : 'NULL');
    }

    const user = await prisma.user.findUnique({
        where: { email }
    });
    console.log('User Table:', user ? 'FOUND' : 'NOT FOUND');
    if (user) {
        console.log(' - ID:', user.id);
        console.log(' - Role:', user.role);
    }
}

main()
    .finally(() => prisma.$disconnect());

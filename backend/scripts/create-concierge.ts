import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'guardia@torres.cl';
    const password = '123';

    // 1. Find the building (or first building)
    const building = await prisma.building.findFirst();
    if (!building) {
        console.error('No building found. Please seed a building first.');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Upsert Concierge User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: Role.concierge,
            buildingId: building.id
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: Role.concierge,
            buildingId: building.id,
            isActive: true
        },
    });

    console.log(`Concierge user created/updated: ${user.email} -> ${user.role} for building ${building.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

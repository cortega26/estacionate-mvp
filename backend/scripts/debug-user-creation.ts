 
 
import { PrismaClient, Role } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    const unique = crypto.randomUUID();
    console.log(`Attempting to create user with unique: ${unique}`);

    try {
        const user = await prisma.user.create({
            data: {
                email: `debug-admin-${unique}@test.com`,
                passwordHash: 'dummyhash',
                // Try minimal fields first
                role: 'admin', // Try string first, or Role.admin
                isActive: true
            }
        });
        console.log('User created successfully:', user);
    } catch (e: any) {
        console.error('FAILED TO CREATE USER');
        console.error(JSON.stringify(e, null, 2));
        // Also log message and code explicitly
        console.error('Error Code:', e.code);
        console.error('Error Message:', e.message);
        if (e.meta) console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();

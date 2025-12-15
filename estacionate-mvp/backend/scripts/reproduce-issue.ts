import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

async function main() {
    try {
        console.log('1. Logging in as demo@resident.cl...');
        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'demo@resident.cl',
            password: '123456'
        });

        const token = loginRes.data.accessToken;
        const user = loginRes.data.user;
        console.log(`✅ Logged In! Token received. User ID: ${user.id}`);

        // Verify ID matches DB
        const dbRes = await prisma.resident.findUnique({ where: { email: 'demo@resident.cl' } });
        console.log(`DB Resident ID: ${dbRes?.id}`);

        if (user.id !== dbRes?.id) {
            console.error('❌ MISMATCH! API returned different ID than DB. (Maybe looking at User table?)');
        }

        console.log('2. Finding a Spot...');
        const spotsRes = await axios.get(`${API_URL}/api/spots/search`, {
            params: { buildingId: await getBuildingId() }
        });

        const available = spotsRes.data.data.find((s: any) => s.status === 'available');
        if (!available) {
            console.error('No available spots to book.');
            return;
        }
        console.log(`Found Spot Block: ${available.id}`);

        console.log('3. Attempting Booking...');
        const bookRes = await axios.post(`${API_URL}/api/bookings/create`, {
            blockId: available.id,
            vehiclePlate: 'TEST-CLI',
            visitorName: 'Console Test'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Booking Successful! ID: ${bookRes.data.booking.id}`);

    } catch (e: any) {
        console.error('❌ Failed:', e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

async function getBuildingId() {
    // Just get the first building
    const b = await prisma.building.findFirst();
    return b?.id;
}

main();

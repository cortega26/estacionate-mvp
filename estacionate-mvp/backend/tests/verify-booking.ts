import axios from 'axios';
import { PrismaClient, DurationType } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

async function main() {
    try {
        // 0. Setup: Ensure we have a resident and a token
        const building = await prisma.building.findFirst();
        const resident = await prisma.resident.findFirst({
            where: { unit: { buildingId: building?.id } }
        });

        if (!building || !resident) {
            console.error('Run seed/verify-auth first');
            process.exit(1);
        }

        // We need a fresh token (or login again)
        // Quick login
        // Note: In real test we should login. But for speed we can self-generate one if we import `signToken`.
        // Let's use the API login to be integration-pure.
        // Need resident's email.

        let token = '';
        // We don't know the password of the first found resident if it was from previous run random email.
        // But verify-auth created one.
        // We will just create a NEW seeded resident for this test to be sure of password.

        // Actually, let's create a fresh avail block to test.
        const spot = await prisma.visitorSpot.create({
            data: {
                buildingId: building.id,
                spotNumber: `V-${Date.now().toString().slice(-4)}`,
                isActive: true
            }
        });

        // Create Availability for Tomorrow
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(8, 0, 0, 0);
        const end = new Date(start);
        end.setHours(19, 0, 0, 0); // 11h

        const block = await prisma.availabilityBlock.create({
            data: {
                spotId: spot.id,
                startDatetime: start,
                endDatetime: end,
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 5000,
                status: 'available'
            }
        });

        console.log(`✅ Seeded Block: ${block.id} (Status: ${block.status})`);

        // 1. Search
        console.log('🔄 Testing Search...');
        const searchRes = await axios.get(`${API_URL}/api/spots/search`, {
            params: { buildingId: building.id }
        });
        const found = searchRes.data.data.find((b: any) => b.id === block.id);
        if (found) console.log('✅ Search Found the block');
        else {
            console.error('❌ Search did not find the block');
            console.log(JSON.stringify(searchRes.data, null, 2));
        }

        // 2. Login (Create temp user first)
        const unique = Date.now();
        const email = `booker-${unique}@test.com`;
        const rut = `${unique.toString().slice(-8)}-K`;

        await axios.post(`${API_URL}/api/auth/signup`, {
            email, password: 'password123', rut, firstName: 'Booker', lastName: 'T',
            buildingId: building.id, unitNumber: '101'
        });

        const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
            email, password: 'password123'
        });
        token = loginRes.data.accessToken;
        console.log('✅ Logged in as Booker');

        // 3. Book
        console.log('🔄 Testing Create Booking...');
        const bookRes = await axios.post(`${API_URL}/api/bookings/create`, {
            blockId: block.id,
            vehiclePlate: 'ABCD-12',
            visitorName: 'Visitor One'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Booking Created: ${bookRes.data.booking.id} (Status: ${bookRes.data.booking.status})`);

        // 4. Verify Double Booking Fails
        console.log('🔄 Testing Double Booking (should fail)...');
        try {
            await axios.post(`${API_URL}/api/bookings/create`, {
                blockId: block.id,
                vehiclePlate: 'FAIl-00',
                visitorName: 'Visitor Two'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.error('❌ Double Booking SUCCEEDED (Should have failed)');
        } catch (e: any) {
            if (e.response?.status === 409) {
                console.log('✅ Double Booking Failed as expected (409 Conflict)');
            } else {
                console.error(`❌ Unexpected error: ${e.message}`, e.response?.data);
            }
        }

    } catch (e: any) {
        console.error(e.message, e.response?.data);
    } finally {
        await prisma.$disconnect();
    }
}

main();

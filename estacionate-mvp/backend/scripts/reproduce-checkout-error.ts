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
        console.log('✅ Logged In!');

        console.log('2. Finding an available spot directly via DB...');
        const availableBlock = await prisma.availabilityBlock.findFirst({
            where: { status: 'available' },
            include: { spot: { include: { building: true } } }
        });

        if (!availableBlock) {
            console.error('No available spots in DB. Please run force-available.ts first.');
            return;
        }
        console.log(`Found Spot Block: ${availableBlock.id} in Building: ${availableBlock.spot.building.name}`);

        // We can just proceed to booking with this block ID.
        const available = availableBlock;
        console.log(`Found Spot Block: ${available.id}`);

        console.log('3. Attempting Booking...');
        const bookRes = await axios.post(`${API_URL}/api/bookings/create`, {
            blockId: available.id,
            vehiclePlate: 'TEST-CHK',
            visitorName: 'Checkout Test'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const bookingId = bookRes.data.booking.id;
        console.log(`✅ Booking Successful! ID: ${bookingId}`);

        console.log('4. Initiating Checkout...');
        try {
            const checkoutRes = await axios.post(`${API_URL}/api/payments/checkout`, {
                bookingId
            });
            console.log('✅ Checkout Success:', checkoutRes.data);
        } catch (checkoutError: any) {
            console.error('❌ CHECKOUT 1 FAILED!');
            console.error('Status:', checkoutError.response?.status);
            console.error('Data:', JSON.stringify(checkoutError.response?.data, null, 2));
        }

        console.log('5. Retrying Checkout (Test Fix)...');
        try {
            const checkoutRes2 = await axios.post(`${API_URL}/api/payments/checkout`, {
                bookingId
            });
            console.log('✅ Checkout 2 (Retry) Success:', checkoutRes2.data);
        } catch (checkoutError: any) {
            console.error('❌ CHECKOUT 2 (RETRY) FAILED!');
            console.error('Status:', checkoutError.response?.status);
            console.error('Data:', JSON.stringify(checkoutError.response?.data, null, 2));
        }

    } catch (e: any) {
        console.error('❌ General Failure:', e.message);
        if (e.response) {
            console.error('Response Data:', e.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();

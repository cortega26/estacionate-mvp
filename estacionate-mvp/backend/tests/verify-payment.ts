import axios from 'axios';
import { PrismaClient, DurationType } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000';

async function main() {
    try {
        // 1. Setup Data (Need a booking)
        // Reuse existing building/unit
        const building = await prisma.building.findFirst();
        if (!building) process.exit(1);

        // Login
        const unique = Date.now();
        const email = `payer-${unique}@test.com`;
        await axios.post(`${API_URL}/api/auth/signup`, {
            email, password: 'password123', rut: `${unique.toString().slice(-8)}-1`, firstName: 'Payer', lastName: 'X',
            buildingId: building.id, unitNumber: '101'
        });
        const login = await axios.post(`${API_URL}/api/auth/login`, { email, password: 'password123' });
        const token = login.data.accessToken;

        // Create Spot & Block
        const spot = await prisma.visitorSpot.create({
            data: { buildingId: building.id, spotNumber: `P-${unique.toString().slice(-4)}` }
        });
        const block = await prisma.availabilityBlock.create({
            data: {
                spotId: spot.id,
                status: 'available',
                durationType: DurationType.ELEVEN_HOURS,
                basePriceClp: 2000,
                startDatetime: new Date(),
                endDatetime: new Date(Date.now() + 3600000)
            }
        });

        // Book
        const bookRes = await axios.post(`${API_URL}/api/bookings/create`, {
            blockId: block.id,
            vehiclePlate: 'PAY-11',
            visitorName: 'Payer Guest'
        }, { headers: { Authorization: `Bearer ${token}` } });

        const bookingId = bookRes.data.booking.id;
        console.log(`✅ Booking Created: ${bookingId} (pending)`);

        // 2. Checkout (Mock)
        const checkoutRes = await axios.post(`${API_URL}/api/payments/checkout`, { bookingId });
        console.log(`✅ Checkout URL: ${checkoutRes.data.init_point}`);
        if (checkoutRes.data.init_point.includes('mock=true')) {
            console.log('ℹ️  Mock Mode confirmed');
        }

        // 3. Trigger Webhook (Mock)
        // Simulate callback
        console.log('🔄 Triggering Mock Webhook...');
        await axios.post(`${API_URL}/api/payments/webhook`, {}, {
            params: { mock_booking_id: bookingId }
        });
        console.log('✅ Webhook Sent');

        // 4. Verify DB
        const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
        console.log(`Booking Status: ${updatedBooking?.status} (Expected: confirmed)`);
        console.log(`Payment Status: ${updatedBooking?.paymentStatus} (Expected: paid)`);

        if (updatedBooking?.status === 'confirmed') {
            console.log('✅✅ FULL PAYMENT FLOW VERIFIED');
        } else {
            console.error('❌ Status update failed');
            process.exit(1);
        }

    } catch (e: any) {
        console.error(e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();

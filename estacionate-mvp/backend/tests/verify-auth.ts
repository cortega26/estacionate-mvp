import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/auth';

async function main() {
    try {
        // 1. Get Context
        const building = await prisma.building.findFirst();
        const unit = await prisma.unit.findFirst();

        if (!building || !unit) {
            console.error('❌ No building/unit found. Run seed first.');
            process.exit(1);
        }
        console.log(`ℹ️  Using Building: ${building.name} (${building.id})`);

        // 2. Prepare Data
        const uniqueId = Date.now();
        const email = `test-${uniqueId}@example.com`;
        // RUT max 12 chars. Date.now() is 13.
        // Use last 9 digits: 12345678-9
        const rut = `${uniqueId.toString().slice(-8)}-${Math.floor(Math.random() * 10)}`;

        // 3. Signup
        console.log(`\n🔄 Testing Signup for ${email}...`);
        try {
            const signupRes = await axios.post(`${API_URL}/signup`, {
                email,
                password: 'securepassword123',
                rut,
                firstName: 'Test',
                lastName: 'User',
                buildingId: building.id,
                unitNumber: unit.unitNumber
            });
            console.log('✅ Signup Success:', signupRes.data);
        } catch (err: any) {
            console.error('❌ Signup Failed:', err.response?.data || err.message);
            process.exit(1);
        }

        // 4. Login
        console.log(`\n🔄 Testing Login...`);
        try {
            const loginRes = await axios.post(`${API_URL}/login`, {
                email,
                password: 'securepassword123'
            });
            console.log('✅ Login Success:', loginRes.data);
            if (loginRes.data.accessToken) console.log('✅ JWT Present');
        } catch (err: any) {
            console.error('❌ Login Failed:', err.response?.data || err.message);
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

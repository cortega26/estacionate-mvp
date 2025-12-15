import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

async function main() {
    try {
        console.log('🔄 Testing Admin Login...');
        const res = await axios.post(`${API_URL}/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });

        console.log('✅ Admin Login Success');
        console.log(`Role: ${res.data.user.role}`);
        console.log(`Token: ${res.data.accessToken ? 'Present' : 'Missing'}`);

        if (res.data.user.role !== 'admin') {
            console.error('❌ Role mismatch');
            process.exit(1);
        }

    } catch (e: any) {
        console.error('❌ Admin Login Failed', e.response?.data || e.message);
        process.exit(1);
    }
}
main();

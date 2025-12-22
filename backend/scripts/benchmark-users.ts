

import 'dotenv/config';

async function run() {
    // Dynamic import to avoid top-level load execution
    const { signToken } = await import('../src/services/auth.js');

    // 1. Create Token
    const token = signToken({
        userId: 'admin-123',
        role: 'admin',
        buildingId: undefined
    });

    console.log('Token created');

    // 2. Fetch
    const start = performance.now();
    try {
        const res = await fetch('http://localhost:3000/api/admin/users?page=1', {
            headers: {
                'Cookie': `token=${token}`
            }
        });
        const end = performance.now();

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log(`Time: ${(end - start).toFixed(2)}ms`);
        if (!res.ok) console.log(data);
    } catch (e) {
        console.error(e);
    }
}

run();

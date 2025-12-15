import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@example.com', // doesn't matter if invalid credentials, as long as we get 401, not 404 or Refused
            password: 'wrong'
        });
        console.log('Response:', res.status);
    } catch (e: any) {
        if (e.response) {
            console.log('Server Responded:', e.response.status); // 401 is GOOD (Server is up)
        } else {
            console.log('Connection Failed:', e.message); // Bad
        }
    }
}
test();

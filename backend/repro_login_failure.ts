import axios from 'axios';

async function reproLoginFailure() {
    console.log('--- Attempting Invalid Login ---');
    try {
        await axios.post('http://127.0.0.1:3000/api/auth/login', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
        }, {
            headers: {
                'Origin': 'http://localhost:5173'
            }
        });
        console.log('UNEXPECTED: Login succeeded?');
    } catch (error: any) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
            console.log('Body:', JSON.stringify(error.response.data, null, 2));

            // Check specifically for the field the frontend looks for
            if (error.response.data && error.response.data.error) {
                console.log('SUCCESS: "error" field is present:', error.response.data.error);
            } else {
                console.error('FAILURE: "error" field is MISSING in response!');
            }
        } else if (error.request) {
            console.error('FAILURE: No response received (Network/CORS?)');
            console.error(error.message);
        } else {
            console.error('FAILURE: Request setup error', error.message);
        }
    }
}

reproLoginFailure();

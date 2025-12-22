console.log('--- MANUAL START INIT ---');
import('dotenv/config');

async function start() {
    console.log('1. Importing App...');
    const { app } = await import('../app.js');
    console.log('2. App Loaded. Calling app.listen...');

    const server = app.listen(3000, '127.0.0.1', () => {
        console.log('3. SUCCESS: Server Listening on 3000');
    });

    server.on('error', (e) => console.error('SERVER ERROR:', e));
}

start().catch(e => console.error('FATAL:', e));

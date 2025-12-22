import { app } from '../app.js';
import { logger } from '../src/lib/logger.js';

console.log('--- Starting Diagnostic Server ---');
try {
    const server = app.listen(3001, () => {
        console.log('--- Server Started on Port 3001 ---');
        server.close();
        console.log('--- Server Closed ---');
        process.exit(0);
    });

    server.on('error', (err) => {
        console.error('SERVER ERROR:', err);
        process.exit(1);
    });

} catch (e) {
    console.error('SYNC ERROR:', e);
}

import 'dotenv/config';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');
    console.log('1. Environment Check');
    console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'OK' : 'MISSING');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'OK' : 'MISSING');

    console.log('2. Importing Libs');
    try {
        console.log('   > Importing crypto...');
        await import('../src/lib/crypto.js');
        console.log('   < Crypto OK');

        console.log('   > Importing logger...');
        await import('../src/lib/logger.js');
        console.log('   < Logger OK');
    } catch (e) { console.error('   LIB ERROR:', e); }

    console.log('3. Importing Services');
    try {
        console.log('   > Importing Auth Service...');
        await import('../src/services/auth.js');
        console.log('   < Auth Service OK');
    } catch (e) { console.error('   AUTH SERVICE ERROR:', e); }

    console.log('4. Importing App');
    try {
        console.log('   > Importing ../app.js...');
        await import('../app.js');
        console.log('   < App OK');
    } catch (e) { console.error('   APP ERROR:', e); }

    console.log('--- DIAGNOSTIC END ---');
    process.exit(0);
}

diagnose().catch(err => console.error('FATAL:', err));

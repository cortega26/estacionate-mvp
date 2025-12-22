import { logger } from '../lib/logger.js';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER; // e.g., 'whatsapp:+14155238886'

let client: twilio.Twilio | null = null;

if (accountSid && authToken && fromNumber) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('⚠️ Twilio Credentials missing. WhatsApp notifications will be MOCKED.');
}

/**
 * Sends a WhatsApp message using Twilio.
 * If credentials are missing, logs the message to console (Mock Mode).
 */
export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
    // Format number: Ensure it has 'whatsapp:' prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    if (!client) {
        logger.info(`[MOCK WHATSAPP] To: ${formattedTo} | Body: ${body}`);
        return true;
    }

    try {
        if (!fromNumber) throw new Error('Twilio From Number missing');

        await client.messages.create({
            from: fromNumber,
            to: formattedTo,
            body
        });
        return true;
    } catch (error) {
        console.error('Twilio Error:', error);
        return false;
    }
}

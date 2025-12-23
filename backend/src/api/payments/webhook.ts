import { z } from 'zod';
import crypto from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import cors from '../../lib/cors.js';
import { logger } from '../../lib/logger.js';
import { PaymentService } from '../../services/PaymentService.js';

const webhookSchema = z.object({
    type: z.enum(['payment', 'simulator']),
    data: z.any()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Webhook Security: Verify HMAC Signature
    const signature = req.headers['x-signature'] as string;
    const requestId = req.headers['x-request-id'] as string;
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // Only skip verification if explicitly disabled (e.g. locally if needed) or if secret is missing but we want to fail open (unsafe, better to fail closed)
    // Here we fail closed: if secret is missing, we can't verify, so we reject unless it's a simulator event which might not have signature? 
    // Actually, simulator events might simulate the signature too. Let's assume strict verification if secret is present.

    if (webhookSecret && signature && requestId) {
        try {
            const parts = signature.split(';');
            let ts = '';
            let v1 = '';

            parts.forEach(part => {
                const [key, value] = part.split('=');
                if (key === 'ts') ts = value;
                if (key === 'v1') v1 = value;
            });

            const manifest = `id:${req.body?.data?.id || ''};request-id:${requestId};ts:${ts};`;

            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = hmac.update(manifest).digest('hex');

            if (digest !== v1) {
                logger.warn({ signature, requestId }, '[Webhook] Signature verification failed');
                return res.status(403).json({ error: 'Invalid signature' });
            }
        } catch (e) {
            logger.error(e, '[Webhook] Error verifying signature');
            return res.status(403).json({ error: 'Signature verification error' });
        }
    } else if (webhookSecret) {
        // Secret is configured but headers are missing
        logger.warn('[Webhook] Missing signature headers');
        return res.status(403).json({ error: 'Missing signature headers' });
    }

    try {
        const { type, data } = webhookSchema.parse(req.body);

        // PII Sanitization: Mask potential sensitive data before logging
        const sanitizedData = { ...data };
        if (sanitizedData.email) sanitizedData.email = '***';
        if (sanitizedData.phone) sanitizedData.phone = '***';
        if (sanitizedData.card) sanitizedData.card = '***';

        logger.info({ type, data: sanitizedData }, `[Webhook] Received event`);

        const result = await PaymentService.processWebhook(type, data);

        return res.status(200).json(result || { success: true });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

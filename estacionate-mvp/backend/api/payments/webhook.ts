import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { type, data } = req.body
    const mockId = req.query.mock_booking_id as string // For testing hook trigger

    try {
        // MOCK HANDLER (Test Only)
        // CRITICAL: This bypass must NEVER be active in production.
        if (mockId && process.env.NODE_ENV === 'test') {
            console.log(`ℹ️ [TEST MODE] Mock Webhook handling Booking: ${mockId}`);
            await db.$transaction([
                db.payment.update({
                    where: { bookingId: mockId },
                    data: { status: 'approved', gatewayResponse: { mock: true } }
                }),
                db.booking.update({
                    where: { id: mockId },
                    data: { status: 'confirmed', paymentStatus: 'paid' }
                })
            ]);
            return res.status(200).send('Mock Update OK');
        }

        // REAL HANDLER (Skeleton)
        // 1. Validate Signature (HMAC)
        // 2. Fetch Payment info from MP using `data.id`
        // 3. Update DB

        // For now, simple log
        console.log('Received Webhook:', req.body);

        // We strictly need to know it's a payment
        if (type === 'payment') {
            // Logic to fetch from MP and update would go here.
            // Skipping real fetching as we don't have a token.
        }

        return res.status(200).send('OK')

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

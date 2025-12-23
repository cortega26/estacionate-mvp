import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import cors from '../../lib/cors.js'
import { PaymentService } from '../../services/PaymentService.js'

const checkoutSchema = z.object({
    bookingId: z.string().uuid()
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { bookingId } = checkoutSchema.parse(req.body)

        const result = await PaymentService.createPreference(bookingId);

        return res.status(200).json(result)

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }

        switch (error.message) {
            case 'BOOKING_NOT_FOUND':
                return res.status(404).json({ error: 'Booking not found' });
            case 'BOOKING_NOT_PENDING':
                return res.status(400).json({ error: 'Booking not pending' });
        }

        console.error('Checkout Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        })
    }
}

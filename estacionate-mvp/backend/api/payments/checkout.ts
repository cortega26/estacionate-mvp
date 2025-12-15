import type { VercelRequest, VercelResponse } from '@vercel/node'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import cors from '../../lib/cors.js'

const checkoutSchema = z.object({
    bookingId: z.string().uuid()
})

// Initialize MP client if token exists
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const client = MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res)
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { bookingId } = checkoutSchema.parse(req.body)

        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { availabilityBlock: true }
        })

        if (!booking) return res.status(404).json({ error: 'Booking not found' })
        if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking not pending' })

        // Create Payment Record (Pending)
        // Upsert to handle retries?
        // Create or Update Payment Record
        const payment = await db.payment.upsert({
            where: { bookingId: booking.id },
            update: {
                // If retrying, maybe update timestamp or status if needed. 
                // For now, ensure it's pending if we are initiating a new checkout.
                status: 'pending',
                amountClp: booking.amountClp,
            },
            create: {
                bookingId: booking.id,
                amountClp: booking.amountClp,
                paymentMethod: 'mercadopago',
                status: 'pending'
            }
        })

        // MOCK MODE: If no MP credentials, return a dummy success URL
        if (!client) {
            console.warn('⚠️ Mock Mode: Returning fake Init Point');
            return res.status(200).json({
                init_point: `http://localhost:5173/checkout/success?booking_id=${booking.id}&mock=true`, // Direct to success page
                sandbox_init_point: `http://localhost:5173/checkout/success?booking_id=${booking.id}&mock=true`
            })
        }

        // REAL MODE
        const preference = new Preference(client)
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: booking.availabilityBlockId,
                        title: `Estacionamiento Spot`, // Should fetch Spot Number
                        quantity: 1,
                        unit_price: booking.amountClp,
                        currency_id: 'CLP'
                    }
                ],
                external_reference: booking.id, // Critical for reconciliation
                back_urls: {
                    success: 'http://localhost:5173/checkout/success',
                    failure: 'http://localhost:5173/checkout/failure',
                    pending: 'http://localhost:5173/checkout/pending'
                },
                auto_return: 'approved',
                notification_url: 'https://your-domain.vercel.app/api/payments/webhook' // Must be public URL for real MP
            }
        })

        return res.status(200).json({
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        })

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors })
        }
        console.error('Checkout Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        })
    }
}

import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/db.js';
import cors from '../../lib/cors.js';
import { NotificationService } from '../../services/NotificationService.js';
import { logger } from '../../lib/logger.js';

const webhookSchema = z.object({
    type: z.enum(['payment', 'simulator']),
    data: z.any()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await cors(req, res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, data } = webhookSchema.parse(req.body);
        logger.info({ type, data }, `[Webhook] Received event`);

        // 1. SIMULATOR HANDLER (Dev/Demo Only)
        if (type === 'simulator') {
            const { bookingId, status } = data; // status: 'approved' | 'rejected' | 'pending'

            await db.$transaction(async (tx) => {
                // Update Payment
                await tx.payment.upsert({
                    where: { bookingId },
                    create: {
                        bookingId,
                        amountClp: 0, // Should be passed/fetched, but strictly update logic here
                        status,
                        paymentMethod: 'mercadopago',
                        gatewayResponse: { simulator: true }
                    },
                    update: {
                        status,
                        gatewayResponse: { simulator: true, timestamp: new Date() }
                    }
                });

                // Update Booking if Approved
                if (status === 'approved') {
                    const updatedBooking = await tx.booking.update({
                        where: { id: bookingId },
                        data: {
                            status: 'confirmed',
                            paymentStatus: 'paid',
                            specialInstructions: 'Paid via Simulator'
                        },
                        include: { availabilityBlock: true }
                    });

                    // Fire-and-forget notification (Mock or Real)
                    const dateStr = new Date(updatedBooking.availabilityBlock.startDatetime).toLocaleString('es-CL');

                    await NotificationService.sendBookingConfirmation(
                        updatedBooking.visitorPhone || '',
                        {
                            id: updatedBooking.id,
                            visitorName: updatedBooking.visitorName,
                            amountClp: updatedBooking.amountClp,
                            spotId: 'Spot #' + updatedBooking.availabilityBlock.spotId.substring(0, 4),
                            date: dateStr
                        }
                    );
                } else if (status === 'rejected') {
                    // Optional: cancel booking or keep pending? Usually keep pending for retry.
                    // But if explicit rejection, maybe we log it.
                }
            });

            logger.info({ bookingId, status }, `[Webhook] Simulator processed`);
            return res.status(200).json({ success: true, mode: 'simulator' });
        }

        // 2. REAL HANDLER (MercadoPago)
        if (type === 'payment') {
            const paymentId = data.id;
            logger.info({ paymentId }, `[Webhook] Real Payment Notification`);
            // TODO: Fetch payment from MP API using paymentId
            // const paymentInfo = await mp.payment.get(paymentId);
            // Update DB based on paymentInfo.external_reference (bookingId)
        }

        return res.status(200).send('OK');

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

import { PaymentGateway, PreferenceResult, RefundResult, WebhookResult } from './PaymentGateway.js';
import { db } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { NotificationService } from '../NotificationService.js';

interface SimulatorWebhookData {
    bookingId: string;
    status: 'approved' | 'rejected' | 'pending';
    [key: string]: unknown;
}

export class SimulatorAdapter implements PaymentGateway {
    async createPreference(
        title: string,
        quantity: number,
        unitPrice: number,
        externalReference: string,
        notificationUrl?: string
    ): Promise<PreferenceResult> {
        logger.warn('⚠️ Mock Mode: Returning fake Init Point');
        const simulatorUrl = `http://localhost:5173/payment-simulator?booking_id=${externalReference}&amount=${unitPrice}`;
        return {
            init_point: simulatorUrl,
            sandbox_init_point: simulatorUrl
        };
    }

    async refund(paymentId: string | object, amount: number): Promise<RefundResult> {
        // paymentId might be the payment DB object in simulator mode
        // In the original service, it updated the DB. Here we probably just return success and let Service update DB?
        // Or Service passes the ID.
        // Looking at original: refundPayment implementation mixes logic.
        // It updates DB first.
        // The adapter should just do the GATEWAY part.
        // But for simulator, the gateway IS the DB update effectively? 
        // No, the simulator is "Instant". 

        // Let's assume the Service handles DB updates, but for Simulator, there is no external call.
        // We just return "refunded".

        return { success: true, status: 'refunded', mode: 'simulator' };
    }

    async handleWebhook(data: unknown): Promise<WebhookResult> {
        const simulatorData = data as SimulatorWebhookData;
        const { bookingId, status } = simulatorData;

        return db.$transaction(async (tx) => {
            const existingPayment = await tx.payment.findUnique({ where: { bookingId } });

            if (existingPayment && existingPayment.status === status) {
                logger.info({ bookingId, status }, '[PaymentService] Webhook Idempotency: Payment already in target status. Skipping.');
                return { success: true, mode: 'simulator', status, idempotent: true };
            }

            await tx.payment.upsert({
                where: { bookingId },
                create: {
                    bookingId,
                    amountClp: 0, // Should be updated by caller? No, original created it here. This logic is borderline Service domain.
                    // Ideally, Adapter handles connectivity, Service handles DB.
                    // But simulator "webhook" is basically a direct service call.
                    // Let's keep the transaction logic here for now to match behavior strictly, 
                    // OR move DB logic UP to Service.

                    // DECISION: To avoid regression, we must replicate behavior.
                    // Original `handleSimulatorWebhook` did the DB transaction.
                    // If we move it to Service, we change the flow.
                    // Let's implement the DB logic here for now, or better:
                    // The Adapter `handleWebhook` should return normalized data, and the SERVICE does the DB update.
                    // BUT, `handleSimulatorWebhook` in original file DOES DB transactional updates including Booking status.
                    // It is easier to keep this logic encapsulated in the adapter for now to avoid breaking the "Service handles everything" pattern too much.
                    // WAIT. 
                    // If I put DB logic in Adapter, it's not an adapter.

                    // REFACTOR STRATEGY: 
                    // Adapter should parse webhook and return: { event: 'payment_update', bookingId, status, rawData }.
                    // Service calls `adapter.process(data)`, gets event, and updates DB.
                    // HOWEVER, The original code separates logic completely between Simulator and Real.
                    // Real one fetches from API. Simulator takes direct payload.

                    // To change as little as possible:
                    // Let `handleWebhook` doing the DB work is bad.
                    // But `PaymentService.processWebhook` delegates entire handling.

                    // Let's stick to the Interface definition: `handleWebhook(data): Promise<WebhookResult>`
                    // If the Adapter does the DB update, it works. It's a "SimulatorService" effectively.
                    // Let's assume for this Refactor (Phase 1), we move the block of logic as-is, to minimize risk.
                    status,
                    paymentMethod: 'mercadopago',
                    gatewayResponse: { simulator: true }
                },
                update: {
                    status,
                    gatewayResponse: { simulator: true, timestamp: new Date() }
                }
            });

            if (status === 'approved') {
                const booking = await tx.booking.findUnique({ where: { id: bookingId } });
                if (booking && booking.status === 'confirmed') {
                    logger.info({ bookingId }, '[PaymentService] Webhook Idempotency: Booking already confirmed. Skipping notification.');
                } else {
                    const updatedBooking = await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'confirmed', paymentStatus: 'paid', specialInstructions: 'Paid via Simulator' },
                        include: { availabilityBlock: true }
                    });

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
                }
            }

            return { success: true, mode: 'simulator', status };
        });
    }
}

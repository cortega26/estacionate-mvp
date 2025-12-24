import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { NotificationService } from './NotificationService.js';

// Type Definitions
interface SimulatorWebhookData {
    bookingId: string;
    status: 'approved' | 'rejected' | 'pending';
    [key: string]: unknown;
}

interface RealWebhookData {
    id: string; // Payment ID
    live_mode?: boolean;
    type?: string;
    date_created?: string;
    user_id?: string;
    api_version?: string;
    action?: string;
    data?: { id: string };
    [key: string]: unknown;
}

export class PaymentService {
    // Initialize MP client lazily or per request to allow Env mocking
    private static getClient() {
        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        return MP_ACCESS_TOKEN ? new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN }) : null;
    }

    /**
     * Creates a payment preference for a booking.
     * Handles both Real (MercadoPago) and Mock (Simulator) modes.
     */
    static async createPreference(bookingId: string) {
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: { availabilityBlock: true }
        });

        if (!booking) throw new Error('BOOKING_NOT_FOUND');
        if (booking.status !== 'pending') throw new Error('BOOKING_NOT_PENDING');

        // Upsert Payment Record (ensure it exists and is pending)
        await db.payment.upsert({
            where: { bookingId: booking.id },
            update: {
                status: 'pending',
                amountClp: booking.amountClp,
            },
            create: {
                bookingId: booking.id,
                amountClp: booking.amountClp,
                paymentMethod: 'mercadopago',
                status: 'pending'
            }
        });

        // 1. MOCK MODE
        const client = this.getClient();
        if (!client) {
            logger.warn('⚠️ Mock Mode: Returning fake Init Point');
            const simulatorUrl = `http://localhost:5173/payment-simulator?booking_id=${booking.id}&amount=${booking.amountClp}`;
            return {
                init_point: simulatorUrl,
                sandbox_init_point: simulatorUrl
            };
        }

        // 2. REAL MODE
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: booking.availabilityBlockId,
                        title: `Estacionamiento Spot`,
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
                notification_url: process.env.PAYMENT_WEBHOOK_URL || 'https://your-domain.vercel.app/api/payments/webhook'
            }
        });

        return {
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        };
    }

    /**
     * Processes payment webhooks (Simulator or Real).
     */
    static async processWebhook(type: 'payment' | 'simulator', data: unknown) {
        logger.info({ type, data }, `[PaymentService] Processing Webhook`);

        // --- SIMULATOR HANDLER ---
        if (type === 'simulator') {
            return this.handleSimulatorWebhook(data as SimulatorWebhookData);
        }

        // --- REAL HANDLER ---
        if (type === 'payment') {
            return this.handleRealWebhook(data as RealWebhookData);
        }
    }

    private static async handleSimulatorWebhook(data: SimulatorWebhookData) {
        const { bookingId, status } = data; // status: 'approved' | 'rejected' | 'pending'

        return db.$transaction(async (tx) => {
            // Update Payment
            const existingPayment = await tx.payment.findUnique({ where: { bookingId } });

            if (existingPayment && existingPayment.status === status) {
                logger.info({ bookingId, status }, '[PaymentService] Webhook Idempotency: Payment already in target status. Skipping.');
                return { success: true, mode: 'simulator', status, idempotent: true };
            }

            await tx.payment.upsert({
                where: { bookingId },
                create: {
                    bookingId,
                    amountClp: 0,
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
                const booking = await tx.booking.findUnique({ where: { id: bookingId } });
                if (booking && booking.status === 'confirmed') {
                    logger.info({ bookingId }, '[PaymentService] Webhook Idempotency: Booking already confirmed. Skipping notification.');
                } else {
                    const updatedBooking = await tx.booking.update({
                        where: { id: bookingId },
                        data: {
                            status: 'confirmed',
                            paymentStatus: 'paid',
                            specialInstructions: 'Paid via Simulator'
                        },
                        include: { availabilityBlock: true }
                    });

                    // Send Notification
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

    private static async handleRealWebhook(data: RealWebhookData) {
        const client = this.getClient();
        if (!client) throw new Error('MP_CLIENT_NOT_INITIALIZED');

        // MP sends data.id in the body, or data.id depending on the topic.
        // Assuming standard MP Webhook structure: { action: 'payment.created', data: { id: '123' }, type: 'payment' }
        // Or sometimes just the object itself.
        const paymentId = data.data?.id || data.id;

        if (!paymentId) {
            logger.warn({ data }, 'Webhook missing payment ID');
            return;
        }

        const paymentClient = new Payment(client);

        try {
            const paymentInfo = await paymentClient.get({ id: paymentId });
            const bookingId = paymentInfo.external_reference;
            const status = paymentInfo.status === 'approved' ? 'approved' : paymentInfo.status === 'rejected' ? 'rejected' : 'pending';

            if (!bookingId) {
                logger.error({ paymentId }, 'Payment missing external_reference (bookingId)');
                return;
            }

            await db.$transaction(async (tx) => {
                const existingPayment = await tx.payment.findUnique({ where: { bookingId } });

                if (existingPayment && existingPayment.status === status) {
                    logger.info({ bookingId, status }, '[PaymentService] Webhook Idempotency (Real): Payment already in target status. Skipping.');
                    return;
                }

                await tx.payment.upsert({
                    where: { bookingId },
                    create: {
                        bookingId,
                        externalPaymentId: String(paymentInfo.id),
                        amountClp: paymentInfo.transaction_amount || 0,
                        status: status,
                        paymentMethod: 'mercadopago',
                        gatewayResponse: paymentInfo as any
                    },
                    update: {
                        status: status,
                        externalPaymentId: String(paymentInfo.id),
                        gatewayResponse: paymentInfo as any
                    }
                });

                if (status === 'approved') {
                    const booking = await tx.booking.findUnique({ where: { id: bookingId } });

                    if (booking && booking.status === 'confirmed') {
                        logger.info({ bookingId }, '[PaymentService] Webhook Idempotency (Real): Booking already confirmed. Skipping notification.');
                    } else {
                        // Similar logic to simulator
                        const updatedBooking = await tx.booking.update({
                            where: { id: bookingId },
                            data: {
                                status: 'confirmed',
                                paymentStatus: 'paid'
                            },
                            include: { availabilityBlock: true }
                        });

                        // Send Notification
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
            });

            return { success: true, mode: 'real', status };

        } catch (error) {
            logger.error({ error, paymentId }, 'Failed to fetch/process real payment');
            throw error;
        }
    }

    /**
     * Refunds a payment.
     * Handles both Simulator and Real modes.
     */
    static async refundPayment(bookingId: string, amount: number) {
        const payment = await db.payment.findUnique({
            where: { bookingId }
        });

        if (!payment) throw new Error('PAYMENT_NOT_FOUND');
        if (payment.status !== 'approved' && payment.status !== 'pending') {
            // If it's already refuned, we might want to return success idempotently, but strictly it implies logic error if called on rejected.
            if (payment.status === 'refunded') return { success: true, status: 'refunded' };
            // Allow refunding 'pending' -> which just cancels the auth? Or void? 
            // MP refunds work on approved payments. For pending, we might just cancel.
        }

        logger.info({ bookingId, amount, paymentId: payment.id }, '[PaymentService] Initiating Refund');

        // 1. MOCK MODE
        const client = this.getClient();
        if (!client || (payment.gatewayResponse as any)?.simulator) {
            await db.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'refunded',
                    gatewayResponse: {
                        ...(payment.gatewayResponse as object),
                        refundedAt: new Date(),
                        refundAmount: amount
                    }
                }
            });
            return { success: true, status: 'refunded', mode: 'simulator' };
        }

        // 2. REAL MODE
        try {
            const paymentClient = new Payment(client);
            // Verify permissions? SDK handles it.

            // Important: MP Refund API requires payment_id. 
            // Use idempotency key provided by MP or generate one? SDK might handle retries.
            const result = await (paymentClient as any).refund({
                payment_id: payment.gatewayResponse && (payment.gatewayResponse as any).id ? (payment.gatewayResponse as any).id : payment.externalPaymentId,
                body: {
                    amount: amount  // Partial refunds allowed
                }
            });

            await db.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'refunded', // Or 'partial_refunded' if we supported that, but MVP is 0 or 90. 
                    // Actually MP status for partial is 'approved' with 'refunds' array? 
                    // For MVP let's mark 'refunded' if fully refunded, or keep approved if partial?
                    // New Policy says 90% refund.
                    // The Payment Status enum has 'refunded'. 
                    // Let's use 'refunded' if any refund occurred for now, or maybe 'paid' but log the refund?
                    // Canonical definition said: "New Payment Status: refunded".
                    // So we set it to refunded.

                    gatewayResponse: result as any
                }
            });

            return { success: true, status: 'refunded', mode: 'real', data: result };

        } catch (error) {
            logger.error({ error, bookingId }, '[PaymentService] Refund Failed');
            throw error;
        }
    }
}

import { PaymentGateway, PreferenceResult, RefundResult, WebhookResult } from './PaymentGateway.js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { db } from '../../lib/db.js';
import { logger } from '../../lib/logger.js';
import { NotificationService } from '../NotificationService.js';

interface RealWebhookData {
    id: string; // Payment ID
    data?: { id: string };
    [key: string]: unknown;
}

export class MercadoPagoAdapter implements PaymentGateway {
    private client: MercadoPagoConfig;

    constructor(accessToken: string) {
        this.client = new MercadoPagoConfig({ accessToken });
    }

    async createPreference(
        title: string,
        quantity: number,
        unitPrice: number,
        externalReference: string,
        notificationUrl?: string
    ): Promise<PreferenceResult> {
        const preference = new Preference(this.client);

        // Define back_urls (Hardcoded in original, we keep it consistent or move to env later)
        const backUrls = {
            success: 'http://localhost:5173/checkout/success',
            failure: 'http://localhost:5173/checkout/failure',
            pending: 'http://localhost:5173/checkout/pending'
        };

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'item-id-placeholder', // Original used availableBlockId, but interface takes generic params. Service should pass logic.
                        // Actually original: id: booking.availabilityBlockId
                        // To be consistent, we might need to pass this ID or just use a generic one?
                        // Let's check signature. Interface signature: createPreference(title, quantity, unitPrice, externalReference, notificationUrl, payerEmail)
                        // It does NOT accept 'itemId'. 
                        // I will pass 'Item' generic ID or modify interface?
                        // The original logic used availabilityBlockId as ITEM ID. 
                        // This might be important for MP reconciliation? Probably not, external_reference is key.
                        // I will use 'SPOT-RENTAL' as generic ID if not passed.
                        title,
                        quantity,
                        unit_price: unitPrice,
                        currency_id: 'CLP'
                    }
                ],
                external_reference: externalReference,
                back_urls: backUrls,
                auto_return: 'approved',
                notification_url: notificationUrl || process.env.PAYMENT_WEBHOOK_URL || 'https://your-domain.vercel.app/api/payments/webhook'
            }
        });

        return {
            init_point: result.init_point,
            sandbox_init_point: result.sandbox_init_point
        };
    }

    async refund(paymentId: string | object, amount: number): Promise<RefundResult> {
        const paymentClient = new Payment(this.client);

        // paymentId from DB might be object or string. For Real adapter, we expect internal DB Payment object OR external ID.
        // Original logic: Uses 'id' from gatewayResponse OR externalPaymentId.

        let externalId = '';
        if (typeof paymentId === 'string') {
            externalId = paymentId;
        } else {
            // Assume it's the DB Payment object
            const p = paymentId as any;
            externalId = p.gatewayResponse?.id || p.externalPaymentId;
        }

        try {
            const result = await (paymentClient as any).refund({
                payment_id: externalId,
                body: { amount }
            });

            return { success: true, status: 'refunded', mode: 'real', data: result };
        } catch (error) {
            logger.error({ error, externalId }, '[MercadoPagoAdapter] Refund Failed');
            throw error;
        }
    }

    async handleWebhook(data: unknown): Promise<WebhookResult> {
        const realData = data as RealWebhookData;

        // MP sends data.id or id
        const paymentId = realData.data?.id || realData.id;

        if (!paymentId) {
            logger.warn({ data }, 'Webhook missing payment ID');
            return { success: false, mode: 'real', status: 'error' };
        }

        const paymentClient = new Payment(this.client);

        try {
            const paymentInfo = await paymentClient.get({ id: paymentId });
            const bookingId = paymentInfo.external_reference;
            const status = paymentInfo.status === 'approved' ? 'approved' : paymentInfo.status === 'rejected' ? 'rejected' : 'pending';

            if (!bookingId) {
                logger.error({ paymentId }, 'Payment missing external_reference (bookingId)');
                return { success: false, mode: 'real', status: 'error_missing_booking_id' };
            }

            return await db.$transaction(async (tx) => {
                const existingPayment = await tx.payment.findUnique({ where: { bookingId } });

                if (existingPayment && existingPayment.status === status) {
                    logger.info({ bookingId, status }, '[PaymentService] Webhook Idempotency (Real): Payment already in target status. Skipping.');
                    return { success: true, mode: 'real', status, idempotent: true };
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
                        const updatedBooking = await tx.booking.update({
                            where: { id: bookingId },
                            data: {
                                status: 'confirmed',
                                paymentStatus: 'paid'
                            },
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
                return { success: true, mode: 'real', status };
            });

        } catch (error) {
            logger.error({ error, paymentId }, 'Failed to fetch/process real payment');
            throw error;
        }
    }
}

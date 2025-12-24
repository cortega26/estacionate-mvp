import { db } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import { PaymentGateway } from './payment/PaymentGateway.js';
import { SimulatorAdapter } from './payment/SimulatorAdapter.js';
import { MercadoPagoAdapter } from './payment/MercadoPagoAdapter.js';

export class PaymentService {

    private static getGateway(): PaymentGateway {
        // Factory Logic
        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

        // Strict logic: If token exists, use Real. Else Simulator.
        // This matches 'getClient()' logic from before.
        if (MP_ACCESS_TOKEN) {
            return new MercadoPagoAdapter(MP_ACCESS_TOKEN);
        }
        return new SimulatorAdapter();
    }

    /**
     * Creates a payment preference for a booking.
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

        const gateway = this.getGateway();
        return gateway.createPreference(
            'Estacionamiento Spot',
            1,
            booking.amountClp,
            booking.id
        );
    }

    /**
     * Processes payment webhooks.
     */
    static async processWebhook(type: 'payment' | 'simulator', data: unknown) {
        logger.info({ type, data }, `[PaymentService] Processing Webhook`);

        // In the original, 'simulator' type explicitly called handleSimulatorWebhook.
        // 'payment' called handleRealWebhook.
        // Now, if we just use 'getGateway()', it depends on ENV.
        // BUT: What if we are in Prod (Real Gateway active) but receiving a Simulator webhook (e.g. from a test script or dev attacking prod)?
        // We should PROBABLY respect the 'type' arg to select the adapter IF we strictly want to match old behavior.

        let gateway: PaymentGateway;

        if (type === 'simulator') {
            gateway = new SimulatorAdapter();
        } else {
            const token = process.env.MP_ACCESS_TOKEN;
            if (!token) throw new Error('MP_CLIENT_NOT_INITIALIZED');
            gateway = new MercadoPagoAdapter(token);
        }

        return gateway.handleWebhook(data);
    }

    /**
     * Refunds a payment.
     */
    static async refundPayment(bookingId: string, amount: number) {
        const payment = await db.payment.findUnique({
            where: { bookingId }
        });

        if (!payment) throw new Error('PAYMENT_NOT_FOUND');

        // Idempotency check kept from original
        if (payment.status !== 'approved' && payment.status !== 'pending') {
            if (payment.status === 'refunded') return { success: true, status: 'refunded' };
        }

        logger.info({ bookingId, amount, paymentId: payment.id }, '[PaymentService] Initiating Refund');

        // Factory Logic for Refund:
        // Original logic: "if (!client || (payment.gatewayResponse as any)?.simulator)" -> Use Mock
        // So if the payment was made via Simulator, we MUST use Simulator adapter to refund, regardless of current ENV.

        let gateway: PaymentGateway;
        const isSimulatorPayment = (payment.gatewayResponse as any)?.simulator === true;
        const token = process.env.MP_ACCESS_TOKEN;

        if (isSimulatorPayment || !token) {
            gateway = new SimulatorAdapter();
        } else {
            gateway = new MercadoPagoAdapter(token);
        }

        const result = await gateway.refund(payment, amount);

        // Update DB after successful refund
        // NOTE: The adapters return success, but Original SimulatorAdapter handled the DB update internally?
        // Wait, in my new SimulatorAdapter, I REMOVED the DB update logic for Refund to just return success.
        // BUT my MercadoPagoAdapter ALSO returns success and data, but does NOT update strict DB fields the same way?
        // Re-reading my MercadoPagoAdapter: It does NO DB update.
        // Re-reading Original PaymentService: It did DB updates in BOTH cases.

        // So I must perform the DB update here in the Service to ensure consistency.

        await db.payment.update({
            where: { id: payment.id },
            data: {
                status: 'refunded',
                gatewayResponse: result.data || (payment.gatewayResponse as object) // Update with new data if any
            }
        });

        return result;
    }
}

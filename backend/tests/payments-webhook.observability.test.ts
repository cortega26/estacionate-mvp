import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../src/api/payments/webhook.js'
import { logger } from '../src/lib/logger.js'
import { PaymentService } from '../src/services/PaymentService.js'

vi.mock('../src/lib/cors.js', () => ({
    default: vi.fn(async () => undefined),
}))

vi.mock('../src/lib/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('../src/services/PaymentService.js', () => ({
    PaymentService: {
        processWebhook: vi.fn(),
    },
}))

const createResponse = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    end: vi.fn(),
})

describe('Payments webhook observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.MP_WEBHOOK_SECRET
    })

    it('returns 500 and logs structured context when webhook processing fails', async () => {
        vi.mocked(PaymentService.processWebhook).mockRejectedValue(new Error('payment-webhook-failure'))

        const req: any = {
            method: 'POST',
            headers: { origin: 'http://localhost:5173' },
            body: {
                type: 'simulator',
                data: {
                    bookingId: 'booking-1',
                    status: 'approved',
                },
            },
        }
        const res: any = createResponse()

        await handler(req, res)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' })
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                route: 'payments.webhook',
                eventType: 'simulator',
                eventDataId: undefined,
            }),
            expect.stringMatching(/webhook error/i)
        )
    })
})

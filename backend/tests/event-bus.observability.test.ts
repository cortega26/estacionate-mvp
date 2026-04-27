import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../src/lib/db.js'
import { publisher, connectPubSub } from '../src/lib/redis-pubsub.js'
import { logger } from '../src/lib/logger.js'
import type { AuditEvent } from '../src/lib/event-bus.js'

let messageHandler: ((channel: string, message: string) => void) | undefined

vi.mock('../src/lib/db.js', () => ({
    db: {
        auditLog: {
            create: vi.fn(),
        },
    },
    ActorType: {
        USER: 'USER',
        SYSTEM: 'SYSTEM',
    },
}))

vi.mock('../src/lib/redis-pubsub.js', () => ({
    connectPubSub: vi.fn(async () => undefined),
    publisher: {
        publish: vi.fn(async () => 1),
    },
    subscriber: {
        subscribe: vi.fn((_: string, cb: (err: Error | null) => void) => cb(null)),
        on: vi.fn((event: string, handler: (channel: string, message: string) => void) => {
            if (event === 'message') {
                messageHandler = handler
            }
        }),
    },
}))

vi.mock('../src/lib/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    },
}))

describe('EventBus observability', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        messageHandler = undefined
        vi.mocked(connectPubSub).mockResolvedValue(undefined)
        vi.mocked(publisher.publish).mockResolvedValue(1)
        vi.mocked(db.auditLog.create).mockResolvedValue({} as any)
    })

    it('logs a structured error when redis initialization fails', async () => {
        vi.mocked(connectPubSub).mockRejectedValue(new Error('redis-init-failure'))
        const { EventBus } = await import('../src/lib/event-bus.js')
        ;(EventBus as any).instance = undefined

        EventBus.getInstance()
        await Promise.resolve()

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                channel: 'DISTRIBUTED_EVENT_BUS',
            }),
            expect.stringMatching(/init redis failed/i)
        )
    })

    it('logs a structured error when redis message payload cannot be parsed', async () => {
        const { EventBus } = await import('../src/lib/event-bus.js')
        ;(EventBus as any).instance = undefined

        EventBus.getInstance()
        await Promise.resolve()
        expect(messageHandler).toBeDefined()

        messageHandler?.('DISTRIBUTED_EVENT_BUS', '{not-json')

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                channel: 'DISTRIBUTED_EVENT_BUS',
                rawMessage: '{not-json',
            }),
            expect.stringMatching(/parse error/i)
        )
    })

    it('logs a structured error when redis publish fails', async () => {
        vi.mocked(publisher.publish).mockRejectedValue(new Error('redis-publish-failure'))
        const { EventBus, EventType } = await import('../src/lib/event-bus.js')
        ;(EventBus as any).instance = undefined
        const bus = EventBus.getInstance()

        const event: AuditEvent = {
            actorId: 'actor-1',
            actorType: 'SYSTEM' as any,
            action: EventType.TEST_ACTION,
        }

        await bus.publish(event)
        await Promise.resolve()

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                channel: 'DISTRIBUTED_EVENT_BUS',
                action: EventType.TEST_ACTION,
                actorId: 'actor-1',
            }),
            expect.stringMatching(/publish error/i)
        )
    })

    it('logs a structured error when audit persistence fails', async () => {
        vi.mocked(db.auditLog.create).mockRejectedValue(new Error('audit-persist-failure'))
        const { EventBus, EventType } = await import('../src/lib/event-bus.js')
        ;(EventBus as any).instance = undefined
        const bus = EventBus.getInstance()

        const event: AuditEvent = {
            actorId: 'actor-2',
            actorType: 'USER' as any,
            action: EventType.BOOKING_CREATED,
            entityId: 'booking-1',
        }

        await bus.publish(event)

        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                action: EventType.BOOKING_CREATED,
                actorId: 'actor-2',
                entityId: 'booking-1',
            }),
            expect.stringMatching(/persist event failed/i)
        )
    })
})

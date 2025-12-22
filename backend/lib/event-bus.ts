
import { db, ActorType } from './db.js';
import { publisher, subscriber, connectPubSub } from './redis-pubsub.js';
import { logger } from './logger.js';

export enum EventType {
    // System Events
    SYSTEM_STARTUP = 'SYSTEM_STARTUP',
    SYSTEM_ERROR = 'SYSTEM_ERROR',

    // Auth Events
    USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
    USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',

    // Business Logic Events
    BOOKING_CREATED = 'BOOKING_CREATED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',

    // Generic
    TEST_ACTION = 'TEST_ACTION',

    // Audit
    AUDIT_LOG_CREATED = 'AUDIT_LOG_CREATED',

    // Security
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

export interface AuditEvent {
    actorId: string;
    actorType: ActorType;
    action: EventType | string;
    entityId?: string;
    entityType?: 'User' | 'Booking' | 'Building' | 'System' | string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: number;
    originInstanceId?: string; // To prevent infinite loops if we rebroadcast
}

type EventHandler = (event: AuditEvent) => Promise<void>;

const CHANNEL_NAME = 'DISTRIBUTED_EVENT_BUS';
const INSTANCE_ID = Math.random().toString(36).substring(7);

export class EventBus {
    private static instance: EventBus;
    private subscribers: Map<string, EventHandler[]> = new Map();
    private isRedisConnected = false;

    private constructor() {
        this.initializeRedis();

        // 1. Subscribe to Audit Persistence (Always runs on every instance eventually, 
        // but ideally only one instance should write to DB to allow read-replicas. 
        // For MVP, every instance writing their OWN events is fine. 
        // Wait, if I publish to Redis, ALL instances receive it. 
        // Only the ORIGIN should persist to DB? Or a dedicated "WriterService"?
        // Let's decided: Only the instance that GENERATED the event persists it to DB initially. 
        // Redis uses for side-effects (Notifications, Cache Invalidation).

        this.subscribeToAll(async (event) => {
            // Only persist if we are the origin, OR if we want redundant logging.
            // Actually, `publish` calls persist directly usually. 
            // Let's decouple: `publish` -> Persist DB -> Publish Redis
            if (event.originInstanceId === INSTANCE_ID) {
                await this.persistEvent(event);
            }
        });
    }

    private async initializeRedis() {
        try {
            await connectPubSub();

            subscriber.subscribe(CHANNEL_NAME, (err) => {
                if (err) console.error('[EventBus] Redis Subscribe Error:', err);
                else {
                    this.isRedisConnected = true;
                    logger.info(`[EventBus] Subscribed to ${CHANNEL_NAME} as ${INSTANCE_ID}`);
                }
            });

            subscriber.on('message', (channel, message) => {
                if (channel === CHANNEL_NAME) {
                    this.handleRedisMessage(message);
                }
            });
        } catch (error) {
            console.error('[EventBus] Failed to init Redis:', error);
        }
    }

    private async handleRedisMessage(rawMessage: string) {
        try {
            const event: AuditEvent = JSON.parse(rawMessage);

            // Ignore events sent by MYSELF (loopback prevention for side-effects if needed)
            if (event.originInstanceId === INSTANCE_ID) return;

            // Trigger local subscribers (e.g. Cache Invalidators on other pods)
            this.triggerLocalHandlers(event);

        } catch (error) {
            console.error('[EventBus] Parse error:', error);
        }
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    public subscribe(eventType: EventType, handler: EventHandler): void {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType)?.push(handler);
    }

    public subscribeToAll(handler: EventHandler): void {
        this.subscribe('*' as any, handler);
    }

    public async publish(event: AuditEvent): Promise<void> {
        // 1. Tag Event
        event.timestamp = Date.now();
        event.originInstanceId = INSTANCE_ID;

        // 2. Trigger Local Handlers (Immediate feedback)
        await this.triggerLocalHandlers(event);

        // 3. Publish to Redis (Async distribution)
        if (this.isRedisConnected) {
            publisher.publish(CHANNEL_NAME, JSON.stringify(event)).catch(err => {
                console.error('[EventBus] Redis Publish Error:', err);
            });
        }
    }

    private async triggerLocalHandlers(event: AuditEvent) {
        // Notify specific subscribers
        const specificHandlers = this.subscribers.get(event.action) || [];
        // Notify "all" subscribers
        const globalHandlers = this.subscribers.get('*') || [];

        const allHandlers = [...specificHandlers, ...globalHandlers];

        // Execute handlers
        await Promise.allSettled(allHandlers.map(h => h(event)));
    }

    private async persistEvent(event: AuditEvent): Promise<void> {
        try {
            await db.auditLog.create({
                data: {
                    actorId: event.actorId,
                    actorType: event.actorType,
                    action: event.action,
                    entityId: event.entityId,
                    entityType: event.entityType,
                    metadata: event.metadata || {},
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                },
            });
        } catch (error) {
            console.error('[EventBus] Failed to persist event:', error);
        }
    }
}

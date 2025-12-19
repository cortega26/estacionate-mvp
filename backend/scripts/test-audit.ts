
import { EventBus, EventType, AuditEvent } from '../lib/event-bus.ts';
import { db, ActorType } from '../lib/db.ts';

async function main() {
    console.log('🧪 Starting Audit System Verification...');

    // 1. Initialize EventBus
    const eventBus = EventBus.getInstance();

    // 2. Define a Test Event
    const testEvent: AuditEvent = {
        actorId: 'Gemini-Verification-Script',
        actorType: ActorType.AGENT,
        action: EventType.TEST_ACTION,
        entityId: 'test-entity-123',
        entityType: 'SystemProbe',
        metadata: {
            testRunId: new Date().toISOString(),
            verificationStatus: 'PENDING'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Node/TestScript'
    };

    // 3. Publish Event
    console.log('📢 Publishing test event...');
    await eventBus.publish(testEvent);

    // 4. Verify in Database
    console.log('🔍 Verifying database persistence...');
    await new Promise(r => setTimeout(r, 1000));

    const log = await db.auditLog.findFirst({
        where: {
            action: EventType.TEST_ACTION,
            actorId: 'Gemini-Verification-Script',
            entityId: 'test-entity-123'
        },
        orderBy: {
            occurredAt: 'desc'
        }
    });

    if (log) {
        console.log('✅ SUCCESS: Audit Log found!');
        console.log(JSON.stringify(log, null, 2));

        await db.auditLog.delete({ where: { id: log.id } });
        console.log('🧹 Cleanup: Deleted test log.');
    } else {
        console.error('❌ FAILURE: Audit Log NOT found.');
        process.exit(1);
    }
}

main()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

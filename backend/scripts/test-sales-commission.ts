

/* eslint-disable @typescript-eslint/ban-ts-comment */

import { db } from '../lib/db.js';
import { SalesService } from '../services/SalesService.js';
import { hashPassword } from '../services/auth.js';

async function main() {
    console.log('Testing Sales Commission Logic...');

    // 1. Create Sales Rep
    const repEmail = `salesrep_${Date.now()}@test.com`;
    // We mock hashPassword or import it. It's in services/auth.ts
    const passwordHash = await hashPassword('password123');

    const salesRep = await db.user.create({
        data: {
            email: repEmail,
            role: 'sales_rep' as any,
            passwordHash
        }
    });
    console.log(`Created Sales Rep: ${salesRep.email} (${salesRep.id})`);

    // 2. Create Building assigned to Rep
    // @ts-ignore
    const building = await db.building.create({
        data: {
            name: `Test Building ${Date.now()}`,
            address: '123 Test St',
            totalUnits: 10,
            contactEmail: 'admin@building.com',
            salesRepId: salesRep.id,
            salesRepCommissionRate: 0.10 // 10%
        }
    });
    console.log(`Created Building: ${building.name} (${building.id}) with 10% commission`);

    // 3. Create Payout
    // Payout usually created by reconcile, but we can manually create one to test calculateCommission
    // Platform Revenue = 10,000 CLP
    const payout = await db.payout.create({
        data: {
            buildingId: building.id,
            periodStart: new Date(),
            periodEnd: new Date(),
            totalRevenueClp: 100000, // 100k
            platformCommissionClp: 10000, // 10k (Our rev)
            buildingShareClp: 90000,
            status: 'calculated'
        }
    });
    console.log(`Created Payout: ${payout.id} with Platform Rev: ${payout.platformCommissionClp}`);

    // 4. Trigger Commission Calculation
    console.log('Triggering SalesService.calculateCommission...');
    const commission = await SalesService.calculateCommission(payout);

    if (commission) {
        console.log('SUCCESS: Commission Created!');
        console.log(`Amount: ${commission.amountClp} CLP`);
        console.log(`Expected: ${10000 * 0.10} CLP`); // 1000

        if (commission.amountClp === 1000) {
            console.log('VERIFICATION PASSED');
        } else {
            console.error('VERIFICATION FAILED: Incorrect Amount');
        }

        // Test Dashboard Stats
        console.log('Testing Dashboard Stats...');
        const stats = await SalesService.getDashboardStats(salesRep.id);
        console.log('Stats:', stats);
        if (stats.totalEarnings === 1000 && stats.activeBuildingsCount === 1) {
            console.log('DASHBOARD STATS VERIFIED');
        } else {
            console.log('DASHBOARD STATS FAILED');
        }

    } else {
        console.error('VERIFICATION FAILED: No commission created');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await db.$disconnect();
    });

import { describe, it, expect } from 'vitest';
import { calculateCommission, calculateBuildingShare } from '../../lib/payments.js';

describe('Payment Utilities', () => {
    describe('calculateCommission', () => {
        it('should calculate 10% commission correctly', () => {
            expect(calculateCommission(10000, 0.10)).toBe(1000);
        });

        it('should ceil fractional results (no cents in CLP)', () => {
            // 10% of 12345 is 1234.5 -> should be 1235
            expect(calculateCommission(12345, 0.10)).toBe(1235);
        });

        it('should handle zero amount', () => {
            expect(calculateCommission(0, 0.10)).toBe(0);
        });

        it('should throw error on negative amount', () => {
            expect(() => calculateCommission(-100)).toThrow('Amount cannot be negative');
        });
    });

    describe('calculateBuildingShare', () => {
        it('should return total minus commission', () => {
            const total = 10000;
            const rate = 0.10;
            const commission = calculateCommission(total, rate); // 1000
            expect(calculateBuildingShare(total, rate)).toBe(total - commission);
        });
    });
});

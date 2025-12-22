import { describe, it, expect } from 'vitest'
import { calculateBookingPricing } from '../src/lib/domain/pricing.js'

describe('S1 Fix: Commission Logic', () => {
    it('should calculate commission based on dynamic rate provided', () => {
        const basePrice = 10000

        // Scenario 1: Default 10% (0.10)
        // Expected: 1000 CLP
        const defaultResult = calculateBookingPricing(basePrice, 0.10)
        expect(defaultResult.commissionClp).toBe(1000)
        expect(defaultResult.ownerAmountClp).toBe(9000)

        // Scenario 2: Custom Building Rate 20% (0.20)
        // Expected: 2000 CLP
        const customResult = calculateBookingPricing(basePrice, 0.20)
        expect(customResult.commissionClp).toBe(2000)
        expect(customResult.ownerAmountClp).toBe(8000)
    })
})

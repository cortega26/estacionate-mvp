import { APP_CONSTANTS } from '../constants.js'

/**
 * Calculates the total price and commission for a booking using Integer Math.
 * 
 * @param basePriceClp - The base price of the parking spot in CLP (Integer)
 * @param commissionRate - The commission rate as a decimal (e.g., 0.10 for 10%)
 * @param multiplier - Yield management multiplier (default: 1.0)
 * @returns Object containing commission and final payout distribution
 */
export function calculateBookingPricing(basePriceClp: number, commissionRate: number, multiplier: number = 1.0) {
    if (!Number.isInteger(basePriceClp)) {
        throw new Error('Base Price must be an integer')
    }
    if (basePriceClp < 0) {
        throw new Error('Amount cannot be negative')
    }

    // Apply Multiplier (Yield Management)
    // Example: 5000 * 2.0 = 10000
    const finalPriceClp = Math.ceil(basePriceClp * multiplier);

    // Commission is based on the FINAL price
    // Example: 10000 * 0.10 = 1000
    const commissionClp = Math.ceil(finalPriceClp * commissionRate)

    // Remaining amount for the building/owner
    const ownerAmountClp = finalPriceClp - commissionClp

    return {
        totalAmountClp: finalPriceClp,
        commissionClp,
        ownerAmountClp,
        originalPriceClp: basePriceClp,
        appliedMultiplier: multiplier
    }
}

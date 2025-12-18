import { APP_CONSTANTS } from '../constants.js'

/**
 * Calculates the total price and commission for a booking using Integer Math.
 * 
 * @param basePriceClp - The base price of the parking spot in CLP (Integer)
 * @param commissionRate - The commission rate as a decimal (e.g., 0.10 for 10%)
 * @returns Object containing commission and final payout distribution
 */
export function calculateBookingPricing(basePriceClp: number, commissionRate: number) {
    if (!Number.isInteger(basePriceClp)) {
        throw new Error('Base Price must be an integer')
    }
    if (basePriceClp < 0) {
        throw new Error('Amount cannot be negative')
    }

    // Formula: (Price * Rate)
    // Example: 5000 * 0.10 = 500
    // We use Math.ceil to ensure we don't under-collect on fractional scenarios
    // 12345 * 0.10 = 1234.5 -> 1235
    const commissionClp = Math.ceil(basePriceClp * commissionRate)

    // Remaining amount for the building/owner
    const ownerAmountClp = basePriceClp - commissionClp

    return {
        totalAmountClp: basePriceClp,
        commissionClp,
        ownerAmountClp
    }
}

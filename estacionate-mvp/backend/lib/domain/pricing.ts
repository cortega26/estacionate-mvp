import { APP_CONSTANTS } from '../constants.js'

/**
 * Calculates the total price and commission for a booking using Integer Math.
 * 
 * @param basePriceClp - The base price of the parking spot in CLP (Integer)
 * @returns Object containing commission and final payout distribution
 */
export function calculateBookingPricing(basePriceClp: number) {
    if (!Number.isInteger(basePriceClp)) {
        throw new Error('Base Price must be an integer')
    }

    // Formula: (Price * BasisPoints) / 10000
    // Example: (5000 * 1000) / 10000 = 500
    const commissionClp = Math.floor((basePriceClp * APP_CONSTANTS.BOOKING_COMMISSION_RATE) / 10000)

    // Remaining amount for the building/owner
    const ownerAmountClp = basePriceClp - commissionClp

    return {
        totalAmountClp: basePriceClp,
        commissionClp,
        ownerAmountClp
    }
}

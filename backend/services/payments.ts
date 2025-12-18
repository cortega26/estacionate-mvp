/**
 * Calculate the platform fee based on the total amount and commission rate.
 * We ceil the result to ensure we never under-collect on fractional cents.
 * 
 * @param amountClp Total transaction amount in CLP
 * @param commissionRate Rate as decimal (e.g. 0.10 for 10%)
 * @returns Commission amount in CLP (integer)
 */
export function calculateCommission(amountClp: number, commissionRate: number = 0.10): number {
    if (amountClp < 0) throw new Error('Amount cannot be negative');
    if (commissionRate < 0) throw new Error('Commission rate cannot be negative');

    return Math.ceil(amountClp * commissionRate);
}

/**
 * Calculate the net amount for the building (Total - Commission).
 */
export function calculateBuildingShare(amountClp: number, commissionRate: number = 0.10): number {
    const commission = calculateCommission(amountClp, commissionRate);
    return amountClp - commission;
}

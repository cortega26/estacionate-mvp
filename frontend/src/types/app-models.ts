export interface Building {
    id: string; // Updated to force HMR
    name: string;
    address: string;
    adminCompany?: string;
    contactEmail: string;
    phone?: string;
    totalUnits: number;
    visitorSpotsCount: number;
    timezone: string;
}

export type SpotStatus = 'available' | 'reserved' | 'blocked';
export type DurationType = 'ELEVEN_HOURS' | 'TWENTY_THREE_HOURS';

export interface Spot {
    id: string; // AvailabilityBlock ID
    spotId: string;
    startDatetime: string;
    endDatetime: string;
    durationType: DurationType;
    basePriceClp: number;
    status: SpotStatus;
    spot?: {
        id: string;
        spotNumber: string;
        description?: string;
    };
}

export interface Booking {
    id: string;
    residentId: string;
    availabilityBlockId: string;
    visitorName: string;
    visitorPhone?: string;
    vehiclePlate: string;
    amountClp: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    confirmationCode: string;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'support' | 'building_admin';
    buildingId?: string;
}

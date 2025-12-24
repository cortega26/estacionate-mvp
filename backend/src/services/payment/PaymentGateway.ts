
export interface PaymentGateway {
    createPreference(
        title: string,
        quantity: number,
        unitPrice: number,
        externalReference: string,
        notificationUrl?: string,
        payerEmail?: string
    ): Promise<PreferenceResult>;

    refund(paymentId: string | object, amount: number): Promise<RefundResult>;

    handleWebhook(data: unknown): Promise<WebhookResult>;
}

export interface PreferenceResult {
    init_point: string | undefined;
    sandbox_init_point: string | undefined;
}

export interface RefundResult {
    success: boolean;
    status: string;
    mode: 'real' | 'simulator';
    data?: unknown;
}

export interface WebhookResult {
    success: boolean;
    mode: 'real' | 'simulator';
    status: string;
    idempotent?: boolean;
}

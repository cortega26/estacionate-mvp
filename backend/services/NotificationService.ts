import { sendWhatsAppMessage } from './twilio.js';


interface BookingDetails {
    id: string;
    visitorName: string;
    amountClp: number;
    spotId: string; // Or name
    date: string;
}

export class NotificationService {

    // Helper for QueueService to call
    static async sendWhatsAppMessage(to: string, body: string) {
        console.log(`[Mock WhatsApp] To: ${to}, Body: ${body}`);
        return;
        // return sendWhatsAppMessage(to, body); 
    }

    /**
     * Sends a booking confirmation via WhatsApp.
     */
    static async sendBookingConfirmation(phone: string, details: BookingDetails) {
        if (!phone) {
            console.warn('No phone number provided for notification');
            return;
        }

        const message = `🚗 *Estacionate - Reserva Confirmada*
        
Hola ${details.visitorName}, tu reserva ha sido pagada exitosamente.

📅 *Fecha*: ${details.date}
🅿️ *Estacionamiento*: ${details.spotId}
💰 *Total*: $${details.amountClp}

Tu código de acceso: *${details.id.split('-')[0].toUpperCase()}*

Gracias por preferirnos.`;

        await sendWhatsAppMessage(phone, message);
    }

    static async sendPaymentFailure(phone: string, visitorName: string) {
        if (!phone) return;

        const message = `❌ *Estacionate - Pago Fallido*
        
Hola ${visitorName}, hubo un problema con tu pago. Por favor intenta nuevamente para asegurar tu lugar.`;

        await sendWhatsAppMessage(phone, message);
    }

    static async sendPasswordReset(phone: string, code: string) {
        if (!phone) return;

        const message = `🔐 *Estacionate - Recuperación de Cuenta*
        
Tu código de recuperación es: *${code}*

Este código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.`;

        await sendWhatsAppMessage(phone, message);
    }
}

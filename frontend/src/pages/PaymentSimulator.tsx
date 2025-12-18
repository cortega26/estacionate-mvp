import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const PaymentSimulator = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('booking_id');
    const amount = searchParams.get('amount') || '0';
    const [loading, setLoading] = React.useState(false);

    if (!bookingId) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500">
                Falta ID de Reserva
            </div>
        );
    }

    const handlePayment = async (status: 'approved' | 'rejected' | 'pending') => {
        setLoading(true);
        const toastId = toast.loading(`Procesando pago ${status}...`);

        try {
            // Call our own backend webhook directly
            await axios.post('http://localhost:3000/api/payments/webhook', {
                type: 'simulator',
                data: {
                    bookingId,
                    status
                }
            });

            toast.success('¡Pago Procesado!', { id: toastId });

            // Redirect logic mimicking MP
            setTimeout(() => {
                if (status === 'approved') navigate('/checkout/success');
                else if (status === 'rejected') navigate('/checkout/failure');
                else navigate('/checkout/pending'); // You might need to create this page
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error('Falló la Simulación', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-[#009EE3] p-6 text-white text-center">
                    <h1 className="text-xl font-bold mb-1">Simulador MercadoPago</h1>
                    <p className="text-blue-100 text-sm">Modo Desarrollo / Pruebas</p>
                </div>

                {/* Amount */}
                <div className="p-8 text-center border-b border-gray-100">
                    <p className="text-gray-500 text-sm uppercase tracking-wide">Total a Pagar</p>
                    <p className="text-4xl font-extrabold text-[#333] mt-2">
                        ${Number(amount).toLocaleString('es-CL')}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 space-y-3">
                    <button
                        disabled={loading}
                        onClick={() => handlePayment('approved')}
                        className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <CheckCircle className="w-6 h-6" />
                        Simular Éxito
                    </button>

                    <button
                        disabled={loading}
                        onClick={() => handlePayment('rejected')}
                        className="w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <XCircle className="w-6 h-6" />
                        Simular Rechazo
                    </button>

                    <button
                        disabled={loading}
                        onClick={() => handlePayment('pending')}
                        className="w-full flex items-center justify-center gap-3 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Clock className="w-6 h-6" />
                        Simular Pendiente
                    </button>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                    Esta pantalla es una simulación. No se cobrará dinero real.
                </div>
            </div>
        </div>
    );
};

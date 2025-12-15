import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export const SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('booking_id') || searchParams.get('external_reference');
    const isMock = searchParams.get('mock') === 'true';

    useEffect(() => {
        if (isMock && bookingId) {
            // Auto-trigger webhook for dev convenience
            api.post('/payments/webhook', {}, { params: { mock_booking_id: bookingId } })
                .then(() => toast.success('Pago de prueba confirmado'))
                .catch(err => console.error(err));
        }
    }, [bookingId, isMock]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50">
            <div className="text-center p-8 bg-white rounded shadow-lg">
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h1>
                <p className="text-gray-600 mb-6">Tu estacionamiento ha sido reservado.</p>
                {bookingId && <p className="text-xs text-gray-400 mb-4">Ref: {bookingId}</p>}
                <Link to="/search" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

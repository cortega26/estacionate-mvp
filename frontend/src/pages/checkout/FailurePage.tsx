import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const getReasonCopy = (reason: string | null, status: string | null) => {
    if (reason === 'simulated_rejection') {
        return 'La simulación fue rechazada. Puedes intentarlo nuevamente con otro resultado o volver a reservar.';
    }

    if (status === 'rejected') {
        return 'El simulador rechazó la transacción. Puedes intentarlo nuevamente o volver a reservar.';
    }

    if (status === 'cancelled') {
        return 'Cancelaste el proceso antes de terminar la simulación.';
    }

    return 'No pudimos confirmar la simulación. Puedes volver a intentar desde la app.';
};

export const FailurePage = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('booking_id') || searchParams.get('external_reference');
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');

    return (
        <div className="min-h-screen bg-red-50 px-4 py-10">
            <div className="mx-auto max-w-2xl rounded-2xl border border-red-100 bg-white shadow-lg">
                <div className="border-b border-red-100 bg-red-50 px-8 py-8 text-center">
                    <div className="mb-4 text-6xl">❌</div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">Simulación no completada</h1>
                    <p className="mx-auto max-w-xl text-sm text-gray-600">{getReasonCopy(reason, status)}</p>
                    {bookingId && <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">Ref: {bookingId}</p>}
                </div>

                <div className="space-y-6 px-8 py-8">
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Qué hacer ahora</h2>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li>Vuelve a la app y repite la reserva si todavía necesitas el cupo.</li>
                            <li>Esta pantalla es de prueba y no ejecuta cobros reales.</li>
                            <li>Si el problema persiste, contacta a la administración del edificio para validar el estado de la reserva.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link to="/search" className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-black">
                            Intentar nuevamente
                        </Link>
                        <Link to="/search" className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50">
                            Volver a la app
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface BookingSummary {
    id: string;
    status: string;
    paymentStatus: string;
    visitorName: string;
    visitorPhone?: string | null;
    vehiclePlate: string;
    amountClp: number;
    confirmationCode: string;
    specialInstructions?: string | null;
    startDatetime: string;
    endDatetime: string;
    spotNumber: string;
    buildingName: string;
    buildingAddress: string;
}

const formatDateTime = (value: string) => new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short'
});

export const SuccessPage = () => {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('booking_id') || searchParams.get('external_reference');
    const user = useAuthStore((state) => state.user);
    const isPending = searchParams.get('pending') === 'true'
        || searchParams.get('status') === 'pending'
        || searchParams.get('collection_status') === 'pending';

    const { data: summary, isPending: isLoadingSummary } = useQuery<BookingSummary | null>({
        queryKey: ['booking-summary', bookingId],
        enabled: !!bookingId && !!user,
        queryFn: async () => {
            try {
                const response = await api.get('/bookings/summary', { params: { bookingId } });
                return response.data.data;
            } catch {
                return null;
            }
        }
    });

    const title = isPending ? 'Simulación pendiente' : 'Reserva confirmada';
    const description = isPending
        ? 'Recibimos el intento del simulador y estamos esperando la confirmación final.'
        : 'La simulación fue procesada y la reserva quedó confirmada para el acceso.';

    return (
        <div className="min-h-screen bg-green-50 px-4 py-10">
            <div className="mx-auto max-w-3xl rounded-2xl border border-green-100 bg-white shadow-lg">
                <div className="border-b border-green-100 bg-green-50 px-8 py-8 text-center">
                    <div className="mb-4 text-6xl">{isPending ? '⏳' : '✅'}</div>
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="mx-auto max-w-xl text-sm text-gray-600">{description}</p>
                    {bookingId && <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">Ref: {bookingId}</p>}
                </div>

                <div className="space-y-6 px-8 py-8">
                    {isLoadingSummary && (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                            Cargando detalles de la reserva...
                        </div>
                    )}

                    {summary && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estacionamiento</p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{summary.spotNumber}</p>
                                <p className="text-sm text-gray-600">{summary.buildingName}</p>
                                <p className="text-sm text-gray-500">{summary.buildingAddress}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Horario</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(summary.startDatetime)}</p>
                                <p className="text-sm text-gray-600">hasta {formatDateTime(summary.endDatetime)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Visita y vehículo</p>
                                <p className="mt-1 text-sm font-medium text-gray-900">{summary.visitorName}</p>
                                <p className="text-sm text-gray-600">Patente: {summary.vehiclePlate}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Confirmación</p>
                                <p className="mt-1 text-lg font-semibold text-gray-900">{summary.confirmationCode}</p>
                                <p className="text-sm text-gray-600">Monto demo: ${summary.amountClp.toLocaleString('es-CL')}</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Próximos pasos</h2>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            {isPending ? (
                                <>
                                    <li>Estamos esperando la confirmación final del simulador. Si cambia el estado, vuelve a esta página o revisa tu historial.</li>
                                    <li>Si la simulación no se confirma en unos minutos, vuelve a intentar desde la app.</li>
                                </>
                            ) : (
                                <>
                                    <li>Muestra tu código de confirmación al ingresar para acelerar la validación.</li>
                                    <li>Verifica el edificio, el horario y la patente antes de llegar.</li>
                                </>
                            )}
                            <li>Si necesitas ayuda, contacta a la administración del edificio o vuelve a la app para revisar el estado de tu reserva.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link to="/search" className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700">
                            Volver a buscar
                        </Link>
                        <Link to="/search" className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50">
                            Ir a la app
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export const BookingManagement = () => {
    const [filter, setFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<any>(null); // For Confirmation Modal

    const { data: bookingsData, isLoading, refetch } = useQuery({
        queryKey: ['admin-bookings', filter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);
            const { data } = await api.get(`/admin/bookings?${params.toString()}`);
            return data.data; // API returns { success: true, data: [...] }
        }
    });

    const cancelMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const { data } = await api.post(`/bookings/cancel`, { bookingId });
            return data;
        },
        onSuccess: (data) => {
            toast.success(`Reserva cancelada. Reembolso: $${data.refundAmount}`);
            setSelectedBooking(null);
            refetch();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Error al cancelar');
        }
    });

    const handleCancelClick = (booking: any) => {
        setSelectedBooking(booking);
    };

    const confirmCancel = () => {
        if (selectedBooking) {
            cancelMutation.mutate(selectedBooking.id);
        }
    };

    if (isLoading) return <div className="p-8">Cargando Reservas...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h1>

            {/* Filter Controls (Localized) */}
            <div className="flex gap-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Todas</button>
                <button onClick={() => setFilter('confirmed')} className={`px-4 py-2 rounded ${filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Confirmadas</button>
                <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Finalizadas</button>
                <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Pendientes</button>
                <button onClick={() => setFilter('cancelled,no_show')} className={`px-4 py-2 rounded ${filter === 'cancelled,no_show' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Canceladas</button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Espacio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visita</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookingsData?.map((booking: any) => (
                            <tr key={booking.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(booking.startDatetime).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {booking.buildingName} - {booking.spotNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {booking.visitorName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {booking.vehiclePlate}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                    ${booking.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                        <button onClick={() => handleCancelClick(booking)} className="text-red-600 hover:text-red-900">
                                            Cancelar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold mb-4">Confirmar Cancelación</h3>
                        <p className="mb-4 text-gray-600">
                            ¿Estás seguro de cancelar la reserva de <b>{selectedBooking.visitorName}</b>?
                            El reembolso se calculará automáticamente según la política de 24h.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Mantener
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status, paymentStatus }: { status: string; paymentStatus: string }) => {
    // Traffic Light UI Logic for Concierge "Head's Up" Display
    // Green = GO, Red = STOP, Amber = CHECK

    let styles = 'bg-gray-100 text-gray-800'; // Fallback
    let icon = '•';
    let label = status;

    if (status === 'confirmed') {
        styles = 'bg-green-600 text-white shadow-sm ring-1 ring-green-700'; // GO
        icon = '✓';
        label = 'CONFIRMADA';
    } else if (status === 'completed') {
        styles = 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'; // DONE
        icon = '🏁';
        label = 'COMPLETADA'; // "Finalizada" is also good, keeping "Completada" to map 1:1 if preferred? "FINALIZADA" is more natural. Let's use FINALIZADA.
        label = 'FINALIZADA';
    } else if (status === 'cancelled' || status === 'no_show') {
        styles = 'bg-red-600 text-white shadow-sm ring-1 ring-red-700'; // STOP
        icon = '✕';
        label = status === 'no_show' ? 'NO SHOW' : 'CANCELADA';
    } else if (status === 'pending') {
        styles = 'bg-amber-300 text-black ring-1 ring-amber-400'; // WAIT
        icon = '⏳';
        label = 'PENDIENTE';
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <span className={`px-3 py-1.5 inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider rounded-md ${styles}`}>
                <span className="text-sm">{icon}</span>
                {label}
            </span>
            {paymentStatus === 'refunded' && (
                <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-800 font-bold border border-red-200 rounded">
                    REEMBOLSADA
                </span>
            )}
        </div>
    );
};

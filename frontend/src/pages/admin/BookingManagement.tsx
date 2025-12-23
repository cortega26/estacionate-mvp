import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export const BookingManagement = () => {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
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
            alert(`Booking cancelled. Refund Amount: $${data.refundAmount}`);
            setSelectedBooking(null);
            refetch(); // Reload list
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || 'Cancellation Failed');
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

    if (isLoading) return <div className="p-8">Loading Bookings...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>

            {/* Filter Controls (Basic) */}
            <div className="flex gap-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
                <button onClick={() => setFilter('confirmed')} className={`px-4 py-2 rounded ${filter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Confirmed</button>
                <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Pending</button>
                <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded ${filter === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Cancelled</button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                            Cancel
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
                        <h3 className="text-lg font-bold mb-4">Confirm Cancellation</h3>
                        <p className="mb-4 text-gray-600">
                            Are you sure you want to cancel booking <b>{selectedBooking.id.slice(0, 8)}...</b>?
                            Refund will be calculated automatically based on 24h policy.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Keep It
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Zero Refund / 90% Refund (Auto)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status, paymentStatus }: { status: string; paymentStatus: string }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === 'confirmed') color = 'bg-green-100 text-green-800';
    if (status === 'cancelled') color = 'bg-red-100 text-red-800';
    if (status === 'pending') color = 'bg-yellow-100 text-yellow-800';
    if (status === 'completed') color = 'bg-blue-100 text-blue-800';

    return (
        <div className="flex flex-col items-start gap-1">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                {status}
            </span>
            {paymentStatus === 'refunded' && (
                <span className="text-[10px] text-red-600 font-bold">REFUNDED</span>
            )}
        </div>
    );
};

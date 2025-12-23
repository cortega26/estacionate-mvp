import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { BookingModal } from '../../features/bookings/components/BookingModal';
import type { Building, Spot } from '../../types/app-models';
import { Input } from '../../components/ui/Input';
import { Select, type SelectOption } from '../../components/ui/Select';
import { MagnifyingGlassIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { ParkingMap } from '../../features/map/components/ParkingMap';

export const SearchPage = () => {
    const user = useAuthStore((state) => state.user);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // Select component uses object {id, label, value}
    const [selectedBuilding, setSelectedBuilding] = useState<SelectOption | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<Spot | null>(null);

    // Fetch Buildings...
    const { data: buildings, isSuccess } = useQuery<Building[]>({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return res.data.data;
        }
    });

    const buildingOptions = useMemo(() => {
        return buildings?.map(b => ({
            id: b.id,
            label: `${b.name} (${b.address})`,
            value: b.id
        })) || [];
    }, [buildings]);

    React.useEffect(() => {
        if (isSuccess && buildingOptions.length > 0 && !selectedBuilding) {
            setSelectedBuilding(buildingOptions[0]);
        }
    }, [isSuccess, buildingOptions, selectedBuilding]);

    const { data: spots, isPending: isLoading, refetch } = useQuery<Spot[]>({
        queryKey: ['spots', selectedBuilding?.value, selectedDate],
        queryFn: async () => {
            if (!selectedBuilding?.value) return [];
            const res = await api.get('/spots/search', {
                params: { buildingId: selectedBuilding.value, date: selectedDate }
            });
            return res.data.data;
        },
        enabled: !!selectedBuilding?.value
    });

    const queryClient = useQueryClient();

    // 2. Checkout Mutation
    const checkoutMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            return api.post('/payments/checkout', { bookingId });
        },
        onSuccess: (res: any) => {

            const url = res.data.init_point || res.data.sandbox_init_point;
            if (url) {
                window.location.href = url;
            } else {
                toast.error('Error al iniciar pago');
            }
        },
        onError: (err: any) => {

            toast.error(err.response?.data?.details || err.response?.data?.error || 'Error al conectar con pago');
        }
    });

    // 1. Booking Mutation
    const bookMutation = useMutation({
        mutationFn: async (data: { blockId: string, vehiclePlate: string, visitorName: string, visitorPhone?: string }) => {
            return api.post('/bookings/create', data);
        },
        onSuccess: (res: any) => {
            toast.success('¡Reserva creada! Redirigiendo a pago...');
            queryClient.invalidateQueries({ queryKey: ['spots'] });
            setSelectedBlock(null);
            // Trigger Checkout
            checkoutMutation.mutate(res.data.booking.id);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Error al reservar');
        }
    });

    const handleBookingSubmit = (data: { vehiclePlate: string, visitorName: string, visitorPhone?: string }) => {
        if (!selectedBlock) return;
        bookMutation.mutate({
            blockId: selectedBlock.id,
            vehiclePlate: data.vehiclePlate,
            visitorName: data.visitorName,
            visitorPhone: data.visitorPhone
        });
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Cargando usuario...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Buscar Estacionamiento</h2>
                        <p className="text-sm text-gray-500 mt-1">Encuentra y reserva tu lugar en segundos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-4">
                        <Input
                            label="Fecha"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-6">
                        <Select
                            label="Edificio"
                            options={buildingOptions}
                            value={selectedBuilding}
                            onChange={setSelectedBuilding}
                            placeholder="Selecciona un edificio..."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button
                            onClick={() => refetch()}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition duration-150 ease-in-out font-medium shadow-sm active:scale-95"
                        >
                            <MagnifyingGlassIcon className="h-5 w-5" />
                            Buscar
                        </button>
                    </div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end mb-4">
                <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <ListBulletIcon className="h-4 w-4" />
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'map' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        <MapIcon className="h-4 w-4" />
                        Mapa
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'map' ? (
                <div className="fade-in">
                    <ParkingMap
                        spots={spots || []}
                        onSelect={setSelectedBlock}
                        selectedSpotId={selectedBlock?.id}
                        buildingName={selectedBuilding?.label}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading && (
                        <div className="col-span-full py-12 text-center text-gray-400 animate-pulse">
                            Cargando disponibilidad...
                        </div>
                    )}

                    {spots?.map((block) => (
                        <div key={block.id} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${block.status === 'available'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {block.status === 'available' ? 'Disponible' : 'Reservado'}
                                    </span>
                                    <h3 className="text-xl font-bold mt-3 text-gray-900">Nº {block.spot?.spotNumber}</h3>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {format(new Date(block.startDatetime), 'HH:mm')} - {format(new Date(block.endDatetime), 'HH:mm')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-indigo-600">${block.basePriceClp.toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 font-medium tracking-wide uppercase mt-1">
                                        {block.durationType === 'ELEVEN_HOURS' ? '11 Horas' : '23 Horas'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedBlock(block)}
                                disabled={block.status !== 'available' || user.role !== 'resident'}
                                className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 transition-colors font-medium text-sm"
                            >
                                {block.status !== 'available'
                                    ? 'No Disponible'
                                    : user.role !== 'resident'
                                        ? 'Solo Residentes'
                                        : 'Reservar Ahora'}
                            </button>
                        </div>
                    ))}

                    {!isLoading && spots?.length === 0 && selectedBuilding && (
                        <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-lg">No se encontraron estacionamientos disponibles para esta fecha.</p>
                            <button onClick={() => setSelectedDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])} className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium">
                                Ver para mañana &rarr;
                            </button>
                        </div>
                    )}
                </div>
            )}

            <BookingModal
                isOpen={!!selectedBlock}
                onClose={() => setSelectedBlock(null)}
                onSubmit={handleBookingSubmit}
                isLoading={bookMutation.isPending || checkoutMutation.isPending}
                spotNumber={selectedBlock?.spot?.spotNumber}
                price={selectedBlock?.basePriceClp}
                defaultName={user.firstName ? `${user.firstName} ${user.lastName}` : ''}
            />
        </div>
    );
};

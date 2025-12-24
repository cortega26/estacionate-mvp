import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Booking {
    id: string;
    plate: string;
    visitorName: string;
    spotNumber: string;
    startTime: string;
    endTime: string;
    state: 'active' | 'upcoming' | 'expired';
    status: string;
}

export const GatekeeperDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [manualCheckResult, setManualCheckResult] = useState<any>(null);

    // 1. Fetch Today's Dashboard
    const { data: bookings, isLoading, refetch } = useQuery({
        queryKey: ['concierge-dashboard'],
        queryFn: async () => {
            const res = await api.get<{ data: Booking[] }>('/concierge/dashboard');
            return res.data.data;
        },
        refetchInterval: 30000 // Refresh every 30s
    });

    // 2. Manual Verify Mutation
    const verifyMutation = useMutation({
        mutationFn: async (plateOrCode: string) => {
            const isCode = plateOrCode.length <= 6 && !plateOrCode.includes('-'); // Guess heuristic
            const payload = isCode ? { code: plateOrCode } : { plate: plateOrCode };
            const res = await api.post('/concierge/verify', payload);
            return res.data;
        },
        onSuccess: (data) => {
            setManualCheckResult({ valid: true, data: data.data });
            toast.success('¡Vehículo Autorizado!');
            setSearchTerm('');
        },
        onError: (err: any) => {
            setManualCheckResult({ valid: false, message: err.response?.data?.message || 'Error al verificar' });
            toast.error('Vehículo NO encontrado o sin reserva activa.');
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) return;
        verifyMutation.mutate(searchTerm);
    };

    // Filter displayed list if search is typed but not submitted (local filter)
    const displayedBookings = bookings?.filter(b =>
        b.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.spotNumber.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <form onSubmit={handleSearch}>
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                        Verificar Patente o Código
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setManualCheckResult(null); // Reset manual result on type
                            }}
                            className="w-full bg-slate-900 text-white text-2xl font-bold py-4 pl-12 pr-4 rounded-xl border-2 border-slate-600 focus:border-emerald-500 focus:ring-0 placeholder-slate-600 uppercase tracking-widest"
                            placeholder="ABCD-12"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-6 h-6" />
                        <button
                            type="submit"
                            disabled={!searchTerm}
                            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            VERIFICAR
                        </button>
                    </div>
                </form>

                {/* Verification Result Card */}
                {manualCheckResult && (
                    <div className={`mt-4 p-4 rounded-xl border-l-4 ${manualCheckResult.valid ? 'bg-emerald-900/30 border-emerald-500' : 'bg-red-900/30 border-red-500'}`}>
                        <div className="flex items-start space-x-3">
                            {manualCheckResult.valid ? <CheckCircle className="text-emerald-400 w-8 h-8 flex-shrink-0" /> : <AlertCircle className="text-red-400 w-8 h-8 flex-shrink-0" />}
                            <div>
                                <h3 className={`text-lg font-bold ${manualCheckResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {manualCheckResult.valid ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
                                </h3>
                                {manualCheckResult.valid && (
                                    <div className="mt-2 text-slate-300 space-y-1">
                                        <p><span className="text-slate-500">Patente:</span> <span className="text-white font-mono text-lg">{manualCheckResult.data.plate}</span></p>
                                        <p><span className="text-slate-500">Estacionamiento:</span> <span className="text-white font-bold bg-slate-700 px-2 rounded ml-2">{manualCheckResult.data.spotNumber}</span></p>
                                        <p><span className="text-slate-500">Visita a:</span> {manualCheckResult.data.resident}</p>
                                        <p><span className="text-slate-500">Expira:</span> {new Date(manualCheckResult.data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                )}
                                {!manualCheckResult.valid && (
                                    <p className="text-slate-400 mt-1">{manualCheckResult.message}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center justify-between">
                    <span>Próximas Reservas (Hoy)</span>
                    <button onClick={() => refetch()} className="text-emerald-400 text-sm">Actualizar</button>
                </h2>

                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Cargando...</div>
                ) : (
                    <div className="space-y-3">
                        {displayedBookings?.length === 0 && (
                            <div className="text-center py-8 bg-slate-800 rounded-xl border border-slate-700 text-slate-500">
                                Sin reservas activas por ahora.
                            </div>
                        )}
                        {displayedBookings?.map((booking) => (
                            <div key={booking.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center shadow-sm">
                                <div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl font-mono font-bold text-white tracking-wider bg-slate-900 px-2 py-1 rounded border border-slate-700">
                                            {booking.plate}
                                        </span>
                                        {booking.state === 'active' && (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full font-bold flex items-center">
                                                <Clock className="w-3 h-3 mr-1" /> ACTIVO
                                            </span>
                                        )}
                                        {booking.state === 'upcoming' && (
                                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-bold">
                                                PRÓXIMO
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-400">
                                        <span className="text-slate-500">Spot:</span> <span className="font-bold text-white mr-3">{booking.spotNumber}</span>
                                        <span className="text-slate-500">Visita:</span> {booking.visitorName}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold text-lg">
                                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Hasta {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

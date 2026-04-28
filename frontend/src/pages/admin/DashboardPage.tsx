import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenuePoint {
    date: string;
    amount: number;
}

interface RecentActivityItem {
    id: string;
    status: string;
    amountClp: number;
    user: {
        firstName?: string;
        email: string;
    };
    spot: {
        spotNumber: string;
    };
}

interface DashboardStats {
    revenue: number;
    activeBookings: number;
    totalSpots: number;
    occupancyRate: number | string;
    revenueOverTime: RevenuePoint[];
    recentActivity: RecentActivityItem[];
}

export const DashboardPage = () => {
    const user = useAuthStore((state) => state.user);
    const normalizedRole = String(user?.role || '').toLowerCase();
    const isBuildingAdmin = normalizedRole === 'building_admin';

    const { data: stats, isPending: isLoading, isError } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const params = isBuildingAdmin && user?.buildingId ? { buildingId: user.buildingId } : {};
            const res = await api.get('/admin/stats', { params });
            return res.data.data;
        }
    });

    if (isLoading) return <div className="p-8">Cargando estadísticas...</div>;
    if (isError || !stats) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
                <h2 className="text-lg font-semibold">No pudimos cargar el panel</h2>
                <p className="mt-2 text-sm text-red-800">
                    Reintenta en unos segundos. Si el problema persiste, revisa el servicio de estadísticas del backend.
                </p>
            </div>
        );
    }

    const revenue = stats.revenue || 0;
    const activeBookings = stats.activeBookings || 0;
    const totalSpots = stats.totalSpots || 0;
    const occupancyRate = Number(stats.occupancyRate || 0);
    const hasRevenueTrend = stats.revenueOverTime.some((point) => point.amount > 0);
    const hasRecentActivity = stats.recentActivity.length > 0;
    const scopeLabel = isBuildingAdmin ? 'Viendo solo tu edificio asignado' : 'Viendo toda la plataforma';
    const statusHeadline = activeBookings > 0 ? `${activeBookings} reservas activas requieren seguimiento` : 'Sin reservas activas por ahora';
    const occupancySummary = `${activeBookings} de ${totalSpots} cupos ocupados ahora`;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                    {normalizedRole === 'admin' ? 'Resumen Global (Super Admin)' : 'Panel de Administración'}
                </h2>
                {isBuildingAdmin && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Edificio Asignado
                    </span>
                )}
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Estado del panel</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{statusHeadline}</h3>
                <p className="mt-2 text-sm text-slate-600">{scopeLabel}</p>
                <p className="mt-1 text-sm text-slate-600">
                    {hasRecentActivity
                        ? 'La actividad reciente ya está disponible para seguimiento operacional.'
                        : 'No hay actividad reciente para revisar. Cuando entren nuevas reservas o cancelaciones aparecerán aquí.'}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-medium">Uso reportado demo</p>
                    <p className="text-3xl font-bold text-gray-800">${revenue.toLocaleString('es-CL')}</p>
                    <p className="mt-2 text-sm text-gray-500">Monto simulado asociado a actividad del periodo.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm font-medium">Reservas Activas</p>
                    <p className="text-3xl font-bold text-gray-800">{activeBookings}</p>
                    <p className="mt-2 text-sm text-gray-500">Pendientes y confirmadas que aún requieren seguimiento.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <p className="text-gray-500 text-sm font-medium">Tasa de Ocupación</p>
                    <p className="text-3xl font-bold text-gray-800">{occupancyRate}%</p>
                    <p className="mt-2 text-sm text-gray-500">{occupancySummary}</p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Actividad últimos 30 días</h3>
                {hasRevenueTrend ? (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={stats.revenueOverTime}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => {
                                        const date = new Date(str + 'T00:00:00');
                                        return `${date.getDate()}/${date.getMonth() + 1}`;
                                    }}
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis
                                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                    style={{ fontSize: '12px' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip
                                    formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Monto demo']}
                                    labelFormatter={(label) => new Date(label + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10B981"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                        <p className="font-semibold text-gray-800">No hay actividad con monto demo en los últimos 30 días.</p>
                        <p className="mt-2">Cuando se completen reservas, aquí verás la tendencia diaria operacional.</p>
                    </div>
                )}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
                </div>
                {hasRecentActivity ? (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estacionamiento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto demo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {stats.recentActivity.map((activity) => (
                                <tr key={activity.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{activity.user.firstName || 'Usuario sin nombre'}</div>
                                        <div className="text-sm text-gray-500">{activity.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Espacio {activity.spot.spotNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${activity.amountClp.toLocaleString('es-CL')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                activity.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                    activity.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {activity.status === 'completed' ? 'Finalizada' :
                                                activity.status === 'confirmed' ? 'Confirmada' :
                                                    activity.status === 'cancelled' ? 'Cancelada' :
                                                        activity.status === 'pending' ? 'Pendiente' : activity.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-6 text-sm text-gray-600">
                        <p className="font-semibold text-gray-800">No hay actividad reciente para revisar.</p>
                        <p className="mt-2">Cuando entren nuevas reservas o cancelaciones, este panel mostrará los movimientos más recientes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

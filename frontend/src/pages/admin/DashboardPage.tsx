import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage = () => {
    const user = useAuthStore((state) => state.user);
    // If user is building_admin, we pass their buildingId.
    // If super admin, they might pass a filter, or null to see all.
    // For MVP, user object (decoded token) usually has buildingId if they are restricted.
    // We didn't store buildingId in Zustand User object explicitly in Login response (we missed it earlier).
    // But let's assume if it's stored, we use it. If not, we fetch global.

    // Note: In `login.ts`, we returned a user object. We should ensure it has buildingId if relevant.
    // Assuming API handles it via the token context eventually, or we pass it as query param.

    const { data: stats, isPending: isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // We pass buildingId if we have it in the user object (we might need to augment authStore logic later)
            const params = user?.role === 'building_admin' && (user as any).buildingId ? { buildingId: (user as any).buildingId } : {};
            const res = await api.get('/admin/stats', { params });
            return res.data.data;
        }
    });

    if (isLoading) return <div className="p-8">Cargando estadísticas...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">
                    {user?.role === 'admin' ? 'Resumen Global (Super Admin)' : 'Panel de Administración'}
                </h2>
                {user?.role === 'building_admin' && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Edificio Asignado
                    </span>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-gray-500 text-sm font-medium">Ganancias Totales</p>
                    <p className="text-3xl font-bold text-gray-800">${stats?.revenue.toLocaleString('es-CL')}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <p className="text-gray-500 text-sm font-medium">Reservas Activas</p>
                    <p className="text-3xl font-bold text-gray-800">{stats?.activeBookings}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <p className="text-gray-500 text-sm font-medium">Tasa de Ocupación</p>
                    <p className="text-3xl font-bold text-gray-800">{stats?.occupancyRate}%</p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Ingresos Últimos 30 Días</h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={stats?.revenueOverTime}
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
                                    const date = new Date(str + 'T00:00:00'); // Force local time handling or ensure ISO string parse
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
                                formatter={(value: number) => [`$${value.toLocaleString('es-CL')}`, 'Ingresos']}
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
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Actividad Reciente</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estacionamiento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stats?.recentActivity?.map((activity: any) => (
                            <tr key={activity.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{activity.user.firstName}</div>
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
            </div>
        </div>
    );
};

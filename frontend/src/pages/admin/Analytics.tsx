import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '../../lib/api';

const Analytics = () => {
    // Auth is handled via cookies
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-analytics'],
        queryFn: async () => {
            const res = await api.get('/admin/analytics');
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center">Loading Analytics...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error loading data</div>;

    const { chartData, summary } = data.data;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Analytics</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                    <p className="text-sm text-gray-500 mb-1">30-Day Revenue</p>
                    <p className="text-3xl font-bold text-indigo-700">
                        ${summary.totalRevenue30d.toLocaleString('es-CL')}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
                    <p className="text-sm text-gray-500 mb-1">30-Day Bookings</p>
                    <p className="text-3xl font-bold text-emerald-700">
                        {summary.totalBookings30d}
                    </p>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-6">Revenue Trend (Last 30 Days)</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => str.slice(5)} // Show MM-DD
                                stroke="#888888"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [
                                    `$${(value || 0).toLocaleString()}`,
                                    'Revenue'
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#4F46E5"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bookings Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-6">Daily Bookings Volume</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => str.slice(5)}
                                stroke="#888888"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                            />
                            <Tooltip />
                            <Bar
                                dataKey="bookings"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

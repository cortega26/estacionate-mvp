import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

interface Commission {
    id: string;
    buildingName: string;
    amountClp: number;
    status: 'paid' | 'pending';
    createdAt: string;
}

interface DashboardStats {
    totalEarnings: number;
    monthlyEarnings: number;
    activeBuildingsCount: number;
    recentCommissions: Commission[];
}

interface Building {
    id: string;
    name: string;
    address: string;
    payouts: unknown[]; // Using unknown is safer than any if structure is loosely defined
}

export const SalesDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, buildingsRes] = await Promise.all([
                    api.get('/sales/dashboard'),
                    api.get('/sales/buildings')
                ]);
                setStats(statsRes.data);
                setBuildings(buildingsRes.data);
            } catch (error) {
                console.error('Failed to fetch sales data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" /> {/* Title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
                    <p className="text-3xl font-bold text-emerald-600">
                        ${stats?.totalEarnings.toLocaleString() || '0'}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">This Month</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        ${stats?.monthlyEarnings.toLocaleString() || '0'}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium">Active Clients</h3>
                    <p className="text-3xl font-bold text-slate-800">
                        {stats?.activeBuildingsCount || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Commissions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Recent Commissions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2">Building</th>
                                    <th className="pb-2">Amount</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stats?.recentCommissions.length === 0 && (
                                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">No commissions yet</td></tr>
                                )}
                                {stats?.recentCommissions.map((c: Commission) => (
                                    <tr key={c.id}>
                                        <td className="py-2">{c.buildingName}</td>
                                        <td className="py-2 font-medium text-emerald-600">${c.amountClp.toLocaleString()}</td>
                                        <td className="py-2">
                                            <span className={`px-2 py-1 rounded text-xs ${c.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Managed Buildings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">My Clients</h2>
                    <div className="space-y-4">
                        {buildings.length === 0 && <p className="text-gray-400">No clients assigned yet.</p>}
                        {buildings.map((b) => (
                            <div key={b.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{b.name}</h3>
                                        <p className="text-sm text-gray-500">{b.address}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {b.payouts?.length || 0} Payouts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

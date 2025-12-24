import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ManageRepBuildings } from './components/ManageBuildingsList';
import { CreateRepModal } from './components/CreateRepModal';

interface Building {
    id: string;
    name: string;
    salesRepId?: string;
    salesRepCommissionRate?: number;
    salesRep?: { id: string; email: string };
}

interface User {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

interface CreateRepInput {
    email?: string;
    password?: string;
    [key: string]: any;
}

interface UpdateBuildingInput {
    buildingId: string;
    salesRepId: string | null;
    commissionRate: number;
}


const SalesRepsPage = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [expandedRepId, setExpandedRepId] = useState<string | null>(null);

    // Fetch Sales Reps
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin-sales-reps'],
        queryFn: async () => {
            const { data } = await api.get(`/admin/users`, { params: { role: 'sales_rep' } });
            return data;
        }
    });

    // Fetch all buildings
    const { data: buildingsData, isLoading: isLoadingBuildings } = useQuery({
        queryKey: ['admin-buildings'],
        queryFn: async () => {
            const { data } = await api.get(`/admin/buildings`, { params: { brief: true } });
            return data;
        }
    });

    // Create Rep Mutation
    const createRepMutation = useMutation({
        mutationFn: async (formData: CreateRepInput) => {
            const { data } = await api.post(`/admin/users`, { ...formData, role: 'sales_rep' });
            return data;
        },
        onSuccess: () => {
            toast.success('Sales Rep Created');
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-sales-reps'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    // Update Building Mutation
    const updateBuildingMutation = useMutation({
        mutationFn: async ({ buildingId, salesRepId, commissionRate }: UpdateBuildingInput) => {
            const { data } = await api.put(`/admin/buildings`, {
                id: buildingId,
                salesRepId: salesRepId,
                salesRepCommissionRate: commissionRate
            });
            return data;
        },
        onSuccess: () => {
            toast.success('Building Updated');
            queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
        }
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        createRepMutation.mutate(Object.fromEntries(formData));
    };

    if (isLoadingUsers || isLoadingBuildings) return <div className="p-8">Loading...</div>;

    const salesReps = usersData?.data || [];
    const buildings = buildingsData?.data || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Sales Reps Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                    + New Sales Rep
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Buildings</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {salesReps.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No Sales Reps found.</td>
                            </tr>
                        )}
                        {salesReps.map((rep: User) => {
                            const repBuildings = buildings.filter((b: Building) => b.salesRepId === rep.id);
                            const isExpanded = expandedRepId === rep.id;

                            return (
                                <React.Fragment key={rep.id}>
                                    <tr className={isExpanded ? 'bg-indigo-50' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rep.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(rep.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {repBuildings.length} Buildings
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setExpandedRepId(isExpanded ? null : rep.id)}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold"
                                            >
                                                {isExpanded ? 'Hide Details' : 'Manage Buildings'}
                                            </button>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 bg-gray-50 inner-shadow">
                                                <ManageRepBuildings
                                                    rep={rep}
                                                    assignedBuildings={repBuildings}
                                                    allBuildings={buildings}
                                                    onUpdate={updateBuildingMutation.mutate}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <CreateRepModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateSubmit}
                isPending={createRepMutation.isPending}
            />
        </div>
    );
};

export default SalesRepsPage;


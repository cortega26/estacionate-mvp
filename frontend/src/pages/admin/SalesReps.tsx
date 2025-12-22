import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

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

const SalesRepsPage = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [expandedRepId, setExpandedRepId] = useState<string | null>(null);

    // Fetch Sales Reps
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin-sales-reps'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?role=sales_rep`, {
                credentials: 'include'
            });
            return res.json();
        }
    });

    // Fetch all buildings (to link/unlink). Optimized approach would be specific endpoint, but reuse is fine for now.
    const { data: buildingsData, isLoading: isLoadingBuildings } = useQuery({
        queryKey: ['admin-buildings'],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/buildings?brief=true`, {
                credentials: 'include'
            });
            return res.json();
        }
    });

    // Create Rep Mutation
    const createRepMutation = useMutation({
        mutationFn: async (formData: any) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, role: 'sales_rep' }),
                credentials: 'include'
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create rep');
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success('Sales Rep Created');
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-sales-reps'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    // Update Building Mutation (Assign Rep / Set Commission)
    const updateBuildingMutation = useMutation({
        mutationFn: async ({ buildingId, salesRepId, commissionRate }: any) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/buildings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: buildingId,
                    salesRepId: salesRepId,
                    salesRepCommissionRate: commissionRate
                }),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to update building');
            return res.json();
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

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create New Sales Rep</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="mt-1 block w-full border rounded-md p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="mt-1 block w-full border rounded-md p-2"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createRepMutation.isPending}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {createRepMutation.isPending ? 'Creating...' : 'Create Rep'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ManageRepBuildings = ({ rep, assignedBuildings, allBuildings, onUpdate }: any) => {
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [commissionRate, setCommissionRate] = useState(0.05);

    // const availableBuildings = allBuildings.filter((b: Building) => !b.salesRepId || b.salesRepId === rep.id);

    const handleAssign = () => {
        if (!selectedBuildingId) return;
        onUpdate({
            buildingId: selectedBuildingId,
            salesRepId: rep.id,
            commissionRate: commissionRate // When assigning, set default or chosen rate
        });
        setSelectedBuildingId('');
    };

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Managed Buildings for {rep.email}</h3>

            {/* Assign New */}
            <div className="flex items-end gap-2 bg-white p-3 rounded border">
                <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Assign Building</label>
                    <select
                        className="w-full border rounded p-1 text-sm"
                        value={selectedBuildingId}
                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                    >
                        <option value="">Select Building...</option>
                        {allBuildings
                            .filter((b: Building) => b.salesRepId !== rep.id) // Show all not assigned to THIS rep
                            .map((b: Building) => (
                                <option key={b.id} value={b.id}>
                                    {b.name} {b.salesRepId ? '(Has other rep)' : ''}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Comm. Rate (0-1)</label>
                    <input
                        type="number"
                        step="0.01"
                        className="w-24 border rounded p-1 text-sm"
                        value={commissionRate}
                        onChange={e => setCommissionRate(parseFloat(e.target.value))}
                    />
                </div>
                <button
                    onClick={handleAssign}
                    disabled={!selectedBuildingId}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                    Assign
                </button>
            </div>

            {/* List Assigned */}
            <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Building Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Commission Rate</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignedBuildings.map((b: Building) => (
                            <BuildingRow key={b.id} building={b} onUpdate={onUpdate} repId={rep.id} />
                        ))}
                        {assignedBuildings.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-4 py-2 text-sm text-gray-500 text-center">No buildings assigned.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BuildingRow = ({ building, onUpdate, repId }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rate, setRate] = useState(building.salesRepCommissionRate || 0.05);

    const handleSave = () => {
        onUpdate({
            buildingId: building.id,
            salesRepId: repId, // Keep same rep
            commissionRate: rate
        });
        setIsEditing(false);
    };

    const handleRemove = () => {
        if (!confirm('Remove Rep from this building?')) return;
        onUpdate({
            buildingId: building.id,
            salesRepId: null, // Clear rep
            commissionRate: 0.05 // Reset to default or keep?
        });
    };

    return (
        <tr>
            <td className="px-4 py-2 text-sm text-gray-900">{building.name}</td>
            <td className="px-4 py-2 text-sm text-gray-900">
                {isEditing ? (
                    <input
                        type="number"
                        step="0.01"
                        className="w-20 border rounded p-1"
                        value={rate}
                        onChange={e => setRate(parseFloat(e.target.value))}
                    />
                ) : (
                    <span>{(building.salesRepCommissionRate * 100).toFixed(1)}%</span>
                )}
            </td>
            <td className="px-4 py-2 text-right text-sm space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="text-green-600 font-medium">Save</button>
                        <button onClick={() => setIsEditing(false)} className="text-gray-500">Cancel</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-900">Edit %</button>
                        <button onClick={handleRemove} className="text-red-600 hover:text-red-900 ml-2">Remove</button>
                    </>
                )}
            </td>
        </tr>
    );
};

export default SalesRepsPage;

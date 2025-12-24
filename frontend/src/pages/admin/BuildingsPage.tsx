import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { X, Trash2 } from 'lucide-react';

interface Building {
    id: string;
    name: string;
    address: string;
    platformCommissionRate: number;
    softwareMonthlyFeeClp: number;
    totalUnits: number;
    totalVisitorSpots: number;
    stats: {
        totalRevenueClp: number;
        platformCommissionClp: number;
        softwareFeeClp: number;
        totalEarningsClp: number;
    };
}

export const BuildingsPage = () => {
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

    // Form state
    const [editForm, setEditForm] = useState({
        platformCommissionRate: 0.1,
        softwareMonthlyFeeClp: 0,
        name: '',
        address: ''
    });

    const { data: buildings, isLoading } = useQuery({
        queryKey: ['admin-buildings'],
        queryFn: async () => {
            const res = await api.get<{ data: Building[] }>('/admin/buildings');
            return res.data.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.put('/admin/buildings', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
            toast.success('Edificio actualizado correctamente');
            setIsEditOpen(false);
        },
        onError: () => {
            toast.error('Error al actualizar edificio');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/buildings?id=${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
            toast.success('Edificio eliminado correctamente');
        },
        onError: (error: any) => {
            // Safe access to error message
            const msg = error.response?.data?.error || 'Error al eliminar edificio';
            toast.error(msg);
        }
    });

    const handleEdit = (building: Building) => {
        setSelectedBuilding(building);
        setEditForm({
            platformCommissionRate: building.platformCommissionRate,
            softwareMonthlyFeeClp: building.softwareMonthlyFeeClp,
            name: building.name,
            address: building.address
        });
        setIsEditOpen(true);
    };

    const handleSave = () => {
        if (!selectedBuilding) return;
        updateMutation.mutate({
            id: selectedBuilding.id,
            ...editForm
        });
    };

    if (isLoading) return <div className="p-8">Cargando edificios...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Edificios (Super Admin)</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Edificio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Configuración Financiera</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estadísticas (Volumen / Ganancias Platform)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {buildings?.map((building) => (
                            <tr key={building.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900">{building.name}</div>
                                    <div className="text-sm text-slate-500">{building.address}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Units: {building.totalUnits} | Spots: {building.totalVisitorSpots}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900">
                                        Comisión: <span className="font-bold text-indigo-600">{(building.platformCommissionRate * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="text-sm text-slate-900">
                                        Fee Mensual: <span className="font-bold text-indigo-600">${building.softwareMonthlyFeeClp.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900">
                                        Total Procesado: ${building.stats.totalRevenueClp.toLocaleString()}
                                    </div>
                                    <div className="text-sm font-bold text-green-600 mt-1">
                                        Ganancia Platform: ${building.stats.totalEarningsClp.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        (Comisión: ${building.stats.platformCommissionClp.toLocaleString()} + Fee)
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEdit(building)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Estás seguro de que quieres eliminar este edificio? Esta acción no se puede deshacer.')) {
                                                deleteMutation.mutate(building.id);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium ml-4 flex items-center float-right"
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                Editar Configuración Financiera
                            </Dialog.Title>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Edificio</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Comisión Plataforma (0.1 = 10%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={editForm.platformCommissionRate}
                                    onChange={(e) => setEditForm({ ...editForm, platformCommissionRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fee Mensual (CLP)</label>
                                <input
                                    type="number"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={editForm.softwareMonthlyFeeClp}
                                    onChange={(e) => setEditForm({ ...editForm, softwareMonthlyFeeClp: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none"
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

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
    isActive: boolean;
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
    const [showArchived, setShowArchived] = useState(false); // Default: Hide archived
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    const [buildingToDelete, setBuildingToDelete] = useState<string | null>(null);

    // Form state
    const [editForm, setEditForm] = useState({
        platformCommissionRate: 0.1,
        softwareMonthlyFeeClp: 0,
        name: '',
        address: ''
    });

    const { data: buildings, isLoading } = useQuery({
        queryKey: ['admin-buildings', showArchived], // Refetch when filter changes
        queryFn: async () => {
            const res = await api.get<{ data: Building[] }>(`/admin/buildings?activeOnly=${!showArchived}`);
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
        mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
            await api.delete(`/admin/buildings?id=${id}${force ? '&force=true' : ''}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-buildings'] });
            toast.success('Edificio eliminado correctamente');
            setIsForceDeleteOpen(false);
            setBuildingToDelete(null);
        },
        onError: (err: any) => {
            if (err.response?.status === 409 && !isForceDeleteOpen) {
                // Conflict detected (dependencies exist), open Force Delete Modal
                setIsForceDeleteOpen(true);
            } else {
                toast.error(err.response?.data?.error || 'Error al eliminar edificio');
            }
        }
    });

    const handleToggleActive = (building: Building) => {
        const action = building.isActive ? 'Archivar' : 'Activar';
        if (confirm(`¿Seguro que quieres ${action} el edificio "${building.name}"?`)) {
            updateMutation.mutate({
                id: building.id,
                isActive: !building.isActive
            });
        }
    };

    const handleDelete = (id: string) => {
        setBuildingToDelete(id);
        if (confirm('¿Estás seguro de que deseas eliminar este edificio? Esta acción no se puede deshacer.')) {
            deleteMutation.mutate({ id });
        }
    };

    const confirmForceDelete = () => {
        if (buildingToDelete) {
            deleteMutation.mutate({ id: buildingToDelete, force: true });
        }
    };

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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Gestión de Edificios (Super Admin)</h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        Mostrar Archivados
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Edificio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Configuración Financiera</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estadísticas (Volumen / Ganancias Platform)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {buildings?.map((building) => (
                            <tr key={building.id} className={`hover:bg-slate-50 ${!building.isActive ? 'bg-gray-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900">{building.name}</div>
                                    <div className="text-sm text-slate-500">{building.address}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Units: {building.totalUnits} | Spots: {building.totalVisitorSpots}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${building.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {building.isActive ? 'Activo' : 'Archivado'}
                                    </span>
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
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => handleToggleActive(building)}
                                        className="text-xs font-medium text-gray-500 hover:text-gray-900"
                                    >
                                        {building.isActive ? 'Archivar' : 'Restaurar'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(building)}
                                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(building.id)}
                                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        title="Eliminar permanentemente"
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
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

            {/* Force Delete Confirmation Modal */}
            <Dialog open={isForceDeleteOpen} onClose={() => setIsForceDeleteOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border-2 border-red-500">
                        <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-red-600 flex items-center gap-2">
                            <Trash2 className="h-6 w-6" />
                            Conflicto: Registros Asociados detected
                        </Dialog.Title>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                No se puede eliminar este edificio porque tiene <b>historial financiero</b> (Reservas o Pagos).
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                ¿Deseas <b>FORZAR la eliminación</b>? Esto borrará permanentemente:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-600 mt-1 font-medium pl-2">
                                <li>Todas las reservas históricas</li>
                                <li>Registro de Pagos y Comisiones</li>
                                <li>Residentes y Unidades</li>
                            </ul>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                onClick={() => setIsForceDeleteOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
                                onClick={confirmForceDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Eliminando...' : 'SÍ, BORRAR TODO'}
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

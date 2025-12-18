import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
    const { register, handleSubmit } = useForm();

    // Fetch Buildings to let admin choose which one to update
    const { data: buildings } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return res.data.data;
        }
    });

    const updatePriceMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.put('/admin/prices', {
                buildingId: data.buildingId,
                newPrice: parseInt(data.newPrice, 10)
            });
        },
        onSuccess: (res) => {
            toast.success(`Precios actualizados: ${res.data.updatedCount} bloques afectados.`);
        },
        onError: () => {
            toast.error('Error al actualizar precios.');
        }
    });

    const onSubmit = (data: any) => {
        if (confirm(`¿Estás seguro de cambiar el precio base a $${data.newPrice} para todo el edificio?`)) {
            updatePriceMutation.mutate(data);
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h2>

            <div className="bg-white p-6 rounded-lg shadow max-w-lg">
                <h3 className="text-xl font-bold mb-4">Gestión de Precios</h3>
                <p className="text-gray-500 text-sm mb-6">
                    Actualiza el precio base para todos los estacionamientos de visitas en un edificio.
                    Esto afectará a los bloques futuros que estén disponibles.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Edificio</label>
                        <select
                            {...register('buildingId', { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        >
                            <option value="">Selecciona un edificio...</option>
                            {buildings?.map((b: any) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nuevo Precio Base (CLP)</label>
                        <input
                            type="number"
                            {...register('newPrice', { required: true, min: 0 })}
                            placeholder="Ej. 1500"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={updatePriceMutation.isPending}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                        {updatePriceMutation.isPending ? 'Actualizando...' : 'Actualizar Precios'}
                    </button>
                </form>
            </div>
        </div>
    );
};

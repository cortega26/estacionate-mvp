import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

type BuildingOption = {
    id: string
    name: string
}

type PriceUpdateFormValues = {
    buildingId: string
    newPrice: string
}

type PendingPriceUpdate = {
    buildingId: string
    buildingName: string
    newPrice: number
}

const formatClp = (value: number) => new Intl.NumberFormat('es-CL').format(value);

export const SettingsPage = () => {
    const [pendingUpdate, setPendingUpdate] = React.useState<PendingPriceUpdate | null>(null);
    const [draftSelection, setDraftSelection] = React.useState<PriceUpdateFormValues>({ buildingId: '', newPrice: '' });
    const { register, handleSubmit } = useForm<PriceUpdateFormValues>();

    // Fetch Buildings to let admin choose which one to update
    const { data: buildings } = useQuery({
        queryKey: ['buildings'],
        queryFn: async () => {
            const res = await api.get('/buildings');
            return res.data.data as BuildingOption[];
        }
    });

    const updatePriceMutation = useMutation({
        mutationFn: async (data: PendingPriceUpdate) => {
            return api.put('/admin/prices', {
                buildingId: data.buildingId,
                newPrice: data.newPrice
            });
        },
        onSuccess: (res) => {
            toast.success(`Valores demo actualizados: ${res.data.updatedCount} bloques afectados.`);
            setPendingUpdate(null);
        },
        onError: () => {
            toast.error('Error al actualizar valores demo.');
        }
    });

    const selectedBuilding = buildings?.find((building) => building.id === draftSelection.buildingId) ?? null;
    const parsedPrice = draftSelection.newPrice ? Number.parseInt(draftSelection.newPrice, 10) : null;

    const buildingField = register('buildingId', {
        required: true,
        onChange: (event) => {
            setDraftSelection((current) => ({
                ...current,
                buildingId: event.target.value,
            }));
        },
    });

    const priceField = register('newPrice', {
        required: true,
        min: 0,
        onChange: (event) => {
            setDraftSelection((current) => ({
                ...current,
                newPrice: event.target.value,
            }));
        },
    });

    const onSubmit = (data: PriceUpdateFormValues) => {
        const newPrice = Number.parseInt(data.newPrice, 10);
        const buildingName = buildings?.find((building) => building.id === data.buildingId)?.name;

        if (!buildingName || Number.isNaN(newPrice)) {
            toast.error('Selecciona un edificio y un valor demo válido antes de continuar.');
            return;
        }

        setPendingUpdate({
            buildingId: data.buildingId,
            buildingName,
            newPrice,
        });
    };

    const cancelPendingUpdate = () => {
        setPendingUpdate(null);
    };

    const confirmPendingUpdate = () => {
        if (!pendingUpdate) {
            return;
        }

        updatePriceMutation.mutate(pendingUpdate);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h2>

            <div className="bg-white p-6 rounded-lg shadow max-w-lg">
                <h3 className="text-xl font-bold mb-4">Gestión de valores demo</h3>
                <p className="text-gray-500 text-sm mb-6">
                    Actualiza el monto demo para todos los estacionamientos de visitas en un edificio.
                    Esto no habilita pagos reales y solo afectará a los bloques futuros disponibles.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700">Edificio</label>
                        <select
                            id="buildingId"
                            {...buildingField}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        >
                            <option value="">Selecciona un edificio...</option>
                            {buildings?.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="newPrice" className="block text-sm font-medium text-gray-700">Nuevo monto demo (CLP)</label>
                        <input
                            id="newPrice"
                            type="number"
                            {...priceField}
                            placeholder="Ej. 1500"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={updatePriceMutation.isPending}
                        className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                    >
                        {updatePriceMutation.isPending ? 'Actualizando...' : 'Actualizar valores demo'}
                    </button>
                </form>

                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Resumen previo</p>
                    <p className="mt-2 text-sm text-amber-900">
                        {selectedBuilding
                            ? `Aplicarás el nuevo monto demo al edificio ${selectedBuilding.name}.`
                            : 'Selecciona un edificio para revisar el alcance del cambio.'}
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                        {parsedPrice !== null && !Number.isNaN(parsedPrice)
                            ? `Monto demo propuesto: $${formatClp(parsedPrice)} CLP.`
                            : 'Ingresa el nuevo monto demo para preparar la confirmación.'}
                    </p>
                    <p className="mt-2 text-xs text-amber-800">
                        Este cambio solo afectará a los bloques futuros disponibles. Las reservas ya confirmadas no se modificarán.
                    </p>
                </div>

                {pendingUpdate && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <h4 className="text-lg font-semibold text-slate-900">Confirmar actualización de valores demo</h4>
                        <p className="mt-2 text-sm text-slate-700">
                            Revisa el alcance antes de aplicar el cambio masivo.
                        </p>

                        <dl className="mt-4 space-y-3 text-sm text-slate-700">
                            <div>
                                <dt className="font-medium text-slate-900">Edificio</dt>
                                <dd>{pendingUpdate.buildingName}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-900">Nuevo monto demo</dt>
                                <dd>${formatClp(pendingUpdate.newPrice)} CLP</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-900">Impacto esperado</dt>
                                <dd>Este ajuste solo afectará a los bloques futuros disponibles de este edificio.</dd>
                            </div>
                        </dl>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={cancelPendingUpdate}
                                disabled={updatePriceMutation.isPending}
                                className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmPendingUpdate}
                                disabled={updatePriceMutation.isPending}
                                className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {updatePriceMutation.isPending ? 'Confirmando...' : 'Confirmar actualización'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

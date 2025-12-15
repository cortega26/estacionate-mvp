import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Car, User, Phone } from 'lucide-react';

const bookingSchema = z.object({
    visitorName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    vehiclePlate: z.string().regex(/^[A-Z0-9]{4,6}$/i, 'Patente inválida (Ej: ABCD12)'),
    visitorPhone: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BookingFormData) => void;
    isLoading: boolean;
    spotNumber?: string;
    price?: number;
    defaultName?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    spotNumber,
    price,
    defaultName
}) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            visitorName: defaultName || '',
            vehiclePlate: '',
            visitorPhone: ''
        }
    });

    useEffect(() => {
        if (isOpen && defaultName) {
            reset({ visitorName: defaultName, vehiclePlate: '', visitorPhone: '' });
        }
    }, [isOpen, defaultName, reset]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative animate-fade-in">
                {/* Header */}
                <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">Confirmar Reserva</h3>
                        <p className="text-indigo-200 text-sm">Estacionamiento {spotNumber}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-indigo-700 rounded-full p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Price Tag */}
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                        <span className="text-gray-600 font-medium">Total a Pagar</span>
                        <span className="text-xl font-bold text-indigo-600">${price?.toLocaleString()}</span>
                    </div>

                    {/* Form Fields */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Patente del Vehículo</label>
                        <div className="relative">
                            <Car className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                {...register('vehiclePlate')}
                                placeholder="ABCD12"
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                            />
                        </div>
                        {errors.vehiclePlate && <p className="text-red-500 text-xs mt-1">{errors.vehiclePlate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Visita</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                {...register('visitorName')}
                                placeholder="Nombre completo"
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        {errors.visitorName && <p className="text-red-500 text-xs mt-1">{errors.visitorName.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                {...register('visitorPhone')}
                                placeholder="+569..."
                                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        {errors.visitorPhone && <p className="text-red-500 text-xs mt-1">{errors.visitorPhone.message}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:bg-indigo-400 flex justify-center items-center gap-2"
                        >
                            {isLoading ? 'Procesando...' : 'Ir a Pagar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

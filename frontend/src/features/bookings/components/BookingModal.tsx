import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Car, User, Phone, Lock, ShieldCheck, Building2, CalendarDays, Clock3 } from 'lucide-react';

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
    buildingName?: string;
    buildingAddress?: string;
    bookingStart?: string;
    bookingEnd?: string;
    durationLabel?: string;
}

const formatBookingDate = (value?: string) => {
    if (!value) return 'Por confirmar';

    return new Intl.DateTimeFormat('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(new Date(value));
};

const formatBookingTime = (start?: string, end?: string) => {
    if (!start || !end) return 'Por confirmar';

    const formatter = new Intl.DateTimeFormat('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
};

export const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
    spotNumber,
    price,
    defaultName,
    buildingName,
    buildingAddress,
    bookingStart,
    bookingEnd,
    durationLabel
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

                    <div className="rounded-md border border-indigo-100 bg-indigo-50/70 p-4 space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-indigo-900">Resumen antes de pagar</p>
                            <p className="text-xs text-indigo-700">Verifica estos datos antes de salir a Mercado Pago.</p>
                        </div>

                        <div className="space-y-2 text-sm text-slate-700">
                            <div className="flex gap-3">
                                <Building2 size={16} className="mt-0.5 shrink-0 text-indigo-700" />
                                <div>
                                    <p className="font-medium text-slate-900">Edificio</p>
                                    <p>{buildingName || 'Edificio por confirmar'}</p>
                                    {buildingAddress && <p className="text-xs text-slate-500">{buildingAddress}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <CalendarDays size={16} className="mt-0.5 shrink-0 text-indigo-700" />
                                <div>
                                    <p className="font-medium text-slate-900">Fecha</p>
                                    <p>{formatBookingDate(bookingStart)}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Clock3 size={16} className="mt-0.5 shrink-0 text-indigo-700" />
                                <div>
                                    <p className="font-medium text-slate-900">Horario</p>
                                    <p>{formatBookingTime(bookingStart, bookingEnd)}</p>
                                    <p className="text-xs text-slate-500">Duracion: {durationLabel || 'Por confirmar'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div>
                        <label htmlFor="vehiclePlate" className="block text-sm font-medium text-gray-700 mb-1">Patente del Vehículo</label>
                        <div className="relative">
                            <Car className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                id="vehiclePlate"
                                {...register('vehiclePlate')}
                                aria-invalid={!!errors.vehiclePlate}
                                aria-describedby={errors.vehiclePlate ? "vehiclePlate-error" : undefined}
                                placeholder="ABCD12"
                                className={`pl-10 block w-full rounded-md shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase ${errors.vehiclePlate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.vehiclePlate && (
                            <p id="vehiclePlate-error" className="text-red-500 text-xs mt-1" role="alert">
                                {errors.vehiclePlate.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">Nombre Visita</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                id="visitorName"
                                {...register('visitorName')}
                                aria-invalid={!!errors.visitorName}
                                aria-describedby={errors.visitorName ? "visitorName-error" : undefined}
                                placeholder="Nombre completo"
                                className={`pl-10 block w-full rounded-md shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.visitorName ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.visitorName && (
                            <p id="visitorName-error" className="text-red-500 text-xs mt-1" role="alert">
                                {errors.visitorName.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="visitorPhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono (Opcional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                id="visitorPhone"
                                {...register('visitorPhone')}
                                aria-invalid={!!errors.visitorPhone}
                                aria-describedby={errors.visitorPhone ? "visitorPhone-error" : undefined}
                                placeholder="+569..."
                                className={`pl-10 block w-full rounded-md shadow-sm border p-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.visitorPhone ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.visitorPhone && (
                            <p id="visitorPhone-error" className="text-red-500 text-xs mt-1" role="alert">
                                {errors.visitorPhone.message}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    {/* Actions */}
                    <div className="space-y-3 mt-6">
                        <div className="flex gap-3">
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
                                {isLoading ? (
                                    'Procesando...'
                                ) : (
                                    <>
                                        <Lock size={16} />
                                        Ir a Pagar
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Trust Signal */}
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                            <ShieldCheck size={14} className="text-green-600" />
                            <span>Pagos seguros vía MercadoPago</span>
                        </div>

                        <p className="text-center text-xs text-gray-500">
                            Al continuar, te redirigiremos a Mercado Pago para completar el cobro y luego volverás a Estacionate con el estado de tu reserva.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

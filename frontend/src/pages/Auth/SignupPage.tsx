import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

export const SignupPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            // Hardcoded Building ID for MVP (Torres del Parque from seed)
            // In real app, user selects via UI or link.
            // We'll use the ID we know exists from our earlier verification or a placeholder the user can edit if they know it.
            // Better: Fetch first building on mount? Or Just input/hardcode.
            // Let's hardcode the one from verification logs: 478c9ef2-7087-42cc-a255-70200d1e7618 (Wait, that UUID changes on re-seed usually)
            // We will ask for it in form for now, or fetch dynamically in a "BuildingSelect" component.
            // Simplification: Ask for Building ID string.

            const payload = { ...data, buildingId: data.buildingId || '478c9ef2-7087-42cc-a255-70200d1e7618' };

            const res = await api.post('/auth/signup', payload);
            if (res.data.success) {
                toast.success('¡Cuenta creada correctamente!');
                navigate('/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Falló el registro');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Crear Cuenta</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="sr-only">Nombre</label>
                                <input {...register('firstName')} placeholder="Nombre" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="sr-only">Apellido</label>
                                <input {...register('lastName')} placeholder="Apellido" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                        <div>
                            <input {...register('email')} type="email" placeholder="Correo Electrónico" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <input {...register('password')} type="password" placeholder="Contraseña" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div>
                            <input {...register('rut')} placeholder="RUT (12345678-9)" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input {...register('buildingId')} placeholder="ID Edificio" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                            <div>
                                <input {...register('unitNumber')} placeholder="Dpto (ej. 101)" className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <span className="text-gray-500">Al registrarte aceptas nuestros </span>
                            <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Términos y Condiciones
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Registrarse
                        </button>
                    </div>
                </form>
                <p className="mt-2 text-center text-sm text-gray-600">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600 hover:underline">Ingresa aquí</Link>
                </p>
            </div>
        </div>
    );
};

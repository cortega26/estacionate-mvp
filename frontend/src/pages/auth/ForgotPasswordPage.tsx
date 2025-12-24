import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
// import axios from 'axios';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';

type FormData = {
    email: string;
};

export const ForgotPasswordPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', data);
            setSuccess(true);
            toast.success('¡Enlace de recuperación enviado!');
        } catch (error) {
            // Security: Don't reveal if email exists, but safe to show generic error
            console.error(error);
            toast.error('Algo salió mal. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu WhatsApp</h2>
                    <p className="text-gray-600 mb-6">
                        Si existe una cuenta con ese email, hemos enviado un código de recuperación a tu número registrado.
                    </p>
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        Volver al Login
                    </Link>
                </div>
            </div >
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#009EE3] p-6 text-white text-center">
                    <h1 className="text-xl font-bold">Recuperación de Cuenta</h1>
                    <p className="text-blue-100 text-sm">Ingresa tu email para recibir un código</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                {...register('email', { required: 'El email es requerido' })}
                                type="email"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="john@example.com"
                            />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#009EE3] hover:bg-[#0081B8] text-white font-semibold py-3 rounded-lg transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Enviando...' : 'Enviar Código'}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Volver al Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

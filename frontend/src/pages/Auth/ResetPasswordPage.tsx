import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Lock, ArrowLeft } from 'lucide-react';

type FormData = {
    token: string;
    password: string;
    confirmPassword: string;
};

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenFromUrl = searchParams.get('token') || '';

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
        defaultValues: { token: tokenFromUrl }
    });
    const [loading, setLoading] = React.useState(false);

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            await axios.post('http://localhost:3000/api/auth/reset-password', {
                token: data.token,
                newPassword: data.password
            });
            toast.success('Password updated! Please login.');
            navigate('/login');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Failed to reset password';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#009EE3] p-6 text-white text-center">
                    <h1 className="text-xl font-bold">Reset Password</h1>
                    <p className="text-blue-100 text-sm">Create a new secure password</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">

                    {/* Token Field (Visible if not in URL, or just always visible for manual entry?) 
                    Let's make it visible but pre-filled so they can type the code from WhatsApp manually if needed.
                */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Recovery Code</label>
                        <div className="relative">
                            <input
                                {...register('token', { required: 'Code is required' })}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase tracking-widest text-center font-mono"
                                placeholder="XXXXXX"
                            />
                        </div>
                        {errors.token && <p className="text-red-500 text-xs mt-1">{errors.token.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="******"
                            />
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                {...register('confirmPassword', {
                                    required: 'Confirm Password is required',
                                    validate: (val: string) => {
                                        if (watch('password') != val) {
                                            return "Your passwords do no match";
                                        }
                                    },
                                })}
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="******"
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#009EE3] hover:bg-[#0081B8] text-white font-semibold py-3 rounded-lg transition-all shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Reseting...' : 'Set New Password'}
                    </button>

                    <div className="text-center">
                        <Link to="/login" className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

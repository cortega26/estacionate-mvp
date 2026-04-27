
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
    'AUTH-LOGIN-1002': 'Cuenta bloqueada temporalmente. Intente nuevamente en 15 minutos.',
    'AUTH-LOGIN-1003': 'Cuenta no verificada. Revise su correo o contacte a administración.',
    'AUTH-LOGIN-1004': 'Cuenta inactiva. Contacte a administración para reactivarla.'
};

const getLoginErrorMessage = (error: any) => {
    const errorCode = error?.response?.data?.code;
    const publicMessage = error?.response?.data?.publicMessage ?? error?.response?.data?.message;
    const legacyMessage = error?.response?.data?.error;

    if (typeof errorCode === 'string' && LOGIN_ERROR_MESSAGES[errorCode]) {
        return LOGIN_ERROR_MESSAGES[errorCode];
    }

    return publicMessage || legacyMessage || 'Falló el inicio de sesión';
};

export const LoginPage = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const onSubmit = async (data: any) => {
        try {
            const res = await api.post('/auth/login', data);
            if (res.data.success) {
                const authenticatedUser = res.data.user;

                setAuth(authenticatedUser);
                toast.success('¡Bienvenida/o!');

                // Role-based redirect
                if (authenticatedUser.role === 'concierge') {
                    navigate('/gatekeeper');
                } else if (authenticatedUser.role === 'sales_rep') {
                    navigate('/sales');
                } else if (['admin', 'building_admin', 'support'].includes(authenticatedUser.role)) {
                    navigate('/admin');
                } else {
                    navigate('/search');
                }
            }
        } catch (error: any) {
            toast.error(getLoginErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                        <input
                            id="email"
                            {...register('email', { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            type="email"
                        />
                        {errors.email && <span className="text-red-500 text-xs">El correo es obligatorio</span>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input
                            id="password"
                            {...register('password', { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            type="password"
                        />
                        {errors.password && <span className="text-red-500 text-xs">La contraseña es obligatoria</span>}
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 hover:text-white"
                    >
                        Ingresar
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600">
                    ¿No tienes cuenta? <Link to="/signup" className="text-indigo-600 hover:underline">Regístrate</Link>
                </p>
            </div>
        </div>
    );
};

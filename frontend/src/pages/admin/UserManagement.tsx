import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
// import { useAuthStore } from '../../store/authStore';

type UserAction = 'ban' | 'unban' | 'promote_admin';

interface User {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    building?: { name: string };
    accountType?: 'user' | 'resident';
}

interface PendingUserAction {
    userId: string;
    userEmail: string;
    action: UserAction;
}

const getActionLabel = (action: UserAction) => {
    if (action === 'ban') return 'ban';
    if (action === 'unban') return 'unban';
    return 'promote';
};

const UserManagement = () => {
    // Auth handled via cookies
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', page, search],
        queryFn: async () => {
            const params: any = { page };
            if (search) params.search = search;
            const { data } = await api.get(`/admin/users`, { params });
            return data;
        }
    });

    const mutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string, action: string }) => {
            const { data } = await api.patch(`/admin/users`, { userId, action });
            return data;
        },
        onSuccess: () => {
            setPendingAction(null);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });

    const handleAction = (user: User, action: UserAction) => {
        setPendingAction({
            userId: user.id,
            userEmail: user.email,
            action,
        });
    };

    const cancelPendingAction = () => {
        setPendingAction(null);
    };

    const confirmPendingAction = () => {
        if (!pendingAction) {
            return;
        }

        mutation.mutate({ userId: pendingAction.userId, action: pendingAction.action });
    };

    if (isLoading) return <div className="p-8">Loading Users...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>

            {/* Search */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Search email or phone..."
                    className="border p-2 rounded w-full max-w-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {pendingAction && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-amber-950">Confirmar cambio de estado</h2>
                    <p className="mt-2 text-sm text-amber-900">
                        Revisa la acción antes de actualizar el estado de la cuenta.
                    </p>
                    <dl className="mt-4 space-y-3 text-sm text-amber-900">
                        <div>
                            <dt className="font-medium text-amber-950">Usuario</dt>
                            <dd>{pendingAction.userEmail}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-amber-950">Acción</dt>
                            <dd>{getActionLabel(pendingAction.action)}</dd>
                        </div>
                    </dl>
                    <p className="mt-3 text-xs text-amber-800">
                        Cancela si seleccionaste la cuenta equivocada. El cambio solo se aplicará cuando confirmes la acción.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={cancelPendingAction}
                            disabled={mutation.isPending}
                            className="w-full rounded-md border border-amber-300 bg-white px-4 py-2 text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmPendingAction}
                            disabled={mutation.isPending}
                            className="w-full rounded-md bg-amber-950 px-4 py-2 text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {mutation.isPending ? 'Aplicando...' : 'Confirmar acción'}
                        </button>
                    </div>
                </section>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data?.data?.map((user: User) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                    <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.isActive ? (
                                        <span className="text-green-600 text-sm">Active</span>
                                    ) : (
                                        <span className="text-red-600 text-sm">Banned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.building?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    {user.isActive ? (
                                        <button
                                            onClick={() => handleAction(user, 'ban')}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Ban
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(user, 'unban')}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Unban
                                        </button>
                                    )}
                                    {user.role !== 'admin' && user.accountType !== 'resident' && (
                                        <button
                                            onClick={() => handleAction(user, 'promote_admin')}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Promote
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-600">
                    Page {data?.pagination?.page} of {data?.pagination?.totalPages}
                </span>
                <button
                    disabled={page >= (data?.pagination?.totalPages || 1)}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default UserManagement;

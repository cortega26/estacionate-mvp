import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useAuthStore } from '../../store/authStore';

interface User {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    building?: { name: string };
}

const UserManagement = () => {
    // Auth handled via cookies
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString() });
            if (search) params.append('search', search);

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, {
                credentials: 'include'
            });
            return res.json();
        }
    });

    const mutation = useMutation({
        mutationFn: async ({ userId, action }: { userId: string, action: string }) => {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, action }),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Action failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });

    const handleAction = (userId: string, action: string) => {
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            mutation.mutate({ userId, action });
        }
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
                                            onClick={() => handleAction(user.id, 'ban')}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Ban
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleAction(user.id, 'unban')}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Unban
                                        </button>
                                    )}
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => handleAction(user.id, 'promote_admin')}
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

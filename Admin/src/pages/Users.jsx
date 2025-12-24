import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi';

const fetchUsers = async () => {
    // Assuming this endpoint exists or will be created. 
    // Usually GET /api/users is admin protected and returns all users.
    const { data } = await axios.get('/users');
    return data;
};

const Users = () => {
    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-600">
                Error loading users. Ensure you are an admin.
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Users</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Manage registered accounts and view details.</p>
            </div>

            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                            {(users || []).map((user) => (
                                <tr key={user._id} className="hover:opacity-80 transition-opacity">
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                        <div className="flex items-center gap-2">
                                            <FiMail className="w-4 h-4" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                        <div className="flex items-center gap-2">
                                            <FiCalendar className="w-4 h-4" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                                        {user._id}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default Users;

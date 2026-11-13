import React, { useEffect, useState } from 'react';
import { 
    LuShieldCheck, 
    LuShieldOff, 
    LuUserX, 
    LuShield, 
    LuUser, 
    LuRefreshCw, 
    LuCircleAlert,     // ✅ corrigé (était LuAlertCircle)
    LuCircleCheckBig,  // ✅ corrigé (était LuCheckCircle2)
    LuX,
    LuTrash2
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import AdminShell from '../../components/admin/AdminShell';

const AdminUsers = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/users');
            setUsers(response.data || []);
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            showToast('Erreur lors du chargement des utilisateurs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    const handlePromote = async (id) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/users/${id}/promote`);
            showToast('Utilisateur promu administrateur');
            await fetchUsers();
        } catch (error) {
            console.error('Erreur promotion:', error);
            showToast('Erreur lors de la promotion', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDemote = async (id) => {
        try {
            setActionLoading(true);
            await api.put(`/admin/users/${id}/demote`);
            showToast('Administrateur rétrogradé');
            await fetchUsers();
        } catch (error) {
            console.error('Erreur rétrogradation:', error);
            showToast('Erreur lors de la rétrogradation', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser?.id) return;
        try {
            setActionLoading(true);
            await api.delete(`/admin/users/${selectedUser.id}`);
            showToast('Utilisateur supprimé avec succès');
            await fetchUsers();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showToast('Erreur lors de la suppression', 'error');
        } finally {
            setActionLoading(false);
            setOpenDialog(false);
            setSelectedUser(null);
        }
    };

    return (
        <AdminShell
            active="users"
            title="Gestion des utilisateurs"
            subtitle="Contrôle des accès, rôles administrateur et comptes autorisés à consulter la plateforme."
            badge={
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                    {users.length} {users.length > 1 ? 'utilisateurs' : 'utilisateur'}
                </span>
            }
            actions={
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg transition-all shadow-sm disabled:opacity-50"
                    title="Rafraîchir la liste"
                >
                    <LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            }
        >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <LuRefreshCw size={24} className="animate-spin text-indigo-600" />
                        <p className="text-[13px] font-medium text-gray-500">Chargement des utilisateurs...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Utilisateur</th>
                                    <th className="py-3.5 px-5">Email</th>
                                    <th className="py-3.5 px-5">Rôle</th>
                                    <th className="py-3.5 px-5">Date d'inscription</th>
                                    <th className="py-3.5 px-5 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[13px]">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                                            Aucun utilisateur enregistré.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => {
                                        const isCurrentUser = u.email === user?.email;
                                        const isUserAdmin = u.role === 'ADMIN';

                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3.5 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=${isUserAdmin ? 'EEF2FF' : 'F3F4F6'}&color=${isUserAdmin ? '4F46E5' : '374151'}`}
                                                            alt={u.fullName}
                                                            className="w-9 h-9 rounded-lg border border-gray-200 object-cover"
                                                        />
                                                        <div>
                                                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                                                                {u.fullName || 'Non renseigné'}
                                                                {isCurrentUser && (
                                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-normal border border-gray-200">
                                                                        Vous
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-5 text-gray-600 font-medium">
                                                    {u.email}
                                                </td>

                                                <td className="py-3.5 px-5">
                                                    {isUserAdmin ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            <LuShield size={14} className="text-indigo-600" />
                                                            Admin
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                            <LuUser size={14} className="text-gray-500" />
                                                            Utilisateur
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-5 text-gray-500">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    }) : '-'}
                                                </td>

                                                <td className="py-3.5 px-5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isUserAdmin ? (
                                                            <button
                                                                onClick={() => handleDemote(u.id)}
                                                                disabled={isCurrentUser || actionLoading}
                                                                title={isCurrentUser ? "Vous ne pouvez pas vous rétrograder vous-même" : "Rétrograder en utilisateur"}
                                                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                                                            >
                                                                <LuShieldOff size={17} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePromote(u.id)}
                                                                disabled={actionLoading}
                                                                title="Promouvoir administrateur"
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                                                            >
                                                                <LuShieldCheck size={17} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => { setSelectedUser(u); setOpenDialog(true); }}
                                                            disabled={isCurrentUser || actionLoading}
                                                            title={isCurrentUser ? "Vous ne pouvez pas supprimer votre propre compte" : "Supprimer l'utilisateur"}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                                                        >
                                                            <LuUserX size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {openDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 flex-shrink-0">
                                <LuTrash2 size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900">
                                    Confirmer la suppression
                                </h3>
                                <p className="text-[13px] text-gray-500 mt-1">
                                    Voulez-vous vraiment supprimer l'utilisateur <strong className="text-gray-900">{selectedUser?.fullName}</strong> ({selectedUser?.email}) ?
                                </p>
                                <p className="text-[12px] text-red-600 font-medium mt-2 bg-red-50 p-2 rounded border border-red-100">
                                    Cette action est irréversible et supprimera définitivement ses accès.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => { setOpenDialog(false); setSelectedUser(null); }}
                                disabled={actionLoading}
                                className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 text-[13px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {actionLoading && <LuRefreshCw size={14} className="animate-spin" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50">
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-[13px] font-medium ${
                        toast.type === 'error'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                        {toast.type === 'error' ? (
                            <LuCircleAlert size={18} className="text-red-600" />
                        ) : (
                            <LuCircleCheckBig size={18} className="text-emerald-600" />
                        )}
                        <span>{toast.message}</span>
                        <button
                            onClick={() => setToast({ ...toast, show: false })}
                            className="ml-2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                        >
                            <LuX size={14} />
                        </button>
                    </div>
                </div>
            )}
        </AdminShell>
    );
};

export default AdminUsers;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LuUsers, 
    LuMessageSquare, 
    LuZap, 
    LuFileText, 
    LuRefreshCw, 
    LuLock, 
    LuDatabase, 
    LuCloudUpload, 
    LuTrendingUp, 
    LuClock 
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import AdminShell, { AdminStatCard } from '../../components/admin/AdminShell';

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAdmins: 0,
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        cacheHitRate: 0,
        documentsCount: 0,
        qdrantPoints: 0,
        status: 'unknown'
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/admin/stats');
            setStats(prev => ({
                ...prev,
                totalUsers: data.totalUsers || 0,
                totalAdmins: data.totalAdmins || 0,
                totalConversations: data.totalConversations || prev.totalConversations,
                totalMessages: data.totalMessages || prev.totalMessages,
                avgResponseTime: data.avgResponseTime || prev.avgResponseTime,
                cacheHitRate: data.cacheHitRate || prev.cacheHitRate
            }));
        } catch (e) {
            console.error('Erreur lors de la récupération des statistiques:', e);
        }
    };

    const fetchFlaskStats = async () => {
        try {
            const { data } = await api.get('/admin/metrics');
            setStats(prev => ({
                ...prev,
                documentsCount: data.documents_count || 0,
                qdrantPoints: data.qdrant_points || 0,
                status: data.status || 'unknown'
            }));
        } catch (e) {
            console.error('Erreur lors de la récupération des métriques Flask:', e);
        }
    };

    const refreshDashboard = async () => {
        setLoading(true);
        await Promise.all([fetchStats(), fetchFlaskStats()]);
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) refreshDashboard();
    }, [isAdmin]);

    /* ─── Accès Refusé ─── */
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-xl p-8 text-center border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full mx-auto mb-4 flex items-center justify-center border border-rose-100">
                        <LuLock size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-2">
                        Accès restreint
                    </h2>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        Cette zone est réservée aux administrateurs de la plateforme Pulse Juridique.
                    </p>
                    <button
                        onClick={() => navigate('/chat')}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                    >
                        Retourner à l'application
                    </button>
                </div>
            </div>
        );
    }

    const isPipelineReady = stats.qdrantPoints > 0;

    const statCardItems = [
        {
            label: 'Utilisateurs',
            value: stats.totalUsers,
            icon: <LuUsers className="text-indigo-600" />,
            detail: (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {stats.totalAdmins} administrateurs
                </span>
            )
        },
        {
            label: 'Conversations',
            value: stats.totalConversations,
            icon: <LuMessageSquare className="text-emerald-600" />,
            detail: (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {stats.totalMessages} messages
                </span>
            )
        },
        {
            label: 'Temps de réponse',
            value: `${stats.avgResponseTime || 0}s`,
            icon: <LuZap className="text-amber-500" />,
            detail: (
                <div className="w-full mt-1">
                    <div className="w-full bg-amber-100/60 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300 bg-amber-500"
                            style={{ width: `${Math.min(((stats.avgResponseTime || 0) / 10) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            label: 'Documents',
            value: stats.documentsCount || 0,
            icon: <LuFileText className="text-violet-600" />,
            detail: (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                    {stats.qdrantPoints || 0} vecteurs Qdrant
                </span>
            )
        }
    ];

    return (
        <AdminShell
            active="dashboard"
            title="Tableau de bord"
            subtitle="Vue d'ensemble des performances, de l'indexation et de l'activité du système."
            actions={
                <button
                    onClick={refreshDashboard}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    title="Rafraîchir les données"
                >
                    <LuRefreshCw size={16} className={loading ? 'animate-spin text-indigo-600' : ''} />
                </button>
            }
        >
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <LuRefreshCw size={24} className="animate-spin text-indigo-600" />
                    <p className="text-xs font-medium text-slate-500">
                        Chargement des données...
                    </p>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* ─── Cartes statistiques ─── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCardItems.map((item) => (
                            <AdminStatCard key={item.label} {...item} />
                        ))}
                    </div>

                    {/* ─── Cache & Pipeline ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Performance du Cache */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                    <LuDatabase size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Performances du Cache
                                    </h3>
                                    <p className="text-xs text-slate-500">Taux de mémoire vive instantanée</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100"
                                            strokeWidth="3.5"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-blue-600 transition-all duration-700 ease-out"
                                            strokeDasharray={`${stats.cacheHitRate || 0}, 100`}
                                            strokeWidth="3.5"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-lg font-bold text-blue-600 leading-tight">
                                            {stats.cacheHitRate || 0}%
                                        </span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                                            Hit Rate
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-slate-900">
                                        Efficacité du système
                                    </h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Un taux élevé garantit des réponses immédiates sans recalcul vectoriel gourmand.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pipeline d'ingestion */}
                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <LuCloudUpload size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Pipeline d'ingestion
                                        </h3>
                                        <p className="text-xs text-slate-500">Moteur vectoriel Qdrant</p>
                                    </div>
                                </div>

                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                                    isPipelineReady 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                    {isPipelineReady ? (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    ) : (
                                        <LuClock size={14} className="text-amber-500" />
                                    )}
                                    {isPipelineReady ? 'Opérationnel' : 'En attente'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                                    <span className="text-xs text-slate-600 font-medium">
                                        Points vectoriels (Qdrant)
                                    </span>
                                    <span className="text-xs font-bold text-violet-700">
                                        {stats.qdrantPoints?.toLocaleString() || 0}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                                    <span className="text-xs text-slate-600 font-medium">
                                        Documents indexés
                                    </span>
                                    <span className="text-xs font-bold text-emerald-700">
                                        {stats.documentsCount?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ─── Banner résumé volume ─── */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <LuTrendingUp size={18} />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                                        Activité
                                    </span>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Volume global de la plateforme
                                    </h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                {[
                                    ['Utilisateurs', stats.totalUsers, 'text-indigo-600'],
                                    ['Admins', stats.totalAdmins, 'text-blue-600'],
                                    ['Sessions', stats.totalConversations, 'text-emerald-600'],
                                    ['Messages', stats.totalMessages, 'text-violet-600']
                                ].map(([label, value, colorClass]) => (
                                    <div key={label} className="text-left sm:text-center">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {label}
                                        </p>
                                        <p className={`text-base font-bold mt-0.5 ${colorClass}`}>
                                            {value?.toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </AdminShell>
    );
};

export default AdminDashboard;
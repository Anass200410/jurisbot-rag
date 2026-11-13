import React, { useEffect, useState } from 'react';
import { Rating } from '@mui/material';
import {
    LuActivity,
    LuDatabase,
    LuFileText,
    LuMessageSquare,
    LuRefreshCw,
    LuStar
} from 'react-icons/lu';
import api from '../../api/axios';
import AdminShell, { AdminStatCard } from '../../components/admin/AdminShell';

const initialMetrics = {
    documents_count: 0,
    qdrant_points: 0,
    collection_name: '',
    status: 'unknown'
};

const initialFeedback = { count: 0, average: 0, distribution: {}, recent: [] };

const MetricPanel = ({ icon, title, description, children }) => (
    <section className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                {icon}
            </div>
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
        </div>
        {children}
    </section>
);

const AdminMetrics = () => {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [feedback, setFeedback] = useState(initialFeedback);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const [systemResult, feedbackResult] = await Promise.allSettled([
                api.get('/admin/metrics'),
                api.get('/admin/feedback')
            ]);

            if (systemResult.status === 'fulfilled') setMetrics(systemResult.value.data);
            else console.error('Erreur chargement métriques:', systemResult.reason);

            if (feedbackResult.status === 'fulfilled') setFeedback(feedbackResult.value.data);
            else console.error('Erreur chargement évaluations:', feedbackResult.reason);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const occupancy = Math.min(((metrics.qdrant_points || 0) / 10000) * 100, 100);
    const isReady = metrics.status === 'ready';
    const hasStatus = metrics.status && metrics.status !== 'unknown';
    const averageRating = Number(feedback.average || 0);
    const statCardItems = [
        {
            label: 'Documents indexés',
            value: (metrics.documents_count || 0).toLocaleString('fr-FR'),
            icon: <LuFileText className="text-emerald-600" />,
            detail: <span>Documents disponibles dans le corpus juridique</span>
        },
        {
            label: 'Points vectoriels',
            value: (metrics.qdrant_points || 0).toLocaleString('fr-FR'),
            icon: <LuDatabase className="text-indigo-600" />,
            detail: <span>Segments enregistrés dans Qdrant</span>
        },
        {
            label: 'Avis utilisateurs',
            value: (feedback.count || 0).toLocaleString('fr-FR'),
            icon: <LuMessageSquare className="text-violet-600" />,
            detail: <span>Évaluations reçues sur les réponses</span>
        },
        {
            label: 'Note moyenne',
            value: `${averageRating.toFixed(2)} / 5`,
            icon: <LuStar className="text-amber-500" />,
            detail: <Rating value={averageRating} precision={0.1} readOnly size="small" />
        }
    ];

    return (
        <AdminShell
            active="metrics"
            title="Métriques du système"
            subtitle="Suivez l'indexation du corpus juridique, l'état de Qdrant et les retours des utilisateurs."
            badge={(
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                    isReady
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isReady ? 'Index opérationnel' : hasStatus ? 'Index en attente' : 'Statut indisponible'}
                </span>
            )}
            actions={(
                <button
                    onClick={fetchMetrics}
                    disabled={loading}
                    className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    title="Rafraîchir les données"
                    aria-label="Rafraîchir les données"
                >
                    <LuRefreshCw size={16} className={loading ? 'animate-spin text-indigo-600' : ''} />
                </button>
            )}
        >
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <LuRefreshCw size={24} className="animate-spin text-indigo-600" />
                    <p className="text-xs font-medium text-slate-500">Chargement des données...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {statCardItems.map((item) => (
                            <AdminStatCard key={item.label} {...item} />
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        <MetricPanel
                            icon={<LuActivity size={18} />}
                            title="État de l'indexation"
                            description="Informations de la collection vectorielle."
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                                    <span className="text-xs font-medium text-slate-600">Collection Qdrant</span>
                                    <code className="max-w-[60%] truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800">
                                        {metrics.collection_name || 'moroccan_law'}
                                    </code>
                                </div>
                                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                                    <span className="text-xs font-medium text-slate-600">Disponibilité</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                        isReady
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        {isReady ? 'Prêt pour les requêtes' : hasStatus ? 'Index en chargement' : 'Inconnue'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-xs font-medium text-slate-600">Occupation estimée</span>
                                    <span className="text-xs font-bold text-slate-900">{Math.round(occupancy)}%</span>
                                </div>
                                <div
                                    className="h-2 rounded-full bg-slate-100 overflow-hidden"
                                    role="progressbar"
                                    aria-label="Occupation estimée de la collection"
                                    aria-valuenow={Math.round(occupancy)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${occupancy}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-2">Estimation basée sur une capacité de 10&nbsp;000 points.</p>
                            </div>
                        </MetricPanel>

                        <MetricPanel
                            icon={<LuStar size={18} />}
                            title="Évaluation des réponses"
                            description="Répartition des notes données par les utilisateurs."
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                                <div className="flex items-center gap-3 sm:min-w-[150px]">
                                    <span className="text-4xl font-bold tracking-tight text-slate-900">{averageRating.toFixed(2)}</span>
                                    <div>
                                        <Rating value={averageRating} precision={0.1} readOnly size="small" />
                                        <p className="text-[11px] text-slate-500 mt-1">sur 5 · {feedback.count || 0} avis</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    {[5, 4, 3, 2, 1].map((stars) => {
                                        const count = feedback.distribution?.[stars] || 0;
                                        const percent = feedback.count ? (count / feedback.count) * 100 : 0;
                                        return (
                                            <div key={stars} className="flex items-center gap-2.5">
                                                <span className="w-7 text-[11px] font-medium text-slate-500">{stars} ★</span>
                                                <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="w-7 text-right text-[11px] text-slate-500">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </MetricPanel>
                    </div>

                    <MetricPanel
                        icon={<LuMessageSquare size={18} />}
                        title="Avis récents"
                        description="Dernières évaluations laissées après une réponse."
                    >
                        {feedback.recent?.length ? (
                            <div className="divide-y divide-slate-100">
                                {feedback.recent.map((item) => (
                                    <article key={item.messageId} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                            <span className="text-xs font-semibold text-slate-800 truncate">{item.user}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Rating value={item.rating} readOnly size="small" sx={{ '& .MuiRating-icon': { fontSize: 15 }, color: '#F59E0B' }} />
                                                <span className="text-[10px] text-slate-400">
                                                    {item.ratedAt ? new Date(item.ratedAt).toLocaleDateString('fr-FR') : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs leading-relaxed text-slate-500">{item.answer}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
                                <p className="text-xs font-medium text-slate-500">Aucun avis pour le moment</p>
                                <p className="text-[11px] text-slate-400 mt-1">Les évaluations apparaîtront ici après les premières réponses notées.</p>
                            </div>
                        )}
                    </MetricPanel>
                </div>
            )}
        </AdminShell>
    );
};

export default AdminMetrics;

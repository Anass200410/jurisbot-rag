import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    LuLayoutDashboard, 
    LuUsers, 
    LuFileText, 
    LuActivity, 
    LuMessageSquare, 
    LuLogOut, 
    LuChevronRight 
} from 'react-icons/lu';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/pulse.png';

// ============ PALETTE HARMONISÉE ============
export const adminColors = {
    bg: '#F8FAFC',           // Fond gris ultra-clair
    panel: '#FFFFFF',        // Blanc pur
    panelBorder: '#E2E8F0',  // Bordures gris neutre
    ink: '#0F172A',          // Texte sombre
    muted: '#64748B',        // Texte secondaire
    line: '#F1F5F9',         // Séparateurs
    primary: '#4F46E5',      // Indigo
    danger: '#DC2626'        // Rouge
};

// ============ STYLES BOUTONS ============
export const goldButtonSx = {
    bgcolor: '#4F46E5',
    color: '#FFFFFF',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px',
    px: 2.2,
    py: 1,
    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.15)',
    '&:hover': { bgcolor: '#4338CA' },
    '&:disabled': { bgcolor: '#F1F5F9', color: '#94A3B8' }
};

export const outlineButtonSx = {
    borderColor: '#E2E8F0',
    color: '#334155',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px',
    px: 2,
    py: 1,
    bgcolor: '#FFFFFF',
    boxShadow: 'none',
    '&:hover': { borderColor: '#C7D2FE', bgcolor: '#EEF2FF', color: '#4F46E5' }
};

export const primaryButtonSx = {
    bgcolor: '#4F46E5',
    color: '#FFFFFF',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px',
    px: 2.2,
    py: 1,
    boxShadow: '0 1px 2px rgba(79, 70, 229, 0.2)',
    '&:hover': { bgcolor: '#4338CA' }
};

export const dangerButtonSx = {
    bgcolor: '#FEF2F2',
    color: adminColors.danger,
    border: '1px solid #FEE2E2',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px',
    px: 2.2,
    py: 1,
    '&:hover': { bgcolor: '#FEE2E2' }
};

// ============ STYLES CONTENEURS ============
export const panelSx = {
    bgcolor: '#FFFFFF',
    border: `1px solid ${adminColors.panelBorder}`,
    borderRadius: '12px',
    p: 3,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
};

export const cardSx = {
    bgcolor: '#FFFFFF',
    border: `1px solid ${adminColors.panelBorder}`,
    borderRadius: '10px',
    p: 2.5,
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
};

export const tableContainerSx = {
    bgcolor: '#FFFFFF',
    border: `1px solid ${adminColors.panelBorder}`,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
};

export const tableHeadSx = {
    bgcolor: '#F8FAFC',
    '& .MuiTableCell-root': {
        color: adminColors.muted,
        fontWeight: 700,
        fontSize: '0.70rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        borderBottom: `1px solid ${adminColors.panelBorder}`
    }
};

export const tableBodySx = {
    '& .MuiTableCell-root': {
        borderBottom: `1px solid ${adminColors.line}`,
        fontSize: '0.86rem',
        color: adminColors.ink
    }
};

export const tableRowSx = {
    transition: 'background-color 0.15s ease',
    '&:hover': { bgcolor: '#F8FAFC' }
};

export const tableCellSx = {
    py: 1.8,
    px: 2.5
};

export const pageHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    mb: 4
};

export const badgeSx = {
    bgcolor: '#EEF2FF',
    color: '#4338CA',
    border: '1px solid #C7D2FE',
    fontWeight: 600,
    fontSize: '0.70rem'
};

// ============ MENU ============
const menuItems = [
    { text: 'Tableau de bord', icon: LuLayoutDashboard, path: '/admin', key: 'dashboard' },
    { text: 'Utilisateurs', icon: LuUsers, path: '/admin/users', key: 'users' },
    { text: 'Documents', icon: LuFileText, path: '/admin/documents', key: 'documents' },
    { text: 'Métriques', icon: LuActivity, path: '/admin/metrics', key: 'metrics' }
];

// ============ COMPOSANT ADMIN STAT CARD ============
export const AdminStatCard = ({ label, value, detail, icon }) => {
    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between h-full hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {label}
                        </span>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {value}
                        </h3>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/80 text-slate-700">
                        {React.cloneElement(icon, { size: 20 })}
                    </div>
                </div>
            </div>

            {detail && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    {detail}
                </div>
            )}
        </div>
    );
};

// ============ SHELL PRINCIPAL ============
const AdminShell = ({ active, title, subtitle, badge, actions, children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans antialiased">
            {/* Sidebar COLORÉE & STRUCTURÉE */}
            <aside className="hidden md:flex w-[280px] bg-white border-r border-slate-200 flex-col justify-between fixed top-0 bottom-0 left-0 z-20">
                <div>
                    {/* Header Logo */}
                    <div className="pt-6 pb-4 px-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <img src={Logo} alt="Logo" className="h-6 w-6 object-contain" />
                            </div>
                            <div>
                                <span className="font-semibold text-sm text-slate-900 block leading-tight">
                                    Pulse Juridique
                                </span>
                                <span className="text-[11px] font-semibold text-indigo-600 block mt-0.5">
                                    Console Administration
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation colorée */}
                    <nav className="px-3 pt-5 space-y-1">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Menu principal
                        </div>
                        {menuItems.map((item) => {
                            const selected = active === item.key;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.key}
                                    to={item.path}
                                    className={`px-3 py-2.5 rounded-lg flex items-center gap-3 text-xs transition-all duration-150 ${
                                        selected
                                            ? 'bg-indigo-50/80 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs'
                                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon
                                        size={18}
                                        className={selected ? 'text-indigo-600' : 'text-slate-400'}
                                    />
                                    <span className="flex-1 truncate">{item.text}</span>
                                    {selected && <LuChevronRight size={14} className="text-indigo-500" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Profil Utilisateur (Bas de Sidebar) */}
                <div className="p-3 border-t border-slate-100 bg-white space-y-2">
                    <Link
                        to="/chat"
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    >
                        <LuMessageSquare size={16} className="text-indigo-500" />
                        <span>Retour au chat</span>
                    </Link>

                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                {(user?.fullName || 'A').trim().charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-xs truncate leading-tight">
                                {user?.fullName || 'Administrateur'}
                            </p>
                            <p className="text-[10px] font-medium text-indigo-600 truncate">
                                Administrateur
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Se déconnecter"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                            <LuLogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Zone Principale */}
            <main className="flex-1 min-w-0 ml-0 px-4 py-5 md:ml-[280px] md:p-8 max-w-7xl">
                <nav className="grid grid-cols-4 gap-1 mb-5 rounded-xl border border-slate-200 bg-white p-1 md:hidden">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const selected = active === item.key;
                        return (
                            <Link
                                key={item.key}
                                to={item.path}
                                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-semibold ${selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                            >
                                <Icon size={17} />
                                <span className="w-full truncate text-center">{item.text}</span>
                            </Link>
                        );
                    })}
                </nav>
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                                Administration
                            </span>
                            {badge}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </header>

                <div className="space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminShell;

// src/components/chat/Sidebar.jsx
import React, { useState } from 'react';
import { 
    LuMessageSquare, LuTrash2, LuPencil, LuLogOut, 
    LuSettings2, LuMoon, LuSun, LuChevronsUpDown,
    LuChevronLeft, LuChevronRight, LuChevronDown, LuSearch
} from 'react-icons/lu';
import { isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/useTheme';
import { toast } from 'react-toastify';

import Logo from '../../assets/pulse.png'; 

const Sidebar = ({
    open,
    onToggle,
    conversations,
    currentConversation,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
    onRenameConversation,
    user,
    onLogout,
    isMobile,
    language = 'fr',
    t
}) => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({
        today: true,
        yesterday: true,
        older: true
    });

    const isRTL = language === 'ar';

    const groupConversations = (convs) => {
        const groups = { today: [], yesterday: [], older: [] };
        convs.forEach(conv => {
            if (!conv.updatedAt) return groups.older.push(conv);
            const date = new Date(conv.updatedAt);
            if (isToday(date)) groups.today.push(conv);
            else if (isYesterday(date)) groups.yesterday.push(conv);
            else groups.older.push(conv);
        });
        return groups;
    };

    const grouped = groupConversations(conversations);

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const startEditing = (conv) => {
        setEditingId(conv.id);
        setEditTitle(conv.title);
    };

    const saveEdit = (id) => {
        if (editTitle.trim()) onRenameConversation(id, editTitle.trim());
        setEditingId(null);
        setEditTitle('');
    };

    const handleKeyPress = (e, id) => {
        if (e.key === 'Enter') saveEdit(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        onDeleteConversation(id);
        toast.success(t('chatDeleted') || 'Dossier supprimé', { theme: isDarkMode ? "dark" : "light" });
    };

    const renderConversationGroup = (groupItems, groupKey, label) => {
        if (groupItems.length === 0) return null;
        const isExpanded = expandedGroups[groupKey];

        return (
            <div key={groupKey} className="mb-4">
                <div
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-500 cursor-pointer hover:text-gray-800 transition-colors"
                >
                    <span className="flex-1">{label}</span>
                    {isExpanded ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
                </div>

                <div className={`transition-all duration-200 ease-in-out ${isExpanded ? 'opacity-100 mt-1' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    {groupItems.map((conv) => {
                        const isSelected = currentConversation?.id === conv.id;
                        return (
                            <div
                                key={conv.id}
                                onClick={() => {
                                    onSelectConversation(conv);
                                    if (isMobile) onToggle();
                                }}
                                className={`mx-3 my-1 px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all duration-200 group relative
                                    ${isSelected 
                                        ? 'bg-white border border-gray-200 shadow-sm text-gray-900 font-medium'
                                        : 'bg-transparent border border-transparent text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
                                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                                <LuMessageSquare size={16} className={isSelected ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} />

                                {editingId === conv.id ? (
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={() => saveEdit(conv.id)}
                                        onKeyDown={(e) => handleKeyPress(e, conv.id)}
                                        autoFocus
                                        className="flex-1 bg-white border border-indigo-500 focus:ring-0 rounded-md px-2 py-1 text-[13px] text-gray-900 outline-none w-full"
                                    />
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] leading-tight truncate">
                                            {conv.title}
                                        </p>
                                    </div>
                                )}

                                {editingId !== conv.id && (
                                    <div className={`absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent p-1`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEditing(conv); }}
                                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                                        >
                                            <LuPencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, conv.id)}
                                            className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <LuTrash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`h-screen bg-[#F9FAFB] border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative z-20 flex flex-col
                ${open ? 'w-[280px]' : 'w-[70px]'}`}
            style={isRTL ? { left: 'auto', right: 0, borderLeft: '1px solid #E5E7EB', borderRight: 'none' } : {}}
        >
            {/* Header / Logo */}
            <div className={`pt-6 pb-4 flex flex-col items-center justify-center relative flex-shrink-0 ${open ? 'px-5' : 'px-2'}`}>
                {open ? (
                    <div className="flex items-center gap-3 w-full relative">
                        <img src={Logo} alt="Logo" className="h-7 w-7 object-contain flex-shrink-0" />
                        <span className="font-semibold text-[15px] text-gray-900 flex-1 truncate">
                            Pulse Juridique
                        </span>
                        
                        <button 
                            onClick={onToggle}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-all"
                        >
                            <LuChevronLeft size={18} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={onToggle}
                        className="mx-auto w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-all"
                    >
                        <img src={Logo} alt="Logo" className="h-6 w-6 object-contain" />
                    </button>
                )}
            </div>

            {/* Barre de recherche rapide / Nouveau Dossier */}
            <div className="px-3 pb-4 flex-shrink-0">
                {open ? (
                    <button
                        onClick={onNewChat}
                        className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-600 py-2.5 rounded-lg flex items-center gap-3 transition-all px-3 text-[13px] shadow-sm"
                    >
                        <span className="flex-1 text-left">Nouvelle discussion</span>
                        <div className="flex items-center justify-center w-5 h-5 rounded border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400">
                            +
                        </div>
                    </button>
                ) : (
                    <button
                        onClick={onNewChat}
                        className="w-10 h-10 mx-auto bg-white border border-gray-200 text-gray-600 hover:border-gray-300 rounded-lg flex items-center justify-center shadow-sm transition-all"
                    >
                        <LuSearch size={16} />
                    </button>
                )}
            </div>

            {/* Liste des conversations */}
            <div className={`overflow-y-auto flex-1 ${!open ? 'hidden' : ''}`}>
                <div className="pb-4">
                    <div className="px-4 py-2 text-[13px] text-gray-500 font-medium">Menu</div>
                    {renderConversationGroup(grouped.today, 'today', t('today') || "Aujourd'hui")}
                    {renderConversationGroup(grouped.yesterday, 'yesterday', t('yesterday') || 'Hier')}
                    {renderConversationGroup(grouped.older, 'older', t('last7Days') || 'Archives')}
                </div>
            </div>

            {/* Pied de page : Préférences & Profil */}
            <div className={`flex-shrink-0 z-20 ${open ? 'p-3' : 'p-2 flex flex-col items-center gap-2'}`}>
                
                {open && (
                    <div className="mb-2 border-t border-gray-200 pt-2">
                        
                        <button
                            type="button"
                            onClick={toggleTheme}
                            aria-pressed={isDarkMode}
                            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
                        >
                            {isDarkMode ? (
                                <LuSun size={16} className="text-gray-400" />
                            ) : (
                                <LuMoon size={16} className="text-gray-400" />
                            )}
                            {isDarkMode ? 'Light mode' : 'Dark mode'}
                        </button>
                    </div>
                )}

                {/* Bouton Utilisateur */}
                <div className="relative border-t border-gray-200 pt-2 w-full">
                    {showUserMenu && open && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg py-1 shadow-lg z-50">
                            {isAdmin && (
                                <button onClick={() => { navigate('/admin'); setShowUserMenu(false); }} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-[13px] text-gray-700">
                                    <LuSettings2 size={14} /> Administration
                                </button>
                            )}
                            <button onClick={onLogout} className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-[13px] text-red-600">
                                <LuLogOut size={14} /> Se déconnecter
                            </button>
                        </div>
                    )}

                    {open ? (
                        <div 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200/50 cursor-pointer transition-all w-full"
                        >
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=F3F4F6&color=374151`}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-[13px] truncate">
                                    {user?.fullName || 'Brooklyn'}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                    Pro trial
                                </p>
                            </div>
                            <LuChevronsUpDown size={14} className="text-gray-400" />
                        </div>
                    ) : (
                        <div 
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-all relative"
                        >
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=F3F4F6&color=374151`}
                                alt="Avatar"
                                className="w-full h-full rounded-full"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

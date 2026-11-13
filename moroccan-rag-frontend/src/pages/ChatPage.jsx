// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { useLanguage } from '../context/LanguageContext';
import Sidebar from '../components/chat/Sidebar';
import ChatMessage, { ChatInput } from '../components/chat/ChatMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LanguageSelector from '../components/common/LanguageSelector';
import robotLogo from '../assets/rb.png';

const TypingIndicator = () => (
    <div className="flex items-start mb-6 animate-fade-in w-full justify-start">
        <div className="flex gap-3 items-center px-2">
            <div className="w-8 h-8 rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <span className="text-[12px]">🤖</span>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

const ChatPage = () => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const {
        conversations,
        currentConversation,
        messages,
        loading,
        isTyping,
        error,
        createConversation,
        deleteConversation,
        renameConversation,
        sendMessage,
        rateMessage,
        selectConversation,
        fetchConversations
    } = useChat();

    const [isMobile, setIsMobile] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const messagesEndRef = useRef(null);

    const isRTL = language === 'ar';

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            setDrawerOpen(!mobile);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (error) {
            setSnackbarMessage(error);
            setSnackbarOpen(true);
        }
    }, [error]);

    useEffect(() => {
        if (snackbarOpen) {
            const timer = setTimeout(() => setSnackbarOpen(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [snackbarOpen]);

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSelectConversation = (conversation) => {
        selectConversation(conversation);
        if (isMobile) setDrawerOpen(false);
    };

    const handleSendMessage = async (message) => {
        await sendMessage(message, language);
    };

    const handleNewChat = async () => {
        await createConversation();
        if (isMobile) setDrawerOpen(false);
    };

    const handleDeleteConversation = async (id) => {
        if (window.confirm(t('deleteConfirm') || 'Confirmez-vous la suppression de ce dossier ?')) {
            await deleteConversation(id);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleRefresh = async () => {
        await fetchConversations();
        if (currentConversation?.id) {
            selectConversation(currentConversation);
        }
    };

    const handleToggleDrawer = () => {
        setDrawerOpen(!drawerOpen);
    };

    const getPlaceholder = () => {
        if (language === 'ar') return "اطرح حالتك القانونية...";
        if (language === 'en') return "Describe your legal situation...";
        return "Exposez votre situation juridique...";
    };

    return (
        <div 
            className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans antialiased text-slate-800 selection:bg-blue-100 selection:text-blue-900"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 24px) scale(0.95); }
                    to { opacity: 1; transform: translate(-50%, 0) scale(1); }
                }
                
                .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                /* Custom Scrollbar plus fine et discrète */
                ::-webkit-scrollbar { width: 5px; height: 5px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
                ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            <Sidebar
                open={drawerOpen}
                onToggle={handleToggleDrawer}
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
                onDeleteConversation={handleDeleteConversation}
                onRenameConversation={renameConversation}
                user={user}
                onLogout={handleLogout}
                isMobile={isMobile}
                language={language}
                t={t}
            />

            <div className="flex flex-1 flex-col min-w-0 relative bg-white lg:rounded-l-3xl lg:border-l border-slate-200/60 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300">
                
                {/* En-tête Premium avec Glassmorphism */}
                <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white/70 backdrop-blur-2xl px-4 sm:px-6 z-20 sticky top-0 transition-all duration-300">
                    <div className="flex items-center gap-3 min-w-0" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        {isMobile && (
                            <button onClick={handleToggleDrawer} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all duration-300 flex-shrink-0">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                        <div className="flex flex-col ml-1">
                            <h1 className="text-[1.05rem] font-bold tracking-tight text-slate-800 truncate">
                                {currentConversation?.title || t('appName')}
                            </h1>
                            <span className="text-[0.7rem] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                                Espace de consultation
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <LanguageSelector currentLang={language} onLanguageChange={setLanguage} color="text-slate-500" />
                        <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block"></div>
                        
                        <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300" title={t('logout')}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Zone de Messages */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-8 pt-4 pb-24 focus:outline-none scroll-smooth relative z-10 bg-transparent">
                    {loading && messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    ) : messages.length === 0 ? (
                        
                        /* Écran d'accueil "Iconique" avec flottaison et lueur (Glow) */
                        <div className="flex h-full flex-col items-center justify-center px-4 max-w-2xl mx-auto text-center relative">
                            {/* Effet de lueur en arrière-plan */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64  rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                            
                            <img 
                                src={robotLogo} 
                                alt="Chatboot" 
                                className="w-56 h-56 sm:w-72 sm:h-72 object-contain mb-8 animate-float drop-shadow-xl z-10" 
                            />
                            
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight z-10">
    Welcome to <span className="text-blue-400">Pulse AI</span>
</h2>
                            
<p className="text-base sm:text-lg text-slate-500 max-w-md leading-relaxed z-10">
    Votre co-pilote juridique intelligent. Décrivez votre situation ou posez vos questions sur le droit marocain pour une analyse instantanée.
</p>
                        </div>

                    ) : (
                        <div className="space-y-6 max-w-[900px] mx-auto w-full pb-8" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                            {messages.map((msg, index) => (
                                <div key={msg.id || index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                                    <ChatMessage message={msg} onRate={rateMessage} />
                                </div>
                            ))}
                            {isTyping && <TypingIndicator />}
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </main>

                {/* Zone de Saisie avec dégradé d'intégration */}
                <footer className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    <div className="bg-white px-4 sm:px-6 pb-6 pt-2">
                        <div className="max-w-[850px] mx-auto w-full">
                            <ChatInput 
                                onSend={handleSendMessage} 
                                disabled={loading} 
                                placeholder={getPlaceholder()}
                                className="shadow-[0_0_40px_rgba(0,0,0,0.06)]"
                            />
                            <div className="text-center mt-3">
                                <span className="text-[11px] text-slate-400/80 font-medium tracking-wide">
                                    L'IA peut commettre des erreurs. Vérifiez toujours les informations importantes.
                                </span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Snackbar d'Erreur "Slide Up" */}
            {snackbarOpen && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4 animate-slide-up">
                    <div className="flex items-center justify-between gap-4 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium leading-snug">{snackbarMessage}</span>
                        </div>
                        <button onClick={() => setSnackbarOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 rounded-full p-1.5">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;

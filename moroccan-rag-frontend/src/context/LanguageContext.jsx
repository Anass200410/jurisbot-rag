// src/context/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // ✅ Récupérer la langue depuis localStorage
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('preferred_language');
        return saved || 'fr'; // Par défaut: français
    });

    // ✅ Persister la langue
    useEffect(() => {
        localStorage.setItem('preferred_language', language);
        // ✅ Appliquer la direction du texte
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    // ✅ Texte traduit selon la langue
    const translations = {
        fr: {
            appName: 'PulsarideAI',
            newChat: 'Nouvelle conversation',
            today: "Aujourd'hui",
            yesterday: 'Hier',
            last7Days: '7 derniers jours',
            noConversations: 'Aucune conversation',
            startNewChat: 'Commencez une nouvelle discussion',
            questionPlaceholder: 'Posez votre question juridique...',
            send: 'Envoyer',
            logout: 'Déconnexion',
            admin: 'Administration',
            welcome: 'Comment puis-je vous aider ?',
            welcomeSub: 'Posez votre question sur le droit marocain',
            sources: 'Sources',
            hideSources: 'Masquer les sources',
            showSources: 'Voir les sources',
            error: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
            loading: 'Chargement...',
            deleteConfirm: 'Supprimer cette conversation ?',
            french: 'Français',
            arabic: 'العربية',
            english: 'English',
            language: 'Langue',
        },
        ar: {
            appName: 'احكمة القانون',
            newChat: 'محادثة جديدة',
            today: 'اليوم',
            yesterday: 'أمس',
            last7Days: 'آخر 7 أيام',
            noConversations: 'لا توجد محادثات',
            startNewChat: 'ابدأ محادثة جديدة',
            questionPlaceholder: 'اطرح سؤالك القانوني...',
            send: 'إرسال',
            logout: 'تسجيل الخروج',
            admin: 'الإدارة',
            welcome: 'كيف يمكنني مساعدتك؟',
            welcomeSub: 'اطرح سؤالك حول القانون المغربي',
            sources: 'المصادر',
            hideSources: 'إخفاء المصادر',
            showSources: 'عرض المصادر',
            error: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
            loading: 'جاري التحميل...',
            deleteConfirm: 'حذف هذه المحادثة؟',
            french: 'الفرنسية',
            arabic: 'العربية',
            english: 'الإنجليزية',
            language: 'اللغة',
        },
        en: {
            appName: 'PulsarideAI',
            newChat: 'New conversation',
            today: 'Today',
            yesterday: 'Yesterday',
            last7Days: 'Last 7 days',
            noConversations: 'No conversations',
            startNewChat: 'Start a new discussion',
            questionPlaceholder: 'Ask your legal question...',
            send: 'Send',
            logout: 'Logout',
            admin: 'Administration',
            welcome: 'How can I help you?',
            welcomeSub: 'Ask your question about Moroccan law',
            sources: 'Sources',
            hideSources: 'Hide sources',
            showSources: 'Show sources',
            error: 'Sorry, an error occurred. Please try again.',
            loading: 'Loading...',
            deleteConfirm: 'Delete this conversation?',
            french: 'French',
            arabic: 'Arabic',
            english: 'English',
            language: 'Language',
        }
    };

    const t = (key) => {
        return translations[language]?.[key] || translations.fr[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
            {children}
        </LanguageContext.Provider>
    );
};
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const useChat = () => {
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState(null);

    const fetchConversations = useCallback(async () => {
        try {
            const response = await api.get('/conversations');
            const convs = response.data || [];
            setConversations(convs);
            return convs;
        } catch (err) {
            console.error('Erreur chargement conversations:', err);
            return [];
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const { data: conversation } = await api.get(`/conversations/${conversationId}`);
            setCurrentConversation({
                id: conversation.id,
                title: conversation.title,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            });
            setMessages(conversation.messages || []);
            setConversations((previous) => {
                const remaining = previous.filter((item) => item.id !== conversation.id);
                return [{ ...conversation, messages: [] }, ...remaining];
            });
        } catch (err) {
            console.error('Erreur chargement messages:', err);
            setError('Impossible de charger cette conversation.');
        } finally {
            setLoading(false);
        }
    }, []);

    const createConversation = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.post('/conversations', { title: 'Nouvelle conversation' });
            setConversations((previous) => [data, ...previous.filter((item) => item.id !== data.id)]);
            setCurrentConversation(data);
            setMessages([]);
            return data;
        } catch (err) {
            console.error('Erreur création conversation:', err);
            setError('Impossible de créer une conversation.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const renameConversation = useCallback(async (id, title) => {
        const cleanTitle = title?.trim();
        if (!id || !cleanTitle) return;

        try {
            const { data } = await api.put(`/conversations/${id}`, { title: cleanTitle });
            setConversations((previous) => previous.map((item) => (
                item.id === id ? { ...item, title: data.title || cleanTitle } : item
            )));
            setCurrentConversation((current) => (
                current?.id === id ? { ...current, title: data.title || cleanTitle } : current
            ));
        } catch (err) {
            console.error('Erreur renommage conversation:', err);
            setError('Impossible de renommer cette conversation.');
        }
    }, []);

    const deleteConversation = useCallback(async (id) => {
        if (!id) return;

        try {
            await api.delete(`/conversations/${id}`);
            setConversations((previous) => previous.filter((item) => item.id !== id));
            if (currentConversation?.id === id) {
                setCurrentConversation(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('Erreur suppression conversation:', err);
            setError('Impossible de supprimer cette conversation.');
        }
    }, [currentConversation]);

    const selectConversation = useCallback((conversation) => {
        if (!conversation) {
            setCurrentConversation(null);
            setMessages([]);
            return;
        }
        if (conversation.id) fetchMessages(conversation.id);
    }, [fetchMessages]);

    const sendMessage = useCallback(async (question, language = 'fr') => {
        const cleanQuestion = question?.trim();
        if (!cleanQuestion || loading) return null;

        setMessages((previous) => [...previous, {
            id: `pending-${Date.now()}`,
            role: 'USER',
            content: cleanQuestion,
            createdAt: new Date().toISOString(),
        }]);
        setIsTyping(true);
        setLoading(true);
        setError(null);

        try {
            const { data } = await api.post('/chat', {
                conversationId: currentConversation?.id || null,
                question: cleanQuestion,
                language,
            });

            if (!data?.content || !data?.messageId || !data?.conversationId) {
                throw new Error('Réponse invalide');
            }

            const updatedConversation = {
                id: data.conversationId,
                title: data.conversationTitle || currentConversation?.title || cleanQuestion.slice(0, 50),
                updatedAt: data.timestamp || new Date().toISOString(),
                createdAt: currentConversation?.createdAt || data.timestamp || new Date().toISOString(),
            };
            setCurrentConversation(updatedConversation);
            setConversations((previous) => [
                updatedConversation,
                ...previous.filter((item) => item.id !== updatedConversation.id),
            ]);
            setMessages((previous) => [...previous, {
                id: data.messageId,
                role: 'ASSISTANT',
                content: data.content,
                sources: data.sources || [],
                rating: data.rating ?? null,
                createdAt: data.timestamp || new Date().toISOString(),
            }]);
            return data;
        } catch (err) {
            console.error('Erreur envoi message:', err);
            setMessages((previous) => [...previous, {
                id: `error-${Date.now()}`,
                role: 'ASSISTANT',
                content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
                sources: [],
                createdAt: new Date().toISOString(),
                isError: true,
            }]);
            setError(err.response?.data?.error || 'Erreur lors de l\'envoi.');
            return null;
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    }, [currentConversation, loading]);

    const rateMessage = useCallback(async (messageId, rating) => {
        const { data } = await api.put(`/chat/messages/${messageId}/rating`, { rating });
        setMessages((previous) => previous.map((message) => (
            message.id === messageId ? { ...message, rating: data.rating } : message
        )));
        return data.rating;
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return {
        conversations,
        currentConversation,
        messages,
        loading,
        isTyping,
        error,
        fetchConversations,
        fetchMessages,
        createConversation,
        renameConversation,
        deleteConversation,
        sendMessage,
        rateMessage,
        selectConversation,
    };
};

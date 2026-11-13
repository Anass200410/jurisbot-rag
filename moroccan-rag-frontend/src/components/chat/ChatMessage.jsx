// src/components/chat/ChatMessage.jsx
import React, { useState } from "react";
import {
    Box,
    Collapse,
    Avatar,
    Fade,
    Chip,
    Typography,
    IconButton,
    Tooltip,
    Snackbar,
    Alert,
    TextField,
    Paper,
    Rating
} from "@mui/material";
import {
    ExpandMore,
    GavelRounded as GavelIcon,
    ArticleRounded as DescriptionIcon,
    ContentCopyRounded as ContentCopyIcon,
    CheckCircleRounded as CheckIcon,
    SendRounded as SendIcon
} from "@mui/icons-material";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceInput from './VoiceInput';

// Importer les images depuis le dossier assets
import userAvatar from '../../assets/h.png';
import assistantAvatar from '../../assets/rb.png';

// ========== COMPOSANT CHAT INPUT (Effet Glassmorphism & Chic - Inspiré de ton modèle) ==========
const ChatInput = ({ onSend, disabled, placeholder = 'Écrivez votre message...' }) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (!disabled) inputRef.current?.focus();
    }, [disabled]);

    const handleSubmit = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '820px', mx: 'auto', position: 'relative' }}>
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1.5,
                    borderRadius: '24px',
                    // Effet Glassmorphism subtil avec fond translucide, flou et bordure douce
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isFocused ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isFocused 
                        ? '0 16px 40px -10px rgba(59, 130, 246, 0.12), 0 0 0 4px rgba(59, 130, 246, 0.05)' 
                        : '0 8px 30px -6px rgba(0, 0, 0, 0.04)'
                }}
            >
                {/* Zone de texte principale */}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', px: 1, py: 0.5 }}>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={5}
                        placeholder={placeholder}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={disabled}
                        variant="standard"
                        InputProps={{ 
                            disableUnderline: true, 
                            sx: { 
                                fontSize: '14.5px', 
                                color: '#1E293B',
                                fontWeight: 400,
                                letterSpacing: '-0.01em',
                                '&::placeholder': {
                                    color: '#94A3B8',
                                    opacity: 1
                                }
                            } 
                        }}
                        inputRef={inputRef}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, gap: 1, mb: 0.5 }}>
                        <VoiceInput 
                            onTranscript={(text) => {
                                setMessage(prev => prev + (prev ? ' ' : '') + text);
                                inputRef.current?.focus();
                            }} 
                            disabled={disabled} 
                        />

                        <Tooltip title="Envoyer le message" arrow placement="top">
                            <IconButton
                                onClick={handleSubmit}
                                disabled={!message.trim() || disabled}
                                sx={{
                                    backgroundColor: message.trim() && !disabled ? '#2563EB' : '#F1F5F9',
                                    color: message.trim() && !disabled ? '#ffffff' : '#94A3B8',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    width: 38,
                                    height: 38,
                                    borderRadius: '14px',
                                    '&:hover': {
                                        backgroundColor: message.trim() && !disabled ? '#1D4ED8' : '#F1F5F9',
                                        transform: message.trim() && !disabled ? 'scale(1.05)' : 'none',
                                    }
                                }}
                            >
                                <SendIcon sx={{ ml: 0.1, fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Paper>

            {disabled && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <div className="flex gap-2 items-center text-slate-400 text-xs font-medium tracking-wide">
                        <span className="animate-pulse">Analyse en cours</span>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </Box>
            )}
        </Box>
    );
};

// ========== COMPOSANT CHAT MESSAGE (Effet Glassmorphism, Date/Heure intégrées) ==========
const ChatMessage = ({ message, onRate, showDateSeparator = false }) => {
    const [showSources, setShowSources] = useState(false);
    const [copied, setCopied] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [ratingSaving, setRatingSaving] = useState(false);
    
    const isUser = message.role === "USER";
    const hasSources = message.sources && Array.isArray(message.sources) && message.sources.length > 0;

    const handleRate = async (_event, rating) => {
        if (!rating || !onRate || ratingSaving) return;
        setRatingSaving(true);
        try {
            await onRate(message.id, rating);
            setSnackbarMessage('Merci pour votre évaluation');
            setSnackbarOpen(true);
        } catch {
            setSnackbarMessage('Impossible d’enregistrer votre note');
            setSnackbarOpen(true);
        } finally {
            setRatingSaving(false);
        }
    };

    const messageDate = message.createdAt ? new Date(message.createdAt) : new Date();
    const timeString = format(messageDate, "HH:mm", { locale: fr });
    
    // Formatage intelligent de la date (ex: "Aujourd'hui", "Hier" ou "14 mars 2025")
    const getDateSeparatorText = (date) => {
        if (isToday(date)) return "Aujourd'hui";
        if (isYesterday(date)) return "Hier";
        return format(date, "d MMMM yyyy", { locale: fr });
    };

    const handleCopyContent = async () => {
        try {
            let contentToCopy = message.content;
            if (!isUser && hasSources) {
                const sourcesText = message.sources
                    .map((source, idx) => `[${idx + 1}] ${source.document || 'Référence'} (Art. ${source.article || 'N/A'})`)
                    .join('\n');
                contentToCopy = `${message.content}\n\n---\n⚖️ Références :\n${sourcesText}`;
            }
            await navigator.clipboard.writeText(contentToCopy);
            setCopied(true);
            setSnackbarMessage('Copié dans le presse-papier');
            setSnackbarOpen(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            setSnackbarMessage('Échec de la copie');
            setSnackbarOpen(true);
        }
    };

    const MarkdownContent = ({ content }) => (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ children }) => <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 700, mt: 2, mb: 1, fontSize: '1.1rem' }}>{children}</Typography>,
                h2: ({ children }) => <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 600, mt: 1.5, mb: 0.8, fontSize: '1rem' }}>{children}</Typography>,
                h3: ({ children }) => <Typography variant="subtitle1" sx={{ color: '#1E293B', fontWeight: 600, mt: 1.2, mb: 0.6, fontSize: '0.95rem' }}>{children}</Typography>,
                ul: ({ children }) => <Box component="ul" sx={{ pl: 2, my: 1, color: '#334155', display: 'flex', flexDirection: 'column', gap: 0.5 }}>{children}</Box>,
                ol: ({ children }) => <Box component="ol" sx={{ pl: 2, my: 1, color: '#334155', display: 'flex', flexDirection: 'column', gap: 0.5 }}>{children}</Box>,
                li: ({ children }) => <Typography component="li" variant="body2" sx={{ lineHeight: 1.6, color: '#334155', fontSize: '14px' }}>{children}</Typography>,
                p: ({ children }) => <Typography variant="body2" sx={{ my: 0.8, lineHeight: 1.6, color: '#334155', fontSize: '14px' }}>{children}</Typography>,
                strong: ({ children }) => <Typography component="span" sx={{ fontWeight: 600, color: '#0F172A' }}>{children}</Typography>,
                em: ({ children }) => <Typography component="span" sx={{ fontStyle: 'italic', color: '#475569' }}>{children}</Typography>,
                code: ({ inline, children }) => {
                    if (inline) {
                        return <code className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded text-[13px] font-mono border border-slate-200">{children}</code>;
                    }
                    return (
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl my-3 overflow-x-auto">
                            <code className="font-mono text-xs leading-relaxed">{children}</code>
                        </pre>
                    );
                },
                blockquote: ({ children }) => (
                    <Box sx={{ pl: 2, borderLeft: '3px solid #2563EB', my: 1.5, py: 0.5, color: '#475569', fontStyle: 'italic', fontSize: '14px', bgcolor: 'rgba(37, 99, 235, 0.03)', borderRadius: '0 8px 8px 0', p: 1 }}>
                        {children}
                    </Box>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );

    return (
        <Fade in timeout={300}>
            <Box className="w-full mb-5">
                {/* Séparateur de date style messagerie moderne (comme ton inspo) */}
                {(showDateSeparator || message.showDate) && (
                    <div className="flex justify-center my-4">
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100/70 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/50 uppercase tracking-wider">
                            {getDateSeparatorText(messageDate)}
                        </span>
                    </div>
                )}

                <Box className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    <Box className={`flex flex-col gap-1 w-full max-w-[92%] md:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                        
                        {/* En-tête du message (Avatar, Nom, Heure) */}
                        <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? "flex-row-reverse" : ""}`}>
                            <Avatar 
                                src={isUser ? userAvatar : assistantAvatar}
                                alt={isUser ? "Vous" : "Pulse Juridique"}
                                sx={{
                                    width: 26,
                                    height: 26,
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    backgroundColor: '#F8FAFC',
                                }}
                            />
                            <div className={`flex items-baseline gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                                <span className="text-[12px] font-semibold text-slate-700">
                                    {isUser ? "Vous" : "Pulse Juridique"}
                                </span>
                                {/* HEURE EXACTE SOUS LA BULLE OU À CÔTÉ COMME SUR TON INSPIRE */}
                                <span className="text-[10.5px] text-slate-400 font-medium">
                                    {timeString}
                                </span>
                            </div>

                            <Tooltip title={copied ? "Copié !" : "Copier"} placement="top">
                                <IconButton
                                    onClick={handleCopyContent}
                                    size="small"
                                    sx={{
                                        ml: isUser ? 0 : 0.5,
                                        mr: isUser ? 0.5 : 0,
                                        color: copied ? '#059669' : '#94A3B8',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: '#F1F5F9',
                                            color: copied ? '#059669' : '#334155'
                                        }
                                    }}
                                >
                                    {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                </IconButton>
                            </Tooltip>
                        </div>

                        {/* Bulle principale avec effet Glassmorphism doux */}
                        <div
                            className={`px-4.5 py-3.5 text-[14px] leading-relaxed break-words relative w-full transition-all duration-200 ${
                                isUser
                                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-xs shadow-md shadow-blue-500/10"
                                    : "bg-white/80 backdrop-blur-xl text-slate-800 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-sm"
                            }`}
                        >
                            {isUser ? (
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 400, color: '#ffffff', fontSize: '14px' }}>
                                    {message.content}
                                </Typography>
                            ) : (
                                <MarkdownContent content={message.content} />
                            )}

                            {/* Section Sources / Jurisprudence (Style Clean & Glass) */}
                            {hasSources && !isUser && (
                                <div className="mt-4 pt-3 border-t border-slate-100 select-none">
                                    <div
                                        onClick={() => setShowSources(!showSources)}
                                        className="group flex items-center justify-between bg-slate-50/80 hover:bg-slate-100 transition-all cursor-pointer rounded-xl px-3 py-2 border border-slate-200/60"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="bg-white p-1 rounded-lg border border-slate-200 text-blue-600 shadow-2xs">
                                                <GavelIcon sx={{ fontSize: 15 }} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase">
                                                    Fondements & Jurisprudence
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    {message.sources.length} référence{message.sources.length > 1 ? 's' : ''} juridique{message.sources.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <ExpandMore 
                                            sx={{ fontSize: 18 }}
                                            className={`text-slate-400 transition-transform duration-300 ${showSources ? "rotate-180" : ""}`} 
                                        />
                                    </div>

                                    <Collapse in={showSources}>
                                        <div className="mt-2 bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden">
                                            {message.sources.map((source, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border-b border-slate-200/40 last:border-0 hover:bg-white transition-colors gap-2">
                                                    <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                                                        <DescriptionIcon sx={{ fontSize: 16 }} className="text-slate-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[12px] font-medium text-slate-800 truncate">
                                                                {source.document || 'Document confidentiel'}
                                                            </span>
                                                            <div className="flex gap-2 items-center mt-0.5">
                                                                {source.article && source.article !== 'N/A' && (
                                                                    <Chip
                                                                        label={`Art. ${source.article}`}
                                                                        size="small"
                                                                        sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#334155', borderRadius: '4px' }}
                                                                    />
                                                                )}
                                                                {source.page && (
                                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                                                        Page {source.page}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {source.content && (
                                                                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                                                                    {source.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Collapse>
                                </div>
                            )}

                            {message.isError && (
                                <div className="mt-2 bg-red-50 rounded-lg p-2 text-[12px] text-red-600 font-medium flex items-center gap-1.5 border border-red-200">
                                    <span>⚠️</span> Une erreur est survenue lors du traitement.
                                </div>
                            )}
                        </div>

                        {!isUser && !message.isError && typeof message.id === 'number' && onRate && (
                            <div className="flex items-center gap-2 px-1 pt-1 text-slate-500">
                                <span className="text-[11px]">Cette réponse vous aide ?</span>
                                <Rating
                                    name={`answer-rating-${message.id}`}
                                    value={message.rating || 0}
                                    precision={1}
                                    size="small"
                                    disabled={ratingSaving}
                                    onChange={handleRate}
                                    aria-label="Noter cette réponse de 1 à 5 étoiles"
                                    sx={{
                                        color: '#F59E0B',
                                        '& .MuiRating-iconEmpty': { color: '#CBD5E1' },
                                        '& .MuiRating-icon': { fontSize: 18 },
                                    }}
                                />
                            </div>
                        )}
                    </Box>

                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={2500}
                        onClose={() => setSnackbarOpen(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert 
                            onClose={() => setSnackbarOpen(false)} 
                            icon={<CheckIcon fontSize="inherit" />}
                            sx={{ 
                                width: '100%',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                bgcolor: '#0F172A',
                                color: '#ffffff',
                                fontSize: '13px',
                                '& .MuiAlert-icon': { color: '#10B981' }
                            }}
                        >
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>
                </Box>
            </Box>
        </Fade>
    );
};

export default ChatMessage;
export { ChatInput };

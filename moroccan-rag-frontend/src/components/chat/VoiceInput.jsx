// src/components/chat/VoiceInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    IconButton,
    Tooltip,
    CircularProgress,
    Box,
    Fade
} from '@mui/material';
import {
    Mic as MicIcon,
    MicOff as MicOffIcon,
    Stop as StopIcon,
    VolumeUp as VolumeUpIcon
} from '@mui/icons-material';

const VoiceInput = ({ onTranscript, disabled, language = 'fr-FR' }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isPulsing, setIsPulsing] = useState(false);
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);

    // ✅ Initialiser la reconnaissance vocale
    useEffect(() => {
        // Vérifier si le navigateur supporte la reconnaissance vocale
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            console.warn('⚠️ La reconnaissance vocale n\'est pas supportée par ce navigateur.');
            return;
        }

        // Créer l'instance de reconnaissance
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // ✅ Gestion des résultats
        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(finalTranscript);
                setInterimTranscript('');
                // ✅ Envoyer le texte final
                if (onTranscript) {
                    onTranscript(finalTranscript);
                }
                // ✅ Arrêter automatiquement après une phrase
                stopListening();
            } else if (interim) {
                setInterimTranscript(interim);
                setIsPulsing(true);
            }
        };

        // ✅ Gestion des erreurs
        recognition.onerror = (event) => {
            console.error('❌ Erreur de reconnaissance:', event.error);
            
            if (event.error === 'not-allowed') {
                alert('Veuillez autoriser l\'accès au microphone.');
            } else if (event.error === 'no-speech') {
                // Pas de parole détectée, réessayer
                if (isListening) {
                    startListening();
                }
            } else {
                stopListening();
            }
        };

        // ✅ Fin de la reconnaissance
        recognition.onend = () => {
            if (isListening) {
                // Si toujours en écoute, relancer
                startListening();
            } else {
                setIsPulsing(false);
                setInterimTranscript('');
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [language, onTranscript]);

    // ✅ Démarrer l'écoute
    const startListening = () => {
        if (!recognitionRef.current || disabled) return;

        try {
            recognitionRef.current.start();
            setIsListening(true);
            setIsPulsing(true);
            setTranscript('');
            setInterimTranscript('');
            
            // ✅ Auto-stop après 5 secondes de silence
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                if (isListening) {
                    stopListening();
                }
            }, 10000);
            
        } catch (error) {
            console.error('❌ Erreur au démarrage:', error);
            // Si déjà en cours, on arrête et on redémarre
            if (error.message.includes('already started')) {
                stopListening();
                setTimeout(startListening, 100);
            }
        }
    };

    // ✅ Arrêter l'écoute
    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (error) {
                // Ignorer les erreurs d'arrêt
            }
        }
        setIsListening(false);
        setIsPulsing(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        // ✅ Si un texte intermédiaire existe, le soumettre
        if (interimTranscript && onTranscript) {
            onTranscript(interimTranscript);
            setInterimTranscript('');
        }
    };

    // ✅ Toggle de l'écoute
    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // ✅ Si non supporté
    if (!isSupported) {
        return (
            <Tooltip title="Reconnaissance vocale non supportée par ce navigateur">
                <span>
                    <IconButton disabled sx={{ opacity: 0.5 }}>
                        <MicOffIcon />
                    </IconButton>
                </span>
            </Tooltip>
        );
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* ✅ Affichage du texte intermédiaire */}
            {interimTranscript && (
                <Fade in={true}>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            mb: 2,
                            bgcolor: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            p: 1.5,
                            borderRadius: 2,
                            maxWidth: 300,
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <VolumeUpIcon sx={{ fontSize: 14, mr: 1, verticalAlign: 'middle' }} />
                        {interimTranscript}
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                ml: 0.5,
                                borderRadius: '50%',
                                bgcolor: '#4caf50',
                                animation: 'pulse 1s infinite'
                            }}
                        />
                    </Box>
                </Fade>
            )}

            {/* ✅ Bouton Microphone */}
            <Tooltip title={isListening ? 'Arrêter l\'enregistrement' : 'Cliquez pour parler'}>
                <IconButton
                    onClick={toggleListening}
                    disabled={disabled}
                    sx={{
                        position: 'relative',
                        color: isListening ? '#f44336' : '#1976d2',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                            bgcolor: isListening ? 'rgba(244,67,54,0.1)' : 'rgba(25,118,210,0.1)'
                        }
                    }}
                >
                    {/* ✅ Animation de pulsation */}
                    {isListening && (
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: -4,
                                borderRadius: '50%',
                                border: '2px solid #f44336',
                                animation: 'ripple 1.5s ease-out infinite',
                                pointerEvents: 'none'
                            }}
                        />
                    )}
                    {isListening ? <MicIcon /> : <MicIcon />}
                    
                    {/* ✅ Indicateur de chargement */}
                    {isListening && (
                        <CircularProgress
                            size={40}
                            sx={{
                                position: 'absolute',
                                color: '#f44336',
                                opacity: 0.5
                            }}
                        />
                    )}
                </IconButton>
            </Tooltip>

            {/* ✅ Styles d'animation */}
            <style>{`
                @keyframes ripple {
                    0% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.8);
                        opacity: 0;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </Box>
    );
};

export default VoiceInput;
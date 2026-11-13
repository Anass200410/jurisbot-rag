// src/components/common/LanguageSelector.jsx
import React, { useState } from 'react';
import {
    Menu,
    MenuItem,
    IconButton,
    Tooltip,
    ListItemIcon,
    ListItemText,
    Box,
    Typography
} from '@mui/material';
import {
    Language as LanguageIcon,
    Check as CheckIcon
} from '@mui/icons-material';

const languages = [
    { 
        code: 'fr', 
        label: 'Français', 
        flag: '🇫🇷',
        direction: 'ltr'
    },
    { 
        code: 'ar', 
        label: 'العربية', 
        flag: '🇲🇦',
        direction: 'rtl'
    },
    { 
        code: 'en', 
        label: 'English', 
        flag: '🇬🇧',
        direction: 'ltr'
    }
];

const LanguageSelector = ({ currentLang, onLanguageChange, color = 'inherit' }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (langCode) => {
        onLanguageChange(langCode);
        handleClose();
    };

    const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

    return (
        <>
            <Tooltip title="Changer de langue / Change language / تغيير اللغة">
                <IconButton
                    onClick={handleOpen}
                    sx={{
                        color: color,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            transform: 'scale(1.1)',
                            bgcolor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LanguageIcon />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {currentLanguage.flag}
                        </Typography>
                    </Box>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 2,
                        minWidth: 180,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid rgba(0,0,0,0.06)'
                    }
                }}
            >
                {languages.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        selected={currentLang === lang.code}
                        sx={{
                            py: 1.5,
                            px: 2,
                            '&.Mui-selected': {
                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                '&:hover': {
                                    bgcolor: 'rgba(25, 118, 210, 0.12)'
                                }
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                                {lang.flag}
                            </Typography>
                        </ListItemIcon>
                        <ListItemText 
                            primary={lang.label}
                            primaryTypographyProps={{
                                sx: {
                                    fontWeight: currentLang === lang.code ? 600 : 400,
                                    color: currentLang === lang.code ? 'primary.main' : 'text.primary'
                                }
                            }}
                        />
                        {currentLang === lang.code && (
                            <CheckIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                        )}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageSelector;
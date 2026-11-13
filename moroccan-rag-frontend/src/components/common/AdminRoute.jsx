// src/components/common/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <CircularProgress />
                <Typography variant="body2" color="textSecondary">Vérification des droits...</Typography>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (!isAdmin) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" color="error">⛔ Accès refusé</Typography>
                <Typography variant="body1" color="textSecondary">Vous n'avez pas les droits d'administration.</Typography>
                <Button variant="contained" onClick={() => window.location.href = '/chat'}>Retourner au chat</Button>
            </Box>
        );
    }

    return children;
};

export default AdminRoute;
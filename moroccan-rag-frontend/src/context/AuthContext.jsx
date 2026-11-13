import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            const userData = response.data;
            setUser(userData);
            
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...storedUser,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role
            }));
        } catch (error) {
            console.error('Erreur chargement utilisateur:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, fullName, email: userEmail, role } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ fullName, email: userEmail, role }));
            setToken(token);
            setUser({ fullName, email: userEmail, role });
            
            return { success: true, role };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.error || 'Erreur de connexion' 
            };
        }
    };

    const register = async (fullName, email, password) => {
        try {
            const response = await api.post('/auth/register', { fullName, email, password });
            const { token, fullName: name, email: userEmail, role } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ fullName: name, email: userEmail, role }));
            setToken(token);
            setUser({ fullName: name, email: userEmail, role });
            
            return { success: true, role };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.error || 'Erreur d\'inscription' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isAdmin = user?.role === 'ADMIN';

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            login, 
            register, 
            logout, 
            isAuthenticated: !!token,
            isAdmin 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
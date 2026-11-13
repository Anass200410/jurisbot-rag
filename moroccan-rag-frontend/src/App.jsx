// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import de la nouvelle page unifiée
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import AdminRoute from './components/common/AdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDocuments from './pages/admin/Documents';
import AdminMetrics from './pages/admin/Metrics';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-[#f4f7fe] to-[#e8edf5]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
            </div>
        );
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* Les deux routes pointent désormais vers le même composant AuthPage */}
                            <Route path="/login" element={<AuthPage />} />
                            <Route path="/register" element={<AuthPage />} />
                            
                            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                            
                            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                            <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
                            <Route path="/admin/metrics" element={<AdminRoute><AdminMetrics /></AdminRoute>} />
                            
                            <Route path="/" element={<Navigate to="/chat" />} />
                        </Routes>
                        
                        {/* Ajoutez le ToastContainer ici, une seule fois */}
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            theme="colored"
                            style={{
                                zIndex: 9999
                            }}
                        />
                    </BrowserRouter>
                </ThemeProvider>
            </LanguageProvider>
        </AuthProvider>
    );
}

export default App;

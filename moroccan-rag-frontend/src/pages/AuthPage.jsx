import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import du logo de l'entreprise
import Logo from '../assets/logoo.png';

const AuthPage = () => {
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
        setAgreedToTerms(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        if (!isLogin) {
            if (!formData.fullName.trim()) {
                setError('Full name is required.');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
            if (!agreedToTerms) {
                setError('You must accept the terms and conditions.');
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            const result = isLogin
                ? await login(formData.email, formData.password)
                : await register(formData.fullName, formData.email, formData.password);

            if (result.success) {
                if (result.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/chat');
                }
            } else {
                setError(result.message || 'An error occurred.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans">
            {/* Injection de l'animation CSS personnalisée pour le logo */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 5s ease-in-out infinite;
                }
                @keyframes glow {
                    0% { filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.2)); }
                    50% { filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.6)); }
                    100% { filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.2)); }
                }
                .animate-glow {
                    animation: glow 5s ease-in-out infinite;
                }
            `}</style>

            {/* ========== SECTION GAUCHE : BRANDING & LOGO ========== */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-50 flex-col items-center justify-center overflow-hidden border-r border-slate-200">
                {/* Décors d'arrière-plan */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-300/10 rounded-full blur-3xl pointer-events-none" />
                
                {/* Logo animé */}
                <div className="relative z-10 flex flex-col items-center">
                    <img 
                        src={Logo} 
                        alt="Pulsaride Solutions" 
                        className="w-[28rem] max-w-full px-8 animate-float animate-glow transition-transform duration-700 hover:scale-105"
                    />
                    <div className="mt-12 text-center space-y-2 opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
                        <h2 className="text-xl font-semibold text-slate-800">
                            Welcome to the future of workspace
                        </h2>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Engineering, Transformation and Innovation tailored for your business needs.
                        </p>
                    </div>
                </div>
            </div>

            {/* ========== SECTION DROITE : FORMULAIRE D'AUTHENTIFICATION ========== */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12 relative">
                
                <div className="w-full max-w-[420px]">
                    {/* Logo visible uniquement sur mobile */}
                    <div className="flex lg:hidden justify-center mb-8">
                        <img src={Logo} alt="Pulsaride Solutions" className="h-16 object-contain" />
                    </div>

                    {/* Titre & Description */}
                    <div className="text-center lg:text-left mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-2">
                            {isLogin
                                ? 'Please enter your details to sign in.'
                                : 'Get started in seconds with your secure workspace.'}
                        </p>
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3 shadow-sm">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                            <div className="relative flex items-center">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5 pt-2">
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                                        I agree to the <a href="#" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">Terms & Conditions</a>
                                    </label>
                                </div>
                            </>
                        )}

                        {isLogin && (
                            <div className="flex justify-end pt-1">
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none mt-6 flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <span>{isLogin ? 'Sign in' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    {/* Basculer entre Connexion et Inscription */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-600">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
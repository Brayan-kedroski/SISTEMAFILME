import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Lock, Mail, Chrome, Wand2, School } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import clsx from 'clsx';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleSignIn, sendMagicLink, completeMagicLinkSignIn, resetPassword, currentUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    const languages = [
        { code: 'pt', label: '🇧🇷 PT' },
        { code: 'en', label: '🇺🇸 EN' },
        { code: 'es', label: '🇪🇸 ES' },
        { code: 'ja', label: '🇯🇵 JP' },
        { code: 'pl', label: '🇵🇱 PL' },
    ];

    // Check for Magic Link on mount
    useEffect(() => {
        const checkMagicLink = async () => {
            if (window.location.href.includes('apiKey')) { // Basic check if it's a firebase link
                let emailForSignIn = window.localStorage.getItem('emailForSignIn');
                if (!emailForSignIn) {
                    emailForSignIn = window.prompt('Please provide your email for confirmation');
                }

                if (emailForSignIn) {
                    try {
                        setLoading(true);
                        await completeMagicLinkSignIn(emailForSignIn, window.location.href);
                        window.localStorage.removeItem('emailForSignIn');
                        navigate('/');
                    } catch (err) {
                        setError('Failed to sign in with magic link. Link might be expired.');
                        console.error(err);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };
        checkMagicLink();
    }, []);

    // Redirect when user is authenticated
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);

            let loginEmail = email;
            // If input doesn't contain '@', assume it's a Login ID and append fake domain
            if (!email.includes('@')) {
                loginEmail = `${email}@escola.com`;
            }

            await login(loginEmail, password);
            // Navigation will be handled by useEffect
        } catch (err) {
            if (err.code === 'auth/too-many-requests') {
                setError(t('tooManyRequests') || 'Too many attempts. Please try again later or reset your password.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError(t('invalidCredentials') || 'Invalid email or password.');
            } else {
                setError('Failed to log in: ' + err.code);
            }
            console.error(err);
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError('');
            setLoading(true);
            await googleSignIn();
            navigate('/');
        } catch (err) {
            setError('Failed to sign in with Google.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLink = async () => {
        if (!email) {
            return setError('Please enter your email first.');
        }
        try {
            setError('');
            setMessage('');
            setLoading(true);
            await sendMagicLink(email);
            window.localStorage.setItem('emailForSignIn', email);
            setMessage('Check your email for the magic link!');
        } catch (err) {
            setError('Failed to send magic link. ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            return setError(t('emailPlaceholder') || 'Please enter your email first.');
        }
        try {
            setError('');
            setMessage('');
            setLoading(true);
            await resetPassword(email);
            setMessage(t('resetPasswordEmailSent') || 'Password reset email sent!');
        } catch (err) {
            setError(t('resetPasswordFailed') || 'Failed to send reset email.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
            {/* Language Switcher */}
            <div className="absolute top-4 right-4 flex gap-2">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={clsx(
                            "px-3 py-1.5 rounded-full text-sm font-bold transition-all border",
                            language === lang.code
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25"
                                : "bg-slate-800 border-slate-700 text-gray-400 hover:border-blue-600 hover:text-white"
                        )}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <School className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                        {t('loginWelcome') || 'Welcome Back'}
                    </h2>
                    <p className="text-gray-400 mt-2">{t('loginSubtitle') || "Login to manage your kids' movies"}</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                        <p>{error}</p>
                        {(error.includes('Too many attempts') || error.includes('Muitas tentativas')) && (
                            <button
                                onClick={handleMagicLink}
                                className="mt-2 text-white underline font-bold hover:text-blue-400"
                            >
                                {t('tryMagicLink') || 'Try Magic Link instead'}
                            </button>
                        )}
                    </div>
                )}

                {message && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl mb-6 text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300 ml-1">{t('emailOrIdLabel') || 'Email or Login ID'}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors"
                                placeholder={t('emailOrIdPlaceholder') || "Enter Email or ID"}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300 ml-1">{t('passwordLabel') || 'Password'}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors"
                                placeholder={t('passwordPlaceholder') || "Enter your password"}
                                required
                            />
                        </div>
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                {t('forgotPassword') || 'Forgot Password?'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? (t('loggingIn') || 'Logging in...') : (t('loginButton') || 'Login')}
                    </button>
                </form>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-bold">{t('orContinue') || 'Or continue with'}</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <Chrome className="w-5 h-5" />
                        {t('googleLogin') || 'Google'}
                    </button>
                    <Link
                        to="/first-access"
                        className="flex items-center justify-center gap-2 py-2.5 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                    >
                        <Wand2 className="w-5 h-5 text-blue-400" />
                        {t('firstAccess') || 'First Access?'}
                    </Link>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={handleMagicLink}
                        disabled={loading || !email}
                        className="text-sm text-gray-400 hover:text-white underline"
                    >
                        {t('magicLink') || 'Or sign in with Magic Link (Email only)'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Lock, Mail, ArrowRight, CheckCircle, Globe } from 'lucide-react';
import clsx from 'clsx';

const FirstAccess = () => {
    const [step, setStep] = useState(1); // 1: Check Email, 2: Create Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    const languages = [
        { code: 'pt', label: '🇧🇷 PT' },
        { code: 'en', label: '🇺🇸 EN' },
        { code: 'es', label: '🇪🇸 ES' },
        { code: 'ja', label: '🇯🇵 JP' },
        { code: 'pl', label: '🇵🇱 PL' },
    ];

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError(t('emailNotFound') || 'Email not found in pre-registry.');
                setTimeout(() => navigate('/register'), 2000);
            } else {
                const emailDoc = snapshot.docs[0].data();
                if (emailDoc.used) {
                    setError(t('emailAlreadyRegistered') || 'This email has already been registered.');
                } else {
                    setStep(2);
                }
            }
        } catch (err) {
            console.error(err);
            setError(t('errorCheckingEmail') || 'Error checking email.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError(t('passwordsDoNotMatch') || 'Passwords do not match');
        }

        setError('');
        setLoading(true);

        try {
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, 'pre_registered_emails', docId), { used: true });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            await updateDoc(doc(db, 'users', user.uid), {
                status: 'approved',
                role: 'user',
                preRegistered: true
            });

            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to create account: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
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
                        <Film className="w-12 h-12 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                        {t('firstAccess') || 'First Access'}
                    </h2>
                    <p className="text-gray-400 mt-2">
                        {step === 1 ? (t('checkInvite') || 'Check if you are invited') : (t('createPassword') || 'Create your password')}
                    </p>
                </div>

                {error && (
                    <div className={`p-3 rounded-xl mb-6 text-sm text-center ${error.includes('Redirecting') ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleCheckEmail} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300 ml-1">{t('emailLabel') || 'Email'}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors"
                                    placeholder={t('enterEmail') || "Enter your email"}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (t('checking') || 'Checking...') : <>{t('next') || 'Next'} <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {t('emailVerified') || 'Email verified!'}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300 ml-1">{t('createPassword') || 'Create Password'}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors"
                                    placeholder={t('minPasswordLength') || "Minimum 6 characters"}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300 ml-1">{t('confirmPassword') || 'Confirm Password'}</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors"
                                    placeholder={t('confirmPassword') || "Confirm password"}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                        >
                            {loading ? (t('creatingAccount') || 'Creating Account...') : (t('completeRegistration') || 'Complete Registration')}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-gray-400 text-sm">
                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold">
                        {t('backToLogin') || 'Back to Login'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FirstAccess;

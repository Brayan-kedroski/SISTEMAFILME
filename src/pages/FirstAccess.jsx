import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';

const FirstAccess = () => {
    const [step, setStep] = useState(1); // 1: Check Email, 2: Create Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Not found, redirect to register
                setError('Email not found in pre-registry. Redirecting to normal registration...');
                setTimeout(() => navigate('/register'), 2000);
            } else {
                const emailDoc = snapshot.docs[0].data();
                if (emailDoc.used) {
                    setError('This email has already been registered. Please login.');
                } else {
                    setStep(2);
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error checking email.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setError('');
        setLoading(true);

        try {
            // 1. Create Auth User
            const userCredential = await signup(email, password);
            const user = userCredential.user;

            // 2. Mark pre-registry as used
            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, 'pre_registered_emails', docId), { used: true });
            }

            // 3. Update User Doc to Approved (handled by AuthContext or manual update here to be sure)
            // AuthContext will create the doc, but we want to ensure it's approved immediately.
            // We'll wait a bit for AuthContext to create it, or we can just set it here.
            // Actually, AuthContext might race. Let's rely on AuthContext creating it as 'pending' (default)
            // and then we update it to 'approved'.

            // Wait for a moment for AuthContext to potentially run
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Film className="w-12 h-12 text-pink-500" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        First Access
                    </h2>
                    <p className="text-slate-400 mt-2">
                        {step === 1 ? 'Check if you are invited' : 'Create your password'}
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
                            <label className="text-sm font-bold text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-pink-500 focus:outline-none text-white transition-colors"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? 'Checking...' : <>Next <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Email verified!
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">Create Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-pink-500 focus:outline-none text-white transition-colors"
                                    placeholder="Minimum 6 characters"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-pink-500 focus:outline-none text-white transition-colors"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all"
                        >
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center text-slate-400 text-sm">
                    <Link to="/login" className="text-pink-400 hover:text-pink-300 font-bold">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FirstAccess;

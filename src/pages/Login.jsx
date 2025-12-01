import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Lock, Mail, Chrome, Wand2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleSignIn, sendMagicLink, completeMagicLinkSignIn, currentUser } = useAuth();
    const navigate = useNavigate();

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            console.error(err);
        }
        setLoading(false);
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

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Film className="w-12 h-12 text-pink-500" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                        Welcome Back
                    </h2>
                    <p className="text-slate-400 mt-2">Login to manage your kids' movies</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl mb-6 text-sm text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-pink-500 focus:outline-none text-white transition-colors"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">Or continue with</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <Chrome className="w-5 h-5" />
                        Google
                    </button>
                    <button
                        onClick={handleMagicLink}
                        disabled={loading || !email}
                        className="flex items-center justify-center gap-2 py-2.5 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50"
                        title={!email ? "Enter email first" : "Send Magic Link"}
                    >
                        <Wand2 className="w-5 h-5 text-purple-400" />
                        Magic Link
                    </button>
                </div>

                <div className="mt-6 text-center text-slate-400 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-pink-400 hover:text-pink-300 font-bold">
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;

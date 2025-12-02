import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Star, Shield, Calendar, Heart, School } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
    const { t, language, setLanguage } = useLanguage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate('/wishlist');
        }
    }, [currentUser, navigate]);

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-500/10 z-0"></div>
                <div className="max-w-7xl mx-auto px-6 py-24 relative z-10 flex flex-col items-center text-center">
                    <div className="mb-6 p-4 bg-slate-800/50 backdrop-blur-md rounded-full border border-slate-700 shadow-2xl animate-bounce-slow">
                        <Film className="w-16 h-16 text-blue-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent">
                        KidsFlix
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        {t('landingSubtitle') || 'The ultimate platform to manage, schedule, and enjoy movies with your kids.'}
                    </p>

                    <Link
                        to="/login"
                        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-600/30"
                    >
                        {t('loginButton') || 'Login'}
                        <div className="absolute -inset-3 rounded-full bg-blue-600 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
                    </Link>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                        <Heart className="w-10 h-10 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('wishlistTitle') || 'Wishlist'}</h3>
                        <p className="text-gray-400">Curate a list of movies your kids want to watch. Keep track of everything in one place.</p>
                    </div>
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                        <Calendar className="w-10 h-10 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('scheduleTitle') || 'Schedule'}</h3>
                        <p className="text-gray-400">Plan movie nights or school screenings. Organize by day and class effortlessly.</p>
                    </div>
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition-colors">
                        <Shield className="w-10 h-10 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Safe & Secure</h3>
                        <p className="text-gray-400">Controlled access for teachers and administrators. Your data is safe with us.</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} KidsFlix Manager. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;

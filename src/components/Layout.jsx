import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, CheckCircle, Heart, Globe, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { language, setLanguage, t } = useLanguage();

    const navItems = [
        { path: '/', label: t('nav.wishlist'), icon: Heart },
        { path: '/downloaded', label: t('nav.myMovies'), icon: CheckCircle },
        { path: '/schedule', label: t('nav.schedule'), icon: Calendar },
    ];

    const languages = [
        { code: 'pt', label: 'PT' },
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' },
        { code: 'ja', label: 'JP' },
        { code: 'pl', label: 'PL' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-pink-500 selection:text-white">
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 p-4 md:top-0 md:bottom-auto md:border-b md:border-t-0 z-50">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-2 text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            <Film className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
                            KidsFlix
                        </div>
                        {/* Mobile Language Switcher */}
                        <div className="flex md:hidden gap-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code)}
                                    className={clsx(
                                        "text-[10px] font-bold px-1.5 py-1 rounded-md transition-colors",
                                        language === lang.code
                                            ? "bg-pink-500 text-white"
                                            : "bg-slate-700 text-slate-400"
                                    )}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 md:gap-6 w-full md:w-auto justify-around">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                        'flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-full transition-all duration-300 flex-1 md:flex-none',
                                isActive
                                    ? 'bg-pink-500/20 text-pink-400'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    )}
                                >
                        <Icon className={clsx("w-5 h-5 md:w-6 md:h-6", isActive && "fill-current")} />
                        <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
                    </Link>
                    );
                        })}
                </div>

                {/* Desktop Language Switcher */}
                <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-full p-1 border border-slate-700">
                    <Globe className="w-4 h-4 text-slate-400 ml-2 mr-1" />
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code)}
                            className={clsx(
                                "text-xs font-bold px-2 py-1 rounded-full transition-all",
                                language === lang.code
                                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
        </div>
            </nav >

    <main className="pb-32 pt-8 md:pt-24 px-4 max-w-5xl mx-auto">
        {children}
    </main>
        </div >
    );
};

export default Layout;

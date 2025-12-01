import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    const languages = [
        { code: 'pt', label: 'PT' },
        { code: 'en', label: 'EN' },
        { code: 'es', label: 'ES' },
        { code: 'ja', label: 'JP' },
        { code: 'pl', label: 'PL' }
    ];

    return (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-1 bg-blood-900 backdrop-blur-md p-1.5 rounded-full border border-blood-800 shadow-2xl animate-fade-in">
            <div className="p-2 text-blood-600">
                <Globe className="w-4 h-4" />
            </div>
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${language === lang.code
                        ? 'bg-blood-600 text-white shadow-lg shadow-blood-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-blood-900'
                        }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;

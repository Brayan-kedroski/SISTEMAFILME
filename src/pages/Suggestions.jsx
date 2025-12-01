import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquarePlus, Send } from 'lucide-react';

const Suggestions = () => {
    const [title, setTitle] = useState('');
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'suggestions'), {
                title,
                reason,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                createdAt: new Date().toISOString(),
                status: 'pending' // pending, approved, rejected
            });
            setMessage(t('suggestionSent') || 'Suggestion sent successfully!');
            setTitle('');
            setReason('');
        } catch (error) {
            console.error("Error sending suggestion:", error);
            setMessage(t('suggestionFailed') || 'Failed to send suggestion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {t('suggestMovieTitle') || 'Suggest a Movie'}
                </h1>
                <p className="text-slate-400">{t('suggestMovieSubtitle') || 'Found a great movie for the kids? Let us know!'}</p>
            </header>

            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-xl">
                {message && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl mb-6 text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1">{t('movieTitleLabel') || 'Movie Title'}</label>
                        <div className="relative">
                            <MessageSquarePlus className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-yellow-500 focus:outline-none text-white transition-colors"
                                placeholder={t('placeholderTitle') || "e.g. Toy Story 5"}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 ml-1">{t('reasonLabel') || 'Why should we add it? (Optional)'}</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-4 bg-slate-900 border border-slate-600 rounded-xl focus:border-yellow-500 focus:outline-none text-white transition-colors h-32 resize-none"
                            placeholder={t('placeholderReason') || "Tell us why it's good..."}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (t('sending') || 'Sending...') : <>{t('sendSuggestion') || 'Send Suggestion'} <Send className="w-5 h-5" /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Suggestions;

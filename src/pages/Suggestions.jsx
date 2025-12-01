import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MessageSquarePlus, Search, ArrowRight, Film, Send } from 'lucide-react';
import clsx from 'clsx';
import { searchMovies } from '../services/tmdb';

const Suggestions = () => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();
    const { t, language } = useLanguage();
    const [title, setTitle] = useState('');
    const [reason, setReason] = useState('');

    // Search state
    const [manualSearchResults, setManualSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSearching(true);
        const results = await searchMovies(title, language === 'pt' ? 'pt-BR' : 'en-US');
        setManualSearchResults(results || []);
        setIsSearching(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'suggestions'), {
                title,
                reason,
                userId: currentUser ? currentUser.uid : 'anonymous',
                userEmail: currentUser ? currentUser.email : 'anonymous',
                createdAt: new Date().toISOString(),
                status: 'pending' // pending, approved, rejected
            });
            setMessage(t('suggestionSent') || 'Suggestion sent successfully!');
            setTitle('');
            setReason('');
            setManualSearchResults([]);
        } catch (error) {
            console.error("Error sending suggestion:", error);
            setMessage(t('suggestionFailed') || 'Failed to send suggestion.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectManualMovie = (movie) => {
        setTitle(movie.title);
        setReason(movie.overview || '');
        setManualSearchResults([]);
    };

    const [selectedAge, setSelectedAge] = useState(null);
    const [suggestedMovies, setSuggestedMovies] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const ageRatings = [
        { label: 'L', value: 'L', color: 'bg-green-600 hover:bg-green-500', desc: 'Livre' },
        { label: '10', value: '10', color: 'bg-blue-600 hover:bg-blue-500', desc: '10+' },
        { label: '12', value: '12', color: 'bg-yellow-500 hover:bg-yellow-400 text-black', desc: '12+' },
        { label: '14', value: '14', color: 'bg-orange-600 hover:bg-orange-500', desc: '14+' },
        { label: '16', value: '16', color: 'bg-red-600 hover:bg-red-500', desc: '16+' },
        { label: '18', value: '18', color: 'bg-black hover:bg-gray-900 border border-gray-700', desc: '18+' },
    ];

    const handleAgeSearch = async (ageValue) => {
        setSelectedAge(ageValue);
        setLoadingSuggestions(true);
        try {
            let certQuery = ageValue;
            if (ageValue === 'L') certQuery = 'L';

            const response = await fetch(
                `https://api.themoviedb.org/3/discover/movie?api_key=d4d51086088d924a6898950c47481b49&language=${language === 'pt' ? 'pt-BR' : 'en-US'}&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&certification_country=BR&certification.lte=${certQuery}`
            );
            const data = await response.json();
            setSuggestedMovies(data.results.slice(0, 4)); // Show top 4
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSelectMovie = (movie) => {
        setTitle(movie.title);
        setReason(movie.overview || (t('suggestionFromAgeSearch') || `Suggested based on age search: ${selectedAge}`));
        setSuggestedMovies([]);
        setSelectedAge(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <header className="text-center space-y-2">
                <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
                    {t('suggestMovieTitle') || 'Suggest a Movie'}
                </h1>
                <p className="text-gray-200 font-medium">{t('suggestMovieSubtitle') || 'Found a great movie for the kids? Let us know!'}</p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Manual Suggestion Form (Now Search) */}
                <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-400" />
                        {t('searchMovie') || 'Pesquisar Filme'}
                    </h2>

                    {message && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl mb-6 text-center font-bold">
                            {message}
                        </div>
                    )}

                    <div className="space-y-6 relative">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-300 ml-1">{t('searchLabel') || 'Buscar Título no TMDB'}</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearch(e);
                                        }
                                    }}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors placeholder-gray-500"
                                    placeholder={t('searchPlaceholder') || "Digite o nome do filme..."}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={isSearching || !title.trim()}
                                    className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
                                </button>

                                {manualSearchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                                        {manualSearchResults.map(movie => (
                                            <button
                                                key={movie.id}
                                                type="button"
                                                onClick={() => handleSelectManualMovie(movie)}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-700/50 last:border-0"
                                            >
                                                {movie.poster_path ? (
                                                    <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                                                ) : (
                                                    <div className="w-8 h-12 bg-slate-600 rounded flex items-center justify-center"><Film className="w-4 h-4" /></div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-white text-sm">{movie.title}</div>
                                                    <div className="text-xs text-gray-400">{movie.release_date?.split('-')[0]}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 ml-1">Selecione um filme da lista para preencher automaticamente.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300 ml-1">{t('reasonLabel') || 'Sinopse / Motivo'}</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl focus:border-blue-500 focus:outline-none text-white transition-colors h-32 resize-none placeholder-gray-500"
                                    placeholder={t('reasonPlaceholder') || "A sinopse aparecerá aqui..."}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !title}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                {loading ? (t('sending') || 'Enviando...') : <>{t('sendSuggestion') || 'Enviar Sugestão'} <Send className="w-5 h-5" /></>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Age-based Recommendations */}
                <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Film className="w-6 h-6 text-blue-400" />
                        {t('needIdeas') || 'Need Ideas?'}
                    </h2>
                    <p className="text-gray-300 mb-6 text-sm">
                        {t('enterAgeDesc') || 'Select an age rating to see popular movies suitable for that group.'}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {ageRatings.map((rating) => (
                            <button
                                key={rating.value}
                                onClick={() => handleAgeSearch(rating.value)}
                                disabled={loadingSuggestions}
                                className={clsx(
                                    "py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 shadow-lg",
                                    rating.color,
                                    selectedAge === rating.value ? "ring-4 ring-white/30 scale-105" : ""
                                )}
                            >
                                {rating.label}
                            </button>
                        ))}
                    </div>

                    {loadingSuggestions && (
                        <div className="text-center py-4 text-blue-400 animate-pulse font-bold">
                            {t('searching') || 'Searching...'}
                        </div>
                    )}

                    <div className="space-y-4">
                        {suggestedMovies.map(movie => (
                            <div key={movie.id} className="flex gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500 transition-colors group">
                                {movie.poster_path && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                        alt={movie.title}
                                        className="w-12 h-18 object-cover rounded-lg shadow-sm"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate">{movie.title}</h4>
                                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{movie.overview}</p>
                                    <button
                                        onClick={() => handleSelectMovie(movie)}
                                        className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        {t('suggestThis') || 'Suggest This'} <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {suggestedMovies.length === 0 && !loadingSuggestions && selectedAge && (
                            <div className="text-center text-gray-500 text-sm py-4">
                                {t('noMoviesFound') || 'No movies found. Try another age.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Suggestions;

import React, { useState } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Download, Trash2, Search, List, Type, Info } from 'lucide-react';
import { searchMovies, getPosterUrl } from '../services/tmdb';
import clsx from 'clsx';

const Wishlist = () => {
    const { movies, addMovie, moveToDownloaded, removeMovie } = useMovies();
    const { t, language } = useLanguage();

    const [mode, setMode] = useState('single'); // 'single' | 'batch'
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [batchInput, setBatchInput] = useState('');

    // Manual entry fields
    const [manualTitle, setManualTitle] = useState('');
    const [manualRating, setManualRating] = useState('');
    const [manualOverview, setManualOverview] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        const getTmdbLanguage = (lang) => {
            switch (lang) {
                case 'pt': return 'pt-BR';
                case 'ja': return 'ja-JP';
                case 'pl': return 'pl-PL';
                case 'es': return 'es-ES';
                case 'en': return 'en-US';
                default: return 'pt-BR';
            }
        };

        const results = await searchMovies(query, getTmdbLanguage(language));
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleAddFromSearch = (movie) => {
        addMovie({
            title: movie.title,
            overview: movie.overview,
            rating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
            poster_path: movie.poster_path,
            release_date: movie.release_date
        });
        setSearchResults([]);
        setQuery('');
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualTitle.trim()) {
            addMovie({
                title: manualTitle.trim(),
                rating: manualRating,
                overview: manualOverview
            });
            setManualTitle('');
            setManualRating('');
            setManualOverview('');
        }
    };

    const handleBatchSubmit = (e) => {
        e.preventDefault();
        if (batchInput.trim()) {
            const titles = batchInput.split('\n').filter(line => line.trim());
            addMovie(titles); // Context handles array of strings
            setBatchInput('');
        }
    };

    const wishlistMovies = movies.filter((m) => m.status === 'wishlist');

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {t('wishlistTitle')}
                </h1>
                <p className="text-slate-400">{t('wishlistSubtitle')}</p>
            </header>

            {/* Mode Switcher */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setMode('single')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all",
                        mode === 'single' ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    <Type className="w-4 h-4" /> {t('singleAdd')}
                </button>
                <button
                    onClick={() => setMode('batch')}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all",
                        mode === 'batch' ? "bg-pink-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    )}
                >
                    <List className="w-4 h-4" /> {t('batchAdd')}
                </button>
            </div>

            {/* Input Forms */}
            <div className="max-w-xl mx-auto bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                {mode === 'single' ? (
                    <div className="space-y-6">
                        {/* Search Section */}
                        <div className="space-y-4">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full px-6 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching || !query.trim()}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-bold disabled:opacity-50"
                                >
                                    <Search className="w-5 h-5" />
                                </button>
                            </form>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {searchResults.map((movie) => (
                                        <div key={movie.id} className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg group">
                                            {movie.poster_path ? (
                                                <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                                            ) : (
                                                <div className="w-10 h-14 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">No IMG</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold truncate">{movie.title}</h4>
                                                <p className="text-xs text-slate-400">{movie.release_date?.split('-')[0]}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAddFromSearch(movie)}
                                                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase font-bold">{t('manualEntry')}</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        {/* Manual Form */}
                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <input
                                type="text"
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                                placeholder={t('placeholder')}
                                className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={manualRating}
                                    onChange={(e) => setManualRating(e.target.value)}
                                    placeholder={t('rating')}
                                    className="w-1/3 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={manualOverview}
                                    onChange={(e) => setManualOverview(e.target.value)}
                                    placeholder={t('details')}
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!manualTitle.trim()}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                {t('add')}
                            </button>
                        </form>
                    </div>
                ) : (
                    /* Batch Mode */
                    <form onSubmit={handleBatchSubmit} className="space-y-4">
                        <textarea
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            placeholder="Movie 1&#10;Movie 2&#10;Movie 3"
                            rows={5}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none resize-none"
                        />
                        <button
                            type="submit"
                            disabled={!batchInput.trim()}
                            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {t('add')}
                        </button>
                    </form>
                )}
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2">
                {wishlistMovies.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        {t('noWishlist')}
                    </div>
                ) : (
                    wishlistMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl flex gap-4 group hover:border-slate-600 transition-all"
                        >
                            {movie.poster_path ? (
                                <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shadow-lg" />
                            ) : (
                                <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                    <Film className="w-8 h-8 opacity-50" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-lg truncate">{movie.title}</h3>
                                    {movie.rating && (
                                        <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded mt-1">
                                            ★ {movie.rating}
                                        </span>
                                    )}
                                    {movie.overview && (
                                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{movie.overview}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2 justify-end">
                                    <button
                                        onClick={() => moveToDownloaded(movie.id)}
                                        className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                                        title={t('tooltips.markDownloaded')}
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => removeMovie(movie.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                        title={t('tooltips.remove')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Helper icon component
const Film = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
);

export default Wishlist;

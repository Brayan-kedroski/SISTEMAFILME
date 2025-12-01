import React, { useState, useMemo } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Download, Trash2, Search, List, Type, Film, Play, Filter, X } from 'lucide-react';
import { searchMovies, getPosterUrl, getMovieTrailer } from '../services/tmdb';
import clsx from 'clsx';

const Wishlist = () => {
    const { movies, addMovie, moveToDownloaded, removeMovie } = useMovies();
    const { t, language } = useLanguage();

    const [mode, setMode] = useState('single'); // 'single' | 'batch'
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Batch state
    const [batchInput, setBatchInput] = useState('');
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [processingStatus, setProcessingStatus] = useState('');

    // Manual entry fields
    const [manualTitle, setManualTitle] = useState('');
    const [manualRating, setManualRating] = useState('');
    const [manualOverview, setManualOverview] = useState('');

    // Filters & Sorting
    const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, ratingDesc, titleAsc

    // Trailer Modal
    const [trailerUrl, setTrailerUrl] = useState(null);

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

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        const results = await searchMovies(query, getTmdbLanguage(language));
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleAddFromSearch = async (movie) => {
        const result = await addMovie({
            title: movie.title,
            overview: movie.overview,
            rating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            tmdb_id: movie.id // Store TMDB ID for trailers
        });

        if (result.skipped.length > 0) {
            alert(t('duplicateWarning') || `Movie already exists: ${result.skipped[0]}`);
        }

        setSearchResults([]);
        setQuery('');
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (manualTitle.trim()) {
            const result = await addMovie({
                title: manualTitle.trim(),
                rating: manualRating,
                overview: manualOverview
            });

            if (result.skipped.length > 0) {
                alert(t('duplicateWarning') || `Movie already exists: ${result.skipped[0]}`);
            } else {
                setManualTitle('');
                setManualRating('');
                setManualOverview('');
            }
        }
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        if (batchInput.trim()) {
            const titles = batchInput.split('\n').filter(line => line.trim());
            if (titles.length === 0) return;

            setIsProcessingBatch(true);
            setBatchProgress({ current: 0, total: titles.length });

            const moviesToAdd = [];

            for (let i = 0; i < titles.length; i++) {
                const title = titles[i];
                setBatchProgress(prev => ({ ...prev, current: i + 1 }));
                setProcessingStatus(`${t('searching') || 'Searching'}: "${title}"...`);

                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                    let results = await searchMovies(title, getTmdbLanguage(language));

                    if (!results || results.length === 0) {
                        setProcessingStatus(`"${title}" not found in ${language}. Trying English...`);
                        results = await searchMovies(title, 'en-US');
                    }

                    if (results && results.length > 0) {
                        const movie = results[0];
                        setProcessingStatus(`Found: ${movie.title} (★ ${movie.vote_average?.toFixed(1) || 'N/A'})`);
                        await new Promise(resolve => setTimeout(resolve, 800));

                        moviesToAdd.push({
                            title: movie.title,
                            overview: movie.overview,
                            rating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
                            poster_path: movie.poster_path,
                            release_date: movie.release_date,
                            tmdb_id: movie.id
                        });
                    } else {
                        setProcessingStatus(`No details found for "${title}". Adding as plain text.`);
                        await new Promise(resolve => setTimeout(resolve, 800));
                        moviesToAdd.push({ title });
                    }
                } catch (error) {
                    console.error(`Error fetching ${title}:`, error);
                    setProcessingStatus(`Error fetching "${title}". Adding as plain text.`);
                    moviesToAdd.push({ title });
                }
            }

            setProcessingStatus('Saving to database...');
            const result = await addMovie(moviesToAdd);

            if (result.skipped.length > 0) {
                alert(`${t('batchComplete') || 'Batch complete'}.\n${t('skippedDuplicates') || 'Skipped duplicates'}: ${result.skipped.length}\n(${result.skipped.join(', ')})`);
            }

            setBatchInput('');
            setIsProcessingBatch(false);
            setBatchProgress({ current: 0, total: 0 });
            setProcessingStatus('');
        }
    };

    const handlePlayTrailer = async (movie) => {
        if (!movie.tmdb_id && !movie.title) return;

        let id = movie.tmdb_id;
        if (!id) {
            const results = await searchMovies(movie.title, getTmdbLanguage(language));
            if (results && results.length > 0) id = results[0].id;
        }

        if (id) {
            const url = await getMovieTrailer(id, getTmdbLanguage(language));
            if (url) {
                setTrailerUrl(url);
            } else {
                alert(t('noTrailer') || "No trailer found");
            }
        } else {
            alert(t('noTrailer') || "No trailer found");
        }
    };

    const filteredMovies = useMemo(() => {
        let result = movies.filter((m) => m.status === 'wishlist');

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'dateDesc':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'dateAsc':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'ratingDesc':
                    return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
                case 'titleAsc':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return result;
    }, [movies, sortBy]);

    return (
        <div className="space-y-8 relative">
            {/* Trailer Modal */}
            {trailerUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                        <button
                            onClick={() => setTrailerUrl(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <iframe
                            src={`${trailerUrl}?autoplay=1`}
                            title="Trailer"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

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
                            <div className="flex flex-col md:flex-row gap-2">
                                <input
                                    type="text"
                                    value={manualRating}
                                    onChange={(e) => setManualRating(e.target.value)}
                                    placeholder={t('rating')}
                                    className="w-full md:w-1/3 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={manualOverview}
                                    onChange={(e) => setManualOverview(e.target.value)}
                                    placeholder={t('details')}
                                    className="w-full md:flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none"
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
                            disabled={isProcessingBatch}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-pink-500 focus:outline-none resize-none disabled:opacity-50"
                        />

                        {isProcessingBatch && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>{processingStatus || 'Processing...'}</span>
                                    <span>{batchProgress.current} / {batchProgress.total}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!batchInput.trim() || isProcessingBatch}
                            className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                            {isProcessingBatch ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {t('processing') || 'Processing...'}
                                </>
                            ) : (
                                t('add')
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Filters & Sorting Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                    <Filter className="w-4 h-4" />
                    <span>{filteredMovies.length} {t('movies') || 'Movies'}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs font-bold uppercase">{t('sortBy') || 'Sort By'}:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-900 border border-slate-600 text-slate-300 text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block p-2"
                    >
                        <option value="dateDesc">{t('sortDateNewest') || 'Date (Newest)'}</option>
                        <option value="dateAsc">{t('sortDateOldest') || 'Date (Oldest)'}</option>
                        <option value="ratingDesc">{t('sortRatingHigh') || 'Rating (High)'}</option>
                        <option value="titleAsc">{t('sortTitleAZ') || 'Title (A-Z)'}</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2">
                {filteredMovies.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        {t('noWishlist')}
                    </div>
                ) : (
                    filteredMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl flex gap-4 group hover:border-slate-600 transition-all"
                        >
                            <div className="relative flex-shrink-0">
                                {movie.poster_path ? (
                                    <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shadow-lg" />
                                ) : (
                                    <div className="w-16 h-24 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                        <Film className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                                <button
                                    onClick={() => handlePlayTrailer(movie)}
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                >
                                    <Play className="w-8 h-8 text-white fill-current" />
                                </button>
                            </div>

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
                                    {movie.createdAt && (
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            {t('addedOn') || 'Added'}: {new Date(movie.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                                        </p>
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

export default Wishlist;

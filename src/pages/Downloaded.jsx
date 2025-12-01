import React, { useState, useMemo } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, Film, Heart, Play, Filter, X } from 'lucide-react';
import { getPosterUrl, getMovieTrailer, searchMovies } from '../services/tmdb';

const Downloaded = () => {
    const { movies, removeMovie, toggleKidsLiked } = useMovies();
    const { t, language } = useLanguage();

    // Filters & Sorting
    const [sortBy, setSortBy] = useState('dateDesc');
    const [filterLiked, setFilterLiked] = useState(false);

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
        let result = movies.filter((m) => m.status === 'downloaded');

        if (filterLiked) {
            result = result.filter(m => m.kidsLiked);
        }

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
    }, [movies, sortBy, filterLiked]);

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
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {t('downloadedTitle')}
                </h1>
                <p className="text-slate-400">{t('downloadedSubtitle')}</p>
            </header>

            {/* Filters & Sorting Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                        <Filter className="w-4 h-4" />
                        <span>{filteredMovies.length} {t('movies') || 'Movies'}</span>
                    </div>
                    <button
                        onClick={() => setFilterLiked(!filterLiked)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${filterLiked ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                    >
                        <Heart className={`w-4 h-4 ${filterLiked ? 'fill-current' : ''}`} />
                        {t('kidsLiked') || 'Kids Liked'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs font-bold uppercase">{t('sortBy') || 'Sort By'}:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-slate-900 border border-slate-600 text-slate-300 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                    >
                        <option value="dateDesc">{t('sortDateNewest') || 'Date (Newest)'}</option>
                        <option value="dateAsc">{t('sortDateOldest') || 'Date (Oldest)'}</option>
                        <option value="ratingDesc">{t('sortRatingHigh') || 'Rating (High)'}</option>
                        <option value="titleAsc">{t('sortTitleAZ') || 'Title (A-Z)'}</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredMovies.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        {t('noDownloaded')}
                    </div>
                ) : (
                    filteredMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl flex gap-4 group hover:border-slate-600 transition-all"
                        >
                            <div className="relative flex-shrink-0">
                                {movie.poster_path ? (
                                    <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-20 h-28 object-cover rounded-lg shadow-lg" />
                                ) : (
                                    <div className="w-20 h-28 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
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
                                    <div className="flex items-center gap-2 mt-1">
                                        {movie.rating && (
                                            <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">
                                                ★ {movie.rating}
                                            </span>
                                        )}
                                        {movie.createdAt && (
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(movie.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                                            </span>
                                        )}
                                    </div>
                                    {movie.overview && (
                                        <p className="text-xs text-slate-400 line-clamp-2 mt-2">{movie.overview}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-3 justify-end">
                                    <button
                                        onClick={() => toggleKidsLiked(movie.id, movie.kidsLiked)}
                                        className={`p-2 rounded-full transition-colors ${movie.kidsLiked ? 'text-pink-500 bg-pink-500/10' : 'text-slate-500 hover:text-pink-400 hover:bg-pink-500/10'}`}
                                        title={movie.kidsLiked ? "Kids Liked!" : "Did kids like it?"}
                                    >
                                        <Heart className={`w-5 h-5 ${movie.kidsLiked ? 'fill-current' : ''}`} />
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

export default Downloaded;

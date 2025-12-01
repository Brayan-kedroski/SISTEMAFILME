import React, { useState, useMemo } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, Film, Heart, Play, Filter, X, RotateCcw } from 'lucide-react';
import { getPosterUrl, getMovieTrailer, searchMovies } from '../services/tmdb';

const Downloaded = () => {
    const { movies, removeMovie, toggleKidsLiked, moveToWishlist } = useMovies();
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
        <div className="space-y-8 relative min-h-screen">
            {/* Trailer Modal */}
            {trailerUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-blood-800">
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
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                    {t('downloadedTitle')}
                </h1>
                <p className="text-gray-200 font-medium">{t('downloadedSubtitle')}</p>
            </header>

            {/* Filters & Sorting Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-blood-900/50 p-4 rounded-2xl border border-blood-800 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-200 text-sm font-bold">
                        <Filter className="w-4 h-4" />
                        <span>{filteredMovies.length} {t('movies') || 'Movies'}</span>
                    </div>
                    <button
                        onClick={() => setFilterLiked(!filterLiked)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${filterLiked ? 'bg-blood-600 text-white shadow-md' : 'bg-blood-800 text-gray-300 hover:bg-blood-700 hover:text-white'}`}
                    >
                        <Heart className={`w-4 h-4 ${filterLiked ? 'fill-current' : ''}`} />
                        {t('kidsLiked') || 'Kids Liked'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-xs font-bold uppercase">{t('sortBy') || 'Sort By'}:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-blood-950 border border-blood-700 text-white text-sm rounded-lg focus:ring-blood-500 focus:border-blood-500 block p-2"
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
                    <div className="col-span-full text-center py-12 text-gray-400">
                        {t('noDownloaded')}
                    </div>
                ) : (
                    filteredMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-blood-900/40 backdrop-blur-sm border border-blood-800 p-4 rounded-2xl flex gap-4 group hover:border-blood-600 transition-all hover:shadow-xl hover:shadow-blood-900/20"
                        >
                            <div className="relative flex-shrink-0">
                                {movie.poster_path ? (
                                    <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-20 h-28 object-cover rounded-lg shadow-lg" />
                                ) : (
                                    <div className="w-20 h-28 bg-blood-800 rounded-lg flex items-center justify-center text-blood-300">
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
                                    <h3 className="font-bold text-lg truncate text-white">{movie.title}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {movie.rating && (
                                            <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded border border-yellow-500/30">
                                                ★ {movie.rating}
                                            </span>
                                        )}
                                        {movie.createdAt && (
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(movie.createdAt).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                                            </span>
                                        )}
                                    </div>
                                    {movie.overview && (
                                        <p className="text-xs text-gray-300 line-clamp-2 mt-2">{movie.overview}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-3 justify-end">
                                    <button
                                        onClick={() => toggleKidsLiked(movie.id, movie.kidsLiked)}
                                        className={`p-2 rounded-full transition-colors ${movie.kidsLiked ? 'text-blood-500 bg-blood-500/10' : 'text-gray-400 hover:text-blood-400 hover:bg-blood-500/10'}`}
                                        title={movie.kidsLiked ? "Kids Liked!" : "Did kids like it?"}
                                    >
                                        <Heart className={`w-5 h-5 ${movie.kidsLiked ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => moveToWishlist(movie.id)}
                                        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-full transition-colors border border-blue-500/30"
                                        title="Move back to Wishlist"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => removeMovie(movie.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
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

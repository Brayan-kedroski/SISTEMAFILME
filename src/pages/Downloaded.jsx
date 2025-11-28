```javascript
import React from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2, Film, Heart } from 'lucide-react';
import { getPosterUrl } from '../services/tmdb';

const Downloaded = () => {
    const { movies, removeMovie, toggleKidsLiked } = useMovies();
    const { t, language } = useLanguage();

    const downloadedMovies = movies.filter((m) => m.status === 'downloaded');

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {t('downloadedTitle')}
                </h1>
                <p className="text-slate-400">{t('downloadedSubtitle')}</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {downloadedMovies.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        {t('noDownloaded')}
                    </div>
                ) : (
                    downloadedMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-2xl flex gap-4 group hover:border-slate-600 transition-all"
                        >
                            {movie.poster_path ? (
                                <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-20 h-28 object-cover rounded-lg shadow-lg" />
                            ) : (
                                <div className="w-20 h-28 bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                                    <Film className="w-8 h-8 opacity-50" />
                                </div>
                            )}

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
                                        className={`p - 2 rounded - full transition - colors ${ movie.kidsLiked ? 'text-pink-500 bg-pink-500/10' : 'text-slate-500 hover:text-pink-400 hover:bg-pink-500/10' } `}
                                        title={movie.kidsLiked ? "Kids Liked!" : "Did kids like it?"}
                                    >
                                        <Heart className={`w - 5 h - 5 ${ movie.kidsLiked ? 'fill-current' : '' } `} />
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
```

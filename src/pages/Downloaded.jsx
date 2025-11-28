import React from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Trash2 } from 'lucide-react';
import { getPosterUrl } from '../services/tmdb';
import clsx from 'clsx';

const Downloaded = () => {
    const { movies, removeMovie } = useMovies();
    const { t } = useLanguage();
    const downloadedMovies = movies.filter((m) => m.status === 'downloaded');

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {t('myMoviesTitle')}
                </h1>
                <p className="text-slate-400">{t('myMoviesSubtitle')}</p>
            </header>

            <div className="grid gap-6">
                {downloadedMovies.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        {t('noDownloaded')}
                    </div>
                ) : (
                    downloadedMovies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-3xl flex flex-col md:flex-row gap-6"
                        >
                            {/* Poster */}
                            <div className="flex-shrink-0 mx-auto md:mx-0">
                                {movie.poster_path ? (
                                    <img src={getPosterUrl(movie.poster_path, 'w154')} alt={movie.title} className="w-32 h-48 object-cover rounded-xl shadow-lg" />
                                ) : (
                                    <div className="w-32 h-48 bg-slate-700 rounded-xl flex items-center justify-center text-slate-500">
                                        <FilmIcon className="w-12 h-12 opacity-50" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold">{movie.title}</h3>
                                        {movie.rating && (
                                            <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-sm font-bold rounded mt-1">
                                                ★ {movie.rating}
                                            </span>
                                        )}
                                        {movie.overview && (
                                            <p className="text-sm text-slate-400 mt-2 line-clamp-3">{movie.overview}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeMovie(movie.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors flex-shrink-0"
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

const FilmIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18" /><path d="M3 7.5h4" /><path d="M3 12h18" /><path d="M3 16.5h4" /><path d="M17 3v18" /><path d="M17 7.5h4" /><path d="M17 16.5h4" /></svg>
);

export default Downloaded;

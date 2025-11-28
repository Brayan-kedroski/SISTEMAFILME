import React, { useState } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Trash2, Calendar, Users } from 'lucide-react';
import { getPosterUrl } from '../services/tmdb';
import clsx from 'clsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Schedule = () => {
    const { movies, schedule, addToSchedule, removeFromSchedule, updateClasses } = useMovies();
    const { t } = useLanguage();

    const [selectedDay, setSelectedDay] = useState('Mon');
    const [isAdding, setIsAdding] = useState(false);

    const downloadedMovies = movies.filter(m => m.status === 'downloaded');
    const currentSchedule = schedule[selectedDay] || [];

    const handleAddMovie = (movieId) => {
        addToSchedule(selectedDay, movieId, '');
        setIsAdding(false);
    };

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('scheduleTitle')}
                </h1>
                <p className="text-slate-400">{t('scheduleSubtitle')}</p>
            </header>

            {/* Day Selector */}
            <div className="flex overflow-x-auto pb-4 gap-2 md:justify-center custom-scrollbar">
                {DAYS.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={clsx(
                            "px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all",
                            selectedDay === day
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        {t(`days.${day}`)}
                    </button>
                ))}
            </div>

            {/* Schedule Content */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-6 min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-400" />
                        {t(`days.${selectedDay}`)}
                    </h2>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> {t('add')}
                    </button>
                </div>

                {/* Add Movie Dropdown/Modal Area */}
                {isAdding && (
                    <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-600 animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold mb-3 text-slate-300">{t('selectMovie')}</h3>
                        {downloadedMovies.length === 0 ? (
                            <p className="text-slate-500 text-sm">{t('noMoviesDownloaded')}</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {downloadedMovies.map(movie => (
                                    <button
                                        key={movie.id}
                                        onClick={() => handleAddMovie(movie.id)}
                                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700 text-left transition-colors group"
                                    >
                                        {movie.poster_path ? (
                                            <img src={getPosterUrl(movie.poster_path, 'w92')} alt="" className="w-8 h-12 object-cover rounded" />
                                        ) : (
                                            <div className="w-8 h-12 bg-slate-900 rounded flex-shrink-0" />
                                        )}
                                        <span className="text-sm font-medium truncate group-hover:text-blue-400">{movie.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Entries List */}
                <div className="space-y-4">
                    {currentSchedule.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
                            No movies scheduled for this day.
                        </div>
                    ) : (
                        currentSchedule.map(entry => (
                            <div key={entry.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex items-center gap-3 flex-1">
                                    {entry.poster_path ? (
                                        <img src={getPosterUrl(entry.poster_path, 'w92')} alt="" className="w-12 h-16 object-cover rounded shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-16 bg-slate-800 rounded flex-shrink-0" />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">{entry.title}</h3>
                                    </div>
                                </div>

                                <div className="flex-1 w-full md:w-auto">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {t('classes')}
                                    </label>
                                    <input
                                        type="text"
                                        value={entry.classes}
                                        onChange={(e) => updateClasses(selectedDay, entry.id, e.target.value)}
                                        placeholder="e.g. 1A, 2B"
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    onClick={() => removeFromSchedule(selectedDay, entry.id)}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors self-end md:self-center"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Schedule;

import React, { useState } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Plus, Trash2, Printer } from 'lucide-react';
import clsx from 'clsx';
import { getPosterUrl } from '../services/tmdb';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const Schedule = () => {
    const { schedule, addToSchedule, removeFromSchedule, movies } = useMovies();
    const { t, language } = useLanguage();
    const [selectedDay, setSelectedDay] = useState('monday');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState('');
    const [classInput, setClassInput] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (selectedMovieId && classInput) {
            addToSchedule(selectedDay, selectedMovieId, classInput);
            setIsAdding(false);
            setSelectedMovieId('');
            setClassInput('');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const currentSchedule = schedule[selectedDay] || [];

    return (
        <div className="space-y-8 print:space-y-4">
            <header className="text-center space-y-2 print:hidden">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {t('scheduleTitle')}
                </h1>
                <p className="text-slate-400">{t('scheduleSubtitle')}</p>
            </header>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-3xl font-bold text-black">KidsFlix - {t('scheduleTitle')}</h1>
            </div>

            {/* Day Selector - Hidden on Print */}
            <div className="flex overflow-x-auto pb-4 gap-2 md:justify-center custom-scrollbar snap-x snap-mandatory px-4 md:px-0 print:hidden">
                {DAYS.map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={clsx(
                            "px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all snap-center flex-shrink-0",
                            selectedDay === day
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-105"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        {t(`days.${day}`)}
                    </button>
                ))}
            </div>

            {/* Print Controls */}
            <div className="flex justify-end print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                    <Printer className="w-4 h-4" />
                    {t('print') || 'Print'}
                </button>
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                    <h2 className="text-2xl font-bold capitalize text-white">{t(`days.${selectedDay}`)}</h2>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('add')}
                    </button>
                </div>

                {/* Print View: Show All Days */}
                <div className="hidden print:block space-y-8">
                    {DAYS.map(day => (
                        <div key={day} className="break-inside-avoid">
                            <h3 className="text-xl font-bold capitalize border-b-2 border-slate-300 mb-4 text-black">{t(`days.${day}`)}</h3>
                            <div className="space-y-2">
                                {(schedule[day] || []).map(item => {
                                    const movie = movies.find(m => m.id === item.movieId);
                                    if (!movie) return null;
                                    return (
                                        <div key={item.id} className="flex justify-between items-center p-2 border border-slate-200 rounded">
                                            <span className="font-bold text-black">{movie.title}</span>
                                            <span className="text-slate-600">{item.class}</span>
                                        </div>
                                    );
                                })}
                                {(!schedule[day] || schedule[day].length === 0) && (
                                    <p className="text-slate-400 italic text-sm">No activities</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Screen View: Selected Day */}
                <div className="print:hidden space-y-4">
                    {isAdding && (
                        <form onSubmit={handleAdd} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-4">
                            <select
                                value={selectedMovieId}
                                onChange={(e) => setSelectedMovieId(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 focus:outline-none"
                                required
                            >
                                <option value="">{t('selectMovie')}</option>
                                {movies.filter(m => m.status === 'downloaded').map(movie => (
                                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={classInput}
                                onChange={(e) => setClassInput(e.target.value)}
                                placeholder={t('classPlaceholder')}
                                className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 focus:border-blue-500 focus:outline-none"
                                required
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </form>
                    )}

                    {currentSchedule.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                            {t('noSchedule')}
                        </div>
                    ) : (
                        currentSchedule.map((item) => {
                            const movie = movies.find(m => m.id === item.movieId);
                            if (!movie) return null;

                            return (
                                <div key={item.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-slate-600 transition-all">
                                    {movie.poster_path && (
                                        <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-12 h-16 object-cover rounded hidden md:block" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">{movie.title}</h4>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                                                {item.class}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFromSchedule(selectedDay, item.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Schedule;

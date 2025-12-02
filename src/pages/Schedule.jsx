import React, { useState } from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, Plus, Trash2, Printer } from 'lucide-react';
import clsx from 'clsx';
import { getPosterUrl } from '../services/tmdb';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const Schedule = () => {
    const { schedule, addToSchedule, removeFromSchedule, movies, monthlySchedule, addToMonthlySchedule, removeFromMonthlySchedule } = useMovies();
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'

    // Weekly State
    const [selectedDay, setSelectedDay] = useState('monday');
    const [isAdding, setIsAdding] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState('');
    const [classInput, setClassInput] = useState('');

    // Monthly State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // For adding event
    const [eventTitle, setEventTitle] = useState('');
    const [eventDesc, setEventDesc] = useState('');
    const [isAddingEvent, setIsAddingEvent] = useState(false);

    // Weekly Handlers
    const handleAdd = (e) => {
        e.preventDefault();
        if (selectedMovieId && classInput) {
            addToSchedule(selectedDay, selectedMovieId, classInput);
            setIsAdding(false);
            setSelectedMovieId('');
            setClassInput('');
        }
    };

    // Monthly Handlers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 = Sunday

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (selectedDate && eventTitle) {
            addToMonthlySchedule(selectedDate, eventTitle, eventDesc);
            setIsAddingEvent(false);
            setEventTitle('');
            setEventDesc('');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const currentSchedule = schedule[selectedDay] || [];

    // Calendar Generation
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const calendarDays = [];
    // Padding for empty days
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    return (
        <div className="space-y-8 print:space-y-4">
            <header className="text-center space-y-2 print:hidden">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                    {t('scheduleTitle')}
                </h1>
                <p className="text-gray-200 font-medium">{t('scheduleSubtitle')}</p>
            </header>

            {/* View Toggle */}
            <div className="flex justify-center gap-4 print:hidden">
                <button
                    onClick={() => setViewMode('weekly')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-bold transition-all",
                        viewMode === 'weekly' ? "bg-white text-blood-900" : "bg-blood-900/50 text-gray-300 border border-blood-800"
                    )}
                >
                    {t('weekly') || 'Weekly'}
                </button>
                <button
                    onClick={() => setViewMode('monthly')}
                    className={clsx(
                        "px-6 py-2 rounded-full font-bold transition-all",
                        viewMode === 'monthly' ? "bg-white text-blood-900" : "bg-blood-900/50 text-gray-300 border border-blood-800"
                    )}
                >
                    {t('monthly') || 'Monthly'}
                </button>
            </div>

            {/* WEEKLY VIEW */}
            {viewMode === 'weekly' && (
                <>
                    {/* Day Selector - Hidden on Print */}
                    <div className="flex overflow-x-auto pb-4 gap-2 md:justify-center custom-scrollbar snap-x snap-mandatory px-4 md:px-0 print:hidden">
                        {DAYS.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={clsx(
                                    "px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all snap-center flex-shrink-0",
                                    selectedDay === day
                                        ? "bg-blood-600 text-white shadow-lg shadow-blood-600/25 scale-105"
                                        : "bg-blood-900/50 text-gray-300 hover:bg-blood-800 hover:text-white border border-blood-800"
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
                            className="flex items-center gap-2 px-4 py-2 bg-blood-800 hover:bg-blood-700 text-white rounded-lg transition-colors border border-blood-700"
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
                                className="flex items-center gap-2 px-4 py-2 bg-blood-600 hover:bg-blood-500 text-white rounded-lg transition-colors shadow-md"
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
                                <form onSubmit={handleAdd} className="bg-blood-900/50 p-4 rounded-xl border border-blood-800 space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <select
                                        value={selectedMovieId}
                                        onChange={(e) => setSelectedMovieId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg bg-blood-950 border border-blood-700 focus:border-blood-500 focus:outline-none text-white"
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
                                        className="w-full px-4 py-2 rounded-lg bg-blood-950 border border-blood-700 focus:border-blood-500 focus:outline-none text-white"
                                        required
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAdding(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-white"
                                        >
                                            {t('cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blood-600 hover:bg-blood-500 text-white rounded-lg"
                                        >
                                            {t('save')}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {currentSchedule.length === 0 ? (
                                <div className="text-center py-12 text-gray-400 bg-blood-900/20 rounded-xl border border-dashed border-blood-800">
                                    {t('noSchedule')}
                                </div>
                            ) : (
                                currentSchedule.map((item) => {
                                    const movie = movies.find(m => m.id === item.movieId);
                                    if (!movie) return null;

                                    return (
                                        <div key={item.id} className="bg-blood-900/40 p-4 rounded-xl border border-blood-800 flex flex-col md:flex-row gap-4 items-start md:items-center group hover:border-blood-600 transition-all hover:shadow-lg hover:shadow-blood-900/20">
                                            {movie.poster_path && (
                                                <img src={getPosterUrl(movie.poster_path, 'w92')} alt={movie.title} className="w-12 h-16 object-cover rounded hidden md:block" />
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg text-white">{movie.title}</h4>
                                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <span className="bg-blood-500/20 text-blood-300 px-2 py-0.5 rounded border border-blood-500/30">
                                                        {item.class}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromSchedule(selectedDay, item.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* MONTHLY VIEW */}
            {viewMode === 'monthly' && (
                <div className="space-y-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between bg-blood-900/50 p-4 rounded-2xl border border-blood-800">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-blood-800 rounded-full transition-colors text-white">
                            &lt; Prev
                        </button>
                        <h2 className="text-2xl font-bold text-white capitalize">{monthName} {year}</h2>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-blood-800 rounded-full transition-colors text-white">
                            Next &gt;
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="font-bold text-gray-400 py-2">{d}</div>
                        ))}
                        {calendarDays.map((day, idx) => {
                            if (!day) return <div key={idx} className="h-24 md:h-32 bg-transparent"></div>;

                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayEvents = monthlySchedule.filter(e => e.date === dateStr);
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        setIsAddingEvent(true);
                                    }}
                                    className={clsx(
                                        "h-24 md:h-32 p-2 rounded-xl border transition-all cursor-pointer hover:border-blood-500 flex flex-col items-start overflow-hidden",
                                        isToday ? "bg-blood-800/50 border-blood-500" : "bg-blood-900/30 border-blood-800"
                                    )}
                                >
                                    <span className={clsx("text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full", isToday ? "bg-blood-500 text-white" : "text-gray-400")}>
                                        {day}
                                    </span>

                                    <div className="w-full mt-1 space-y-1 overflow-y-auto custom-scrollbar">
                                        {dayEvents.map(event => (
                                            <div key={event.id} className="text-xs bg-blood-600/30 px-1.5 py-0.5 rounded text-left truncate border border-blood-600/20 group relative">
                                                <span className="text-white">{event.title}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromMonthlySchedule(event.id);
                                                    }}
                                                    className="absolute right-0 top-0 bottom-0 px-1 bg-red-500/80 text-white hidden group-hover:flex items-center justify-center"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Event Modal */}
                    {isAddingEvent && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-blood-950 border border-blood-700 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                                <h3 className="text-xl font-bold text-white mb-4">Add Event - {selectedDate}</h3>
                                <form onSubmit={handleAddEvent} className="space-y-4">
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        placeholder="Event Title"
                                        className="w-full px-4 py-2 rounded-lg bg-blood-900 border border-blood-700 focus:border-blood-500 focus:outline-none text-white"
                                        required
                                        autoFocus
                                    />
                                    <textarea
                                        value={eventDesc}
                                        onChange={(e) => setEventDesc(e.target.value)}
                                        placeholder="Description (Optional)"
                                        className="w-full px-4 py-2 rounded-lg bg-blood-900 border border-blood-700 focus:border-blood-500 focus:outline-none text-white h-24 resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingEvent(false)}
                                            className="px-4 py-2 text-gray-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blood-600 hover:bg-blood-500 text-white rounded-lg"
                                        >
                                            Add Event
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Schedule;

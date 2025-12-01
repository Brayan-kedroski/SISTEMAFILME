import React from 'react';
import { useMovies } from '../context/MovieContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, PieChart, Activity, Heart, Film, Calendar } from 'lucide-react';

const Stats = () => {
    const { movies, schedule } = useMovies();
    const { t } = useLanguage();

    const wishlistCount = movies.filter(m => m.status === 'wishlist').length;
    const downloadedCount = movies.filter(m => m.status === 'downloaded').length;
    const kidsLikedCount = movies.filter(m => m.kidsLiked).length;

    // Calculate most scheduled day
    const dayCounts = {};
    Object.keys(schedule).forEach(day => {
        dayCounts[day] = schedule[day].length;
    });
    const mostScheduledDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b, 'monday');

    return (
        <div className="space-y-8">
            <header className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                    {t('statsTitle') || 'Statistics'}
                </h1>
                <p className="text-gray-200 font-medium">{t('statsSubtitle') || 'Overview of your movie collection'}</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Movies */}
                <div className="bg-blood-900/50 p-6 rounded-2xl border border-blood-800 flex items-center gap-4 hover:border-blood-600 transition-colors">
                    <div className="p-4 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                        <Film className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-300 text-sm font-bold uppercase">{t('totalMovies') || 'Total Movies'}</p>
                        <p className="text-3xl font-bold text-white">{movies.length}</p>
                    </div>
                </div>

                {/* Downloaded */}
                <div className="bg-blood-900/50 p-6 rounded-2xl border border-blood-800 flex items-center gap-4 hover:border-blood-600 transition-colors">
                    <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-300 text-sm font-bold uppercase">{t('downloaded') || 'Downloaded'}</p>
                        <p className="text-3xl font-bold text-white">{downloadedCount}</p>
                    </div>
                </div>

                {/* Kids Liked */}
                <div className="bg-blood-900/50 p-6 rounded-2xl border border-blood-800 flex items-center gap-4 hover:border-blood-600 transition-colors">
                    <div className="p-4 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
                        <Heart className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-300 text-sm font-bold uppercase">{t('kidsLiked') || 'Kids Liked'}</p>
                        <p className="text-3xl font-bold text-white">{kidsLikedCount}</p>
                    </div>
                </div>

                {/* Busiest Day */}
                <div className="bg-blood-900/50 p-6 rounded-2xl border border-blood-800 flex items-center gap-4 hover:border-blood-600 transition-colors">
                    <div className="p-4 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-300 text-sm font-bold uppercase">{t('busiestDay') || 'Busiest Day'}</p>
                        <p className="text-xl font-bold text-white capitalize">{t(`days.${mostScheduledDay}`)}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-blood-900/30 p-6 rounded-2xl border border-blood-800/50">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <BarChart className="w-5 h-5 text-gray-300" />
                        {t('collectionStatus') || 'Collection Status'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-300">{t('wishlist') || 'Wishlist'}</span>
                                <span className="font-bold text-white">{wishlistCount}</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-2 border border-blood-800">
                                <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${(wishlistCount / movies.length) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-300">{t('downloaded') || 'Downloaded'}</span>
                                <span className="font-bold text-white">{downloadedCount}</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-2 border border-blood-800">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(downloadedCount / movies.length) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blood-900/30 p-6 rounded-2xl border border-blood-800/50">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                        <PieChart className="w-5 h-5 text-gray-300" />
                        {t('scheduleOverview') || 'Schedule Overview'}
                    </h3>
                    <div className="space-y-2">
                        {Object.keys(schedule).map(day => (
                            <div key={day} className="flex justify-between items-center p-2 hover:bg-blood-800/30 rounded transition-colors">
                                <span className="capitalize text-gray-300">{t(`days.${day}`)}</span>
                                <span className="font-bold bg-blood-800 px-2 py-0.5 rounded text-xs text-white border border-blood-700">{schedule[day].length}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;

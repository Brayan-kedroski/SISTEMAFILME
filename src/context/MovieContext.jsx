import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MovieContext = createContext();

export const useMovies = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const [movies, setMovies] = useState(() => {
        const saved = localStorage.getItem('movies');
        return saved ? JSON.parse(saved) : [];
    });

    const [schedule, setSchedule] = useState(() => {
        const saved = localStorage.getItem('schedule');
        return saved ? JSON.parse(saved) : {
            Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
        };
    });

    useEffect(() => {
        localStorage.setItem('movies', JSON.stringify(movies));
    }, [movies]);

    useEffect(() => {
        localStorage.setItem('schedule', JSON.stringify(schedule));
    }, [schedule]);

    const addMovie = (movieOrList) => {
        const moviesToAdd = Array.isArray(movieOrList) ? movieOrList : [movieOrList];

        const newMovies = moviesToAdd.map(m => {
            const title = typeof m === 'string' ? m : m.title;
            const details = typeof m === 'object' ? m : {};

            return {
                id: uuidv4(),
                title,
                status: 'wishlist',
                rating: details.rating || '',
                overview: details.overview || '',
                poster_path: details.poster_path || '',
                release_date: details.release_date || '',
            };
        });

        setMovies((prev) => [...prev, ...newMovies]);
    };

    const moveToDownloaded = (id) => {
        setMovies((prev) =>
            prev.map((movie) =>
                movie.id === id ? { ...movie, status: 'downloaded' } : movie
            )
        );
    };

    const removeMovie = (id) => {
        setMovies((prev) => prev.filter((movie) => movie.id !== id));
        // Also remove from schedule
        setSchedule(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(day => {
                next[day] = next[day].filter(entry => entry.movieId !== id);
            });
            return next;
        });
    };

    // Schedule Actions
    const addToSchedule = (day, movieId, classes = '') => {
        const movie = movies.find(m => m.id === movieId);
        if (!movie) return;

        const newEntry = {
            id: uuidv4(),
            movieId,
            title: movie.title,
            poster_path: movie.poster_path,
            classes
        };

        setSchedule(prev => ({
            ...prev,
            [day]: [...prev[day], newEntry]
        }));
    };

    const removeFromSchedule = (day, entryId) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].filter(entry => entry.id !== entryId)
        }));
    };

    const updateClasses = (day, entryId, newClasses) => {
        setSchedule(prev => ({
            ...prev,
            [day]: prev[day].map(entry =>
                entry.id === entryId ? { ...entry, classes: newClasses } : entry
            )
        }));
    };

    return (
        <MovieContext.Provider
            value={{
                movies,
                schedule,
                addMovie,
                moveToDownloaded,
                removeMovie,
                addToSchedule,
                removeFromSchedule,
                updateClasses
            }}
        >
            {children}
        </MovieContext.Provider>
    );
};

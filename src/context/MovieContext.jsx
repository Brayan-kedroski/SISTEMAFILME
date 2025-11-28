import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MovieContext = createContext();

export const useMovies = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const [movies, setMovies] = useState(() => {
        const saved = localStorage.getItem('movies');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('movies', JSON.stringify(movies));
    }, [movies]);

    const addMovie = (movieOrList) => {
        const moviesToAdd = Array.isArray(movieOrList) ? movieOrList : [movieOrList];

        const newMovies = moviesToAdd.map(m => {
            // Handle both string (old way) and object (new way)
            const title = typeof m === 'string' ? m : m.title;
            const details = typeof m === 'object' ? m : {};

            return {
                id: uuidv4(),
                title,
                status: 'wishlist',
                watchedDays: [],
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

    const toggleDay = (id, day) => {
        setMovies((prev) =>
            prev.map((movie) => {
                if (movie.id === id) {
                    const isWatched = movie.watchedDays.includes(day);
                    const newWatchedDays = isWatched
                        ? movie.watchedDays.filter((d) => d !== day)
                        : [...movie.watchedDays, day];
                    return { ...movie, watchedDays: newWatchedDays };
                }
                return movie;
            })
        );
    };

    const removeMovie = (id) => {
        setMovies((prev) => prev.filter((movie) => movie.id !== id));
    };

    return (
        <MovieContext.Provider
            value={{ movies, addMovie, moveToDownloaded, toggleDay, removeMovie }}
        >
            {children}
        </MovieContext.Provider>
    );
};

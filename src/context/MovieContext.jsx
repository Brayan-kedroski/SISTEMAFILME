import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/firebase';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    getDocs,
    writeBatch,
    getDoc
} from 'firebase/firestore';
import { getMovieDetails } from '../services/tmdb';

const MovieContext = createContext();

export const useMovies = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [movies, setMovies] = useState([]);
    const [schedule, setSchedule] = useState({
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    });
    const [loading, setLoading] = useState(true);

    // Real-time sync for Movies
    useEffect(() => {
        if (!currentUser) {
            setMovies([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, `users/${currentUser.uid}/movies`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const moviesData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id // Use Firestore ID
            }));
            setMovies(moviesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Real-time sync for Schedule
    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, `users/${currentUser.uid}/schedule`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const scheduleData = {
                Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
            };

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (scheduleData[data.day]) {
                    scheduleData[data.day].push({ ...data, id: doc.id });
                }
            });
            setSchedule(scheduleData);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Migration Logic (LocalStorage -> Firestore)
    useEffect(() => {
        if (!currentUser) return;

        const migrateData = async () => {
            // Check if Firestore is empty for this user
            const moviesSnapshot = await getDocs(collection(db, `users/${currentUser.uid}/movies`));
            if (!moviesSnapshot.empty) return; // Already has data, don't migrate

            const localMovies = JSON.parse(localStorage.getItem('movies') || '[]');
            const localSchedule = JSON.parse(localStorage.getItem('schedule') || '{}');

            if (localMovies.length === 0 && Object.keys(localSchedule).length === 0) return;

            console.log('Migrating data to Firestore...');
            const batch = writeBatch(db);

            // Migrate Movies
            localMovies.forEach(movie => {
                const docRef = doc(collection(db, `users/${currentUser.uid}/movies`));
                // Ensure no undefined values
                const cleanMovie = JSON.parse(JSON.stringify(movie));
                delete cleanMovie.id; // Let Firestore generate ID
                batch.set(docRef, cleanMovie);
            });

            // Migrate Schedule
            Object.entries(localSchedule).forEach(([day, entries]) => {
                if (Array.isArray(entries)) {
                    entries.forEach(entry => {
                        const docRef = doc(collection(db, `users/${currentUser.uid}/schedule`));
                        const cleanEntry = { ...entry, day };
                        delete cleanEntry.id;
                        batch.set(docRef, cleanEntry);
                    });
                }
            });

            await batch.commit();
            console.log('Migration complete!');
        };

        migrateData();
    }, [currentUser]);

    const addMovie = async (movieOrList) => {
        const moviesToAdd = Array.isArray(movieOrList) ? movieOrList : [movieOrList];
        const results = { added: [], skipped: [] };

        for (const m of moviesToAdd) {
            const title = typeof m === 'string' ? m : m.title;
            const details = typeof m === 'object' ? m : {};

            // Check for duplicates (case-insensitive)
            const isDuplicate = movies.some(
                existing => existing.title.toLowerCase() === title.toLowerCase()
            );

            if (isDuplicate) {
                results.skipped.push(title);
                continue;
            }

            await addDoc(collection(db, `users/${currentUser.uid}/movies`), {
                title,
                status: 'wishlist',
                rating: details.rating || '',
                overview: details.overview || '',
                poster_path: details.poster_path || '',
                release_date: details.release_date || '',
                tmdb_id: details.tmdb_id || null,
                createdAt: new Date().toISOString()
            });
            results.added.push(title);
        }
        return results;
    };

    const moveToDownloaded = async (id) => {
        if (!currentUser) return;
        const movieRef = doc(db, `users/${currentUser.uid}/movies`, id);
        await updateDoc(movieRef, { status: 'downloaded' });
    };

    const moveToWishlist = async (id) => {
        if (!currentUser) return;
        const movieRef = doc(db, `users/${currentUser.uid}/movies`, id);
        await updateDoc(movieRef, { status: 'wishlist' });
    };

    const removeMovie = async (id) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, `users/${currentUser.uid}/movies`, id));
    };

    // Schedule Actions
    const addToSchedule = async (day, movieId, classes = '') => {
        if (!currentUser) return;
        const movie = movies.find(m => m.id === movieId);
        if (!movie) return;

        await addDoc(collection(db, `users/${currentUser.uid}/schedule`), {
            day,
            movieId,
            title: movie.title,
            poster_path: movie.poster_path || '',
            classes
        });
    };

    const removeFromSchedule = async (day, entryId) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, `users/${currentUser.uid}/schedule`, entryId));
    };

    const updateClasses = async (day, entryId, newClasses) => {
        if (!currentUser) return;
        const entryRef = doc(db, `users/${currentUser.uid}/schedule`, entryId);
        await updateDoc(entryRef, { classes: newClasses });
    };

    const toggleKidsLiked = async (id, currentStatus) => {
        if (!currentUser) return;
        const movieRef = doc(db, `users/${currentUser.uid}/movies`, id);
        await updateDoc(movieRef, { kidsLiked: !currentStatus });
    };

    const translateMovies = async (targetLang) => {
        const tmdbLang = targetLang === 'pt' ? 'pt-BR' :
            targetLang === 'en' ? 'en-US' :
                targetLang === 'es' ? 'es-ES' :
                    targetLang === 'ja' ? 'ja-JP' :
                        targetLang === 'pl' ? 'pl-PL' : 'pt-BR';

        console.log(`Translating movies to ${tmdbLang}...`);

        // We process in batches of 10 to avoid rate limits
        const batchSize = 10;
        const moviesToTranslate = movies.filter(m => m.tmdb_id); // Only translate movies linked to TMDB

        for (let i = 0; i < moviesToTranslate.length; i += batchSize) {
            const chunk = moviesToTranslate.slice(i, i + batchSize);
            const batch = writeBatch(db);

            const promises = chunk.map(async (movie) => {
                const details = await getMovieDetails(movie.tmdb_id, tmdbLang);
                if (details) {
                    const movieRef = doc(db, `users/${currentUser.uid}/movies`, movie.id);
                    batch.update(movieRef, {
                        title: details.title,
                        overview: details.overview
                    });
                }
            });

            await Promise.all(promises);
            await batch.commit();
            console.log(`Translated batch ${i / batchSize + 1}`);
        }
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
                updateClasses,
                toggleKidsLiked,
                translateMovies,
                moveToWishlist,
                loading
            }}
        >
            {children}
        </MovieContext.Provider>
    );
};

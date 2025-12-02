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
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    });
    const [monthlySchedule, setMonthlySchedule] = useState([]); // Array of { date, title, ... }
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
                monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
            };

            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                // Check if the day exists in our structure (handles potential legacy data or typos)
                if (scheduleData[data.day]) {
                    scheduleData[data.day].push({ ...data, id: doc.id });
                } else {
                    // Fallback for legacy 'Mon', 'Tue' etc if necessary, or just log it
                    // For now, assuming new data uses full names. 
                    // If data.day is 'Mon', we might want to map it? 
                    // Let's just stick to the requested fix first.
                    // Actually, let's be safe and map legacy keys if they exist in DB
                    const map = { 'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday', 'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday' };
                    const normalizedDay = map[data.day] || data.day;
                    if (scheduleData[normalizedDay]) {
                        scheduleData[normalizedDay].push({ ...data, id: doc.id });
                    }
                }
            });
            setSchedule(scheduleData);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Real-time sync for Monthly Schedule
    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, `users/${currentUser.uid}/monthly_schedule`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const events = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMonthlySchedule(events);
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
                genre_ids: details.genre_ids || [],
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

    // Monthly Schedule Actions
    const addToMonthlySchedule = async (date, title, description = '') => {
        if (!currentUser) return;
        await addDoc(collection(db, `users/${currentUser.uid}/monthly_schedule`), {
            date, // YYYY-MM-DD
            title,
            description,
            createdAt: new Date().toISOString()
        });
    };

    const removeFromMonthlySchedule = async (eventId) => {
        if (!currentUser) return;
        await deleteDoc(doc(db, `users/${currentUser.uid}/monthly_schedule`, eventId));
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
                monthlySchedule,
                addToMonthlySchedule,
                removeFromMonthlySchedule,
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

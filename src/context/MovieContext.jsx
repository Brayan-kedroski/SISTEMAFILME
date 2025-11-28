import React, { createContext, useContext, useState, useEffect } from 'react';
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
    writeBatch
} from 'firebase/firestore';

const MovieContext = createContext();

export const useMovies = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {
    const [movies, setMovies] = useState([]);
    const [schedule, setSchedule] = useState({
        Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []
    });
    const [loading, setLoading] = useState(true);

    // Real-time sync for Movies
    useEffect(() => {
        const q = query(collection(db, 'movies'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const moviesData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id // Use Firestore ID
            }));
            setMovies(moviesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Real-time sync for Schedule
    useEffect(() => {
        const q = query(collection(db, 'schedule'));
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
    }, []);

    // Migration Logic (LocalStorage -> Firestore)
    useEffect(() => {
        const migrateData = async () => {
            // Check if Firestore is empty
            const moviesSnapshot = await getDocs(collection(db, 'movies'));
            if (!moviesSnapshot.empty) return; // Already has data, don't migrate

            const localMovies = JSON.parse(localStorage.getItem('movies') || '[]');
            const localSchedule = JSON.parse(localStorage.getItem('schedule') || '{}');

            if (localMovies.length === 0 && Object.keys(localSchedule).length === 0) return;

            console.log('Migrating data to Firestore...');
            const batch = writeBatch(db);

            // Migrate Movies
            localMovies.forEach(movie => {
                const docRef = doc(collection(db, 'movies'));
                // Ensure no undefined values
                const cleanMovie = JSON.parse(JSON.stringify(movie));
                delete cleanMovie.id; // Let Firestore generate ID
                batch.set(docRef, cleanMovie);
            });

            // Migrate Schedule
            Object.entries(localSchedule).forEach(([day, entries]) => {
                if (Array.isArray(entries)) {
                    entries.forEach(entry => {
                        const docRef = doc(collection(db, 'schedule'));
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
    }, []);

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

            await addDoc(collection(db, 'movies'), {
                title,
                status: 'wishlist',
                rating: details.rating || '',
                overview: details.overview || '',
                poster_path: details.poster_path || '',
                release_date: details.release_date || '',
                createdAt: new Date().toISOString()
            });
            results.added.push(title);
        }
        return results;
    };

    const moveToDownloaded = async (id) => {
        const movieRef = doc(db, 'movies', id);
        await updateDoc(movieRef, { status: 'downloaded' });
    };

    const removeMovie = async (id) => {
        await deleteDoc(doc(db, 'movies', id));
    };

    // Schedule Actions
    const addToSchedule = async (day, movieId, classes = '') => {
        const movie = movies.find(m => m.id === movieId);
        if (!movie) return;

        await addDoc(collection(db, 'schedule'), {
            day,
            movieId,
            title: movie.title,
            poster_path: movie.poster_path || '',
            classes
        });
    };

    const removeFromSchedule = async (day, entryId) => {
        await deleteDoc(doc(db, 'schedule', entryId));
    };

    const updateClasses = async (day, entryId, newClasses) => {
        const entryRef = doc(db, 'schedule', entryId);
        await updateDoc(entryRef, { classes: newClasses });
    };

    const toggleKidsLiked = async (id, currentStatus) => {
        const movieRef = doc(db, 'movies', id);
        await updateDoc(movieRef, { kidsLiked: !currentStatus });
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
                loading
            }}
        >
            {children}
        </MovieContext.Provider>
    );
};

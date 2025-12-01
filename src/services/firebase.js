import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDRnqeGpeocVybpToR6lxNpHqHGKwvN0G8",
    authDomain: "kids-movie-manager.firebaseapp.com",
    projectId: "kids-movie-manager",
    storageBucket: "kids-movie-manager.firebasestorage.app",
    messagingSenderId: "188842062628",
    appId: "1:188842062628:web:a9f8bb121cd92e12c439b1",
    measurementId: "G-MG956HVFZT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

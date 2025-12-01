import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'admin' | 'user'
    const [userStatus, setUserStatus] = useState(null); // 'pending' | 'approved' | 'rejected'
    const [loading, setLoading] = useState(true);

    const signup = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const googleSignIn = () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const sendMagicLink = (email) => {
        const actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this
            // URL must be in the authorized domains list in the Firebase Console.
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };
        return sendSignInLinkToEmail(auth, email, actionCodeSettings);
    };

    const completeMagicLinkSignIn = (email, href) => {
        return signInWithEmailLink(auth, email, href);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch user details from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role || 'user');
                    setUserStatus(userData.status || 'pending');

                    // Special case for the super admin
                    if (user.email === 'brayan900mauricio@gmail.com' && userData.role !== 'admin') {
                        await setDoc(userDocRef, { ...userData, role: 'admin', status: 'approved' }, { merge: true });
                        setUserRole('admin');
                        setUserStatus('approved');
                    }
                } else {
                    // Create initial user doc if it doesn't exist
                    const initialData = {
                        email: user.email,
                        role: user.email === 'brayan900mauricio@gmail.com' ? 'admin' : 'user',
                        status: user.email === 'brayan900mauricio@gmail.com' ? 'approved' : 'pending',
                        createdAt: new Date().toISOString()
                    };
                    await setDoc(userDocRef, initialData);
                    setUserRole(initialData.role);
                    setUserStatus(initialData.status);
                }
            } else {
                setUserRole(null);
                setUserStatus(null);
            }
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        userStatus,
        signup,
        login,
        logout,
        googleSignIn,
        sendMagicLink,
        completeMagicLinkSignIn
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

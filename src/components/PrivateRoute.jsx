import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

const PrivateRoute = ({ children }) => {
    const { currentUser, userStatus, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (userStatus === 'pending') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Account Pending Approval</h2>
                    <p className="text-slate-400 mb-6">
                        Your account is currently waiting for administrator approval.
                        You will be notified once your account is active.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                    >
                        Check Again
                    </button>
                    <button
                        onClick={async () => {
                            await signOut(auth);
                            window.location.href = '/';
                        }}
                        className="block w-full mt-4 text-sm text-slate-500 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    if (userStatus === 'rejected') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
                    <p className="text-slate-400 mb-6">
                        Your account application has been rejected.
                    </p>
                    <button
                        onClick={async () => {
                            await signOut(auth);
                            window.location.href = '/';
                        }}
                        className="px-6 py-2 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;

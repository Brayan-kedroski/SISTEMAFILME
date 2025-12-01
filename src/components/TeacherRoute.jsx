import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TeacherRoute = ({ children }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
    }

    // Allow both teachers and admins to access teacher dashboard
    if (!currentUser || (userRole !== 'teacher' && userRole !== 'admin')) {
        return <Navigate to="/" />;
    }

    return children;
};

export default TeacherRoute;

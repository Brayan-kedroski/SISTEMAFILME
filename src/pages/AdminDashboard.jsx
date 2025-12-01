import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, UserPlus, Users, Film } from 'lucide-react';

const AdminDashboard = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Pending Users
            const usersQ = query(collection(db, 'users'), where('status', '==', 'pending'));
            const usersSnapshot = await getDocs(usersQ);
            setPendingUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Suggestions
            const suggestionsQ = query(collection(db, 'suggestions'));
            const suggestionsSnapshot = await getDocs(suggestionsQ);
            setSuggestions(suggestionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: 'approved' });
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setMessage('User approved successfully!');
        } catch (error) {
            console.error("Error approving user:", error);
            setMessage('Error approving user.');
        }
    };

    const handleReject = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: 'rejected' });
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setMessage('User rejected.');
        } catch (error) {
            console.error("Error rejecting user:", error);
            setMessage('Error rejecting user.');
        }
    };

    const handlePreRegister = async (e) => {
        e.preventDefault();
        if (!newUserEmail) return;

        try {
            // Check if already exists
            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', newUserEmail));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setMessage('Email already pre-registered.');
                return;
            }

            await addDoc(collection(db, 'pre_registered_emails'), {
                email: newUserEmail,
                createdAt: new Date().toISOString(),
                used: false
            });

            setNewUserEmail('');
            setMessage(`Email ${newUserEmail} pre-registered for first access!`);
        } catch (error) {
            console.error("Error pre-registering email:", error);
            setMessage('Error pre-registering email.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Admin Dashboard
                </h1>

                {message && (
                    <div className="bg-blue-500/10 border border-blue-500/50 text-blue-400 p-4 rounded-xl mb-6">
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Pending Approvals Section */}
                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-bold">Pending Approvals</h2>
                        </div>

                        {loading ? (
                            <p className="text-slate-400">Loading...</p>
                        ) : pendingUsers.length === 0 ? (
                            <p className="text-slate-400 italic">No pending users.</p>
                        ) : (
                            <div className="space-y-4">
                                {pendingUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                        <div>
                                            <p className="font-bold">{user.email}</p>
                                            <p className="text-xs text-slate-500">Requested: {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(user.id)}
                                                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(user.id)}
                                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pre-register User Section */}
                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <UserPlus className="w-6 h-6 text-pink-500" />
                            <h2 className="text-xl font-bold">Pre-register User (First Access)</h2>
                        </div>

                        <form onSubmit={handlePreRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-400 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={newUserEmail}
                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-pink-500 focus:outline-none text-white"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Add to Allowlist
                            </button>
                        </form>
                        <p className="mt-4 text-xs text-slate-500">
                            Users added here will be able to set their password immediately upon "First Access".
                        </p>
                    </div>
                </div>

                {/* Suggestions Section */}
                <div className="mt-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Film className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-bold">Movie Suggestions</h2>
                    </div>

                    {suggestions.length === 0 ? (
                        <p className="text-slate-400 italic">No suggestions yet.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {suggestions.map(suggestion => (
                                <div key={suggestion.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <h3 className="font-bold text-lg text-yellow-400">{suggestion.title}</h3>
                                    <p className="text-sm text-slate-300 mt-1">{suggestion.reason || 'No reason provided.'}</p>
                                    <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
                                        <span>By: {suggestion.userEmail}</span>
                                        <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

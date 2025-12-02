import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { CheckCircle, XCircle, UserPlus, Users, Film, Mail, Shield, Clock, Search, Trash2, Edit, Save, X, Plus, GraduationCap, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useMovies } from '../context/MovieContext';
import { searchMovies } from '../services/tmdb';

const AdminDashboard = () => {
    const { t } = useLanguage();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [preRegisteredEmails, setPreRegisteredEmails] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, users, suggestions, add_student, classes
    const [classes, setClasses] = useState([]);
    const [newClassName, setNewClassName] = useState('');

    // Edit State
    const [editingUser, setEditingUser] = useState(null);
    const [editRole, setEditRole] = useState('');

    // Add Student State
    const [studentName, setStudentName] = useState('');
    const [studentNames, setStudentNames] = useState(''); // For batch creation
    const [studentPassword, setStudentPassword] = useState('');
    const [creatingStudent, setCreatingStudent] = useState(false);
    const [generatedId, setGeneratedId] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch All Users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllUsers(usersList);
            setPendingUsers(usersList.filter(user => user.status === 'pending'));

            // Fetch Pre-registered Emails
            const preRegSnapshot = await getDocs(collection(db, 'pre_registered_emails'));
            setPreRegisteredEmails(preRegSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Suggestions
            const suggestionsQ = query(collection(db, 'suggestions'), orderBy('createdAt', 'desc'));
            const suggestionsSnapshot = await getDocs(suggestionsQ);
            setSuggestions(suggestionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Classes
            const classesQ = query(collection(db, 'classes'), orderBy('name'));
            const classesSnapshot = await getDocs(classesQ);
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: 'approved' });
            setAllUsers(prev => prev.map(user => user.id === userId ? { ...user, status: 'approved' } : user));
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setMessage(t('userApproved'));
        } catch (error) {
            console.error("Error approving user:", error);
            setMessage(t('errorApproving'));
        }
    };

    const handleReject = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), { status: 'rejected' });
            setAllUsers(prev => prev.map(user => user.id === userId ? { ...user, status: 'rejected' } : user));
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setMessage(t('userRejected'));
        } catch (error) {
            console.error("Error rejecting user:", error);
            setMessage(t('errorRejecting'));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm(t('confirmDelete'))) return;

        try {
            await deleteDoc(doc(db, 'users', userId));
            setAllUsers(prev => prev.filter(user => user.id !== userId));
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            setMessage(t('userDeleted'));
        } catch (error) {
            console.error("Error deleting user:", error);
            setMessage(t('errorDeleting'));
        }
    };

    const startEditing = (user) => {
        setEditingUser(user);
        setEditRole(user.role || 'user');
    };

    const saveEdit = async () => {
        if (!editingUser) return;

        try {
            await updateDoc(doc(db, 'users', editingUser.id), { role: editRole });
            setAllUsers(prev => prev.map(user => user.id === editingUser.id ? { ...user, role: editRole } : user));
            setEditingUser(null);
            setMessage(t('userUpdated'));
        } catch (error) {
            console.error("Error updating user:", error);
            setMessage(t('errorUpdating'));
        }
    };

    const { addMovie } = useMovies();

    const handleAddToWishlist = async (suggestion) => {
        if (!suggestion.title) return;
        setMessage(`${t('searching') || 'Searching'}: "${suggestion.title}"...`);

        try {
            const results = await searchMovies(suggestion.title, 'pt-BR');

            if (results && results.length > 0) {
                const movie = results[0];
                const result = await addMovie({
                    title: movie.title,
                    overview: movie.overview,
                    rating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
                    poster_path: movie.poster_path,
                    release_date: movie.release_date,
                    tmdb_id: movie.id
                });

                if (result.skipped.length > 0) {
                    setMessage(t('duplicateWarning') || `Movie already in wishlist: ${movie.title}`);
                } else {
                    setMessage(`${t('movieAdded') || 'Movie added'}: ${movie.title}`);
                }
            } else {
                setMessage(t('noResults') || 'Movie not found on TMDB.');
            }
        } catch (error) {
            console.error("Error adding to wishlist:", error);
            setMessage(t('errorAdding') || 'Error adding movie.');
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (!newClassName) return;
        try {
            const docRef = await addDoc(collection(db, 'classes'), {
                name: newClassName,
                createdAt: new Date().toISOString()
            });
            setClasses(prev => [...prev, { id: docRef.id, name: newClassName }]);
            setNewClassName('');
            setMessage('Class created successfully!');
        } catch (error) {
            console.error("Error creating class:", error);
            setMessage('Error creating class.');
        }
    };

    const handleDeleteClass = async (classId) => {
        if (!window.confirm('Delete this class? This will DELETE ALL STUDENTS in this class!')) return;

        try {
            // 1. Find all students in this class
            const q = query(collection(db, 'users'), where('studentClass', '==', classes.find(c => c.id === classId)?.name));
            const snapshot = await getDocs(q);

            // 2. Delete each student (from Firestore 'users' collection)
            // Note: This only deletes from Firestore. Deleting from Auth requires Admin SDK or Cloud Functions.
            // For this client-side demo, we'll just delete the Firestore record which effectively removes them from the app.
            const batch = [];
            snapshot.docs.forEach(doc => {
                deleteDoc(doc.ref);
            });

            // 3. Delete the class itself
            await deleteDoc(doc(db, 'classes', classId));

            setClasses(prev => prev.filter(c => c.id !== classId));
            setMessage('Class and all its students deleted.');
        } catch (error) {
            console.error("Error deleting class:", error);
            setMessage('Error deleting class.');
        }
    };

    const handlePreRegister = async (e) => {
        e.preventDefault();
        if (!newUserEmail) return;

        try {
            const q = query(collection(db, 'pre_registered_emails'), where('email', '==', newUserEmail));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                setMessage(t('emailAlreadyExists'));
                return;
            }

            const newDocRef = await addDoc(collection(db, 'pre_registered_emails'), {
                email: newUserEmail,
                createdAt: new Date().toISOString(),
                used: false
            });

            setPreRegisteredEmails(prev => [...prev, { id: newDocRef.id, email: newUserEmail, createdAt: new Date().toISOString(), used: false }]);
            setNewUserEmail('');
            setMessage(t('emailPreRegistered'));
        } catch (error) {
            console.error("Error pre-registering email:", error);
            setMessage(t('errorPreRegistering'));
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!studentNames || !studentPassword || !selectedClass) return;

        setCreatingStudent(true);
        setMessage(t('creatingStudent') || 'Creating students...');
        setGeneratedId('');

        // Parse names: split by newline, trim, remove empty
        const namesList = studentNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);

        if (namesList.length === 0) {
            setCreatingStudent(false);
            return;
        }

        // Initialize secondary app
        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        const createdIds = [];
        let successCount = 0;
        let failCount = 0;

        try {
            for (const name of namesList) {
                // Generate Login ID
                const cleanName = name.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const loginId = `${cleanName}.${randomSuffix}`;
                const fakeEmail = `${loginId}@escola.com`;

                try {
                    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, studentPassword);
                    const user = userCredential.user;

                    await setDoc(doc(db, "users", user.uid), {
                        email: fakeEmail,
                        loginId: loginId,
                        name: name,
                        role: 'student',
                        studentClass: selectedClass,
                        status: 'approved',
                        createdAt: new Date().toISOString(),
                        photoURL: null
                    });

                    createdIds.push(`${name}: ${loginId}`);
                    successCount++;
                } catch (err) {
                    console.error(`Error creating ${name}:`, err);
                    failCount++;
                }
            }

            await signOut(secondaryAuth);

            setMessage(`Created ${successCount} students. Failed: ${failCount}`);
            setGeneratedId(createdIds.join('\n'));
            setStudentNames('');
            // Keep password for convenience if adding more batches? Or clear it? Let's clear it.
            // setStudentPassword(''); 

            fetchData();

        } catch (error) {
            console.error("Error in batch creation:", error);
            setMessage(`Error: ${error.message}`);
        } finally {
            setCreatingStudent(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all`}
            style={{
                backgroundColor: activeTab === id ? 'var(--text-secondary)' : 'var(--bg-surface)',
                color: activeTab === id ? 'var(--bg-main)' : 'var(--text-primary)',
                opacity: activeTab === id ? 1 : 0.7
            }}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen p-6 pb-24 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {t('adminDashboard')}
                    </h1>

                    <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <TabButton id="overview" label={t('pendingApprovals')} icon={Shield} />
                        <TabButton id="users" label={t('allUsers')} icon={Users} />
                        <TabButton id="classes" label="Classes" icon={BookOpen} />
                        <TabButton id="suggestions" label={t('movieSuggestions')} icon={Film} />
                        <TabButton id="add_student" label={t('addStudent') || 'Add Student'} icon={GraduationCap} />
                    </div>
                </div>

                {message && (
                    <div className="p-4 rounded-xl mb-8 animate-fade-in border" style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)', backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--text-secondary)' }}></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* OVERVIEW TAB - Pending Approvals & Pre-register */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Pending Approvals */}
                                <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                            <Users className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <h2 className="text-xl font-bold">{t('pendingApprovals')}</h2>
                                        <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(255, 215, 0, 0.2)', color: 'var(--text-secondary)' }}>
                                            {pendingUsers.length}
                                        </span>
                                    </div>

                                    {pendingUsers.length === 0 ? (
                                        <div className="text-center py-10 opacity-50">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                                            <p>{t('noPendingUsers')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingUsers.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border transition-colors" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                    <div>
                                                        <p className="font-bold">{user.email}</p>
                                                        <p className="text-xs opacity-70">{t('joined')}: {new Date(user.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprove(user.id)}
                                                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                                                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                                                            title={t('approve')}
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(user.id)}
                                                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                                                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                                                            title={t('reject')}
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pre-register User */}
                                <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                            <UserPlus className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <h2 className="text-xl font-bold">{t('addUser')}</h2>
                                    </div>

                                    <form onSubmit={handlePreRegister} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2 opacity-70">{t('emailAddress')}</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
                                                <input
                                                    type="email"
                                                    value={newUserEmail}
                                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none transition-colors"
                                                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                    placeholder="user@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3 font-bold rounded-xl transition-colors shadow-lg hover:opacity-90"
                                            style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                        >
                                            {t('addToAllowlist')}
                                        </button>
                                    </form>

                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider opacity-70">{t('preRegisteredEmails')}</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {preRegisteredEmails.length === 0 ? (
                                                <p className="text-sm italic opacity-50">{t('noPreRegistered')}</p>
                                            ) : (
                                                preRegisteredEmails.map(emailDoc => (
                                                    <div key={emailDoc.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                        <span className="text-sm">{emailDoc.email}</span>
                                                        {emailDoc.used ? (
                                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>Used</span>
                                                        ) : (
                                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>Available</span>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* USERS TAB - All Users List */}
                        {activeTab === 'users' && (
                            <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                            <Users className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <h2 className="text-xl font-bold">{t('allUsers')}</h2>
                                    </div>
                                    <div className="text-sm px-4 py-2 rounded-lg border opacity-70" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                        {t('passwordNote')}
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b text-sm uppercase opacity-70" style={{ borderColor: 'var(--border)' }}>
                                                <th className="p-4 font-bold">{t('emailAddress')}</th>
                                                <th className="p-4 font-bold">{t('role')}</th>
                                                <th className="p-4 font-bold">{t('status')}</th>
                                                <th className="p-4 font-bold">{t('joined')}</th>
                                                <th className="p-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {allUsers.map(user => (
                                                <tr key={user.id} className="hover:opacity-80 transition-colors">
                                                    <td className="p-4 font-medium">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{user.name || 'No Name'}</span>
                                                            <span className="text-xs opacity-70">{user.email}</span>
                                                            {user.loginId && (
                                                                <span className="text-xs text-blue-400 font-mono mt-1">ID: {user.loginId}</span>
                                                            )}
                                                        </div>
                                                        {user.email === 'brayan900mauricio@gmail.com' && (
                                                            <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', color: 'var(--text-secondary)', borderColor: 'var(--text-secondary)' }}>Super Admin</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                                                            {user.role === 'admin' ? t('admin') : user.role === 'teacher' ? t('teacher') : t('student')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${user.status === 'approved' ? 'text-green-400 bg-green-500/20' :
                                                            user.status === 'rejected' ? 'text-red-400 bg-red-500/20' :
                                                                'text-yellow-400 bg-yellow-500/20'
                                                            }`}>
                                                            {user.status || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm opacity-70">
                                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {user.email !== 'brayan900mauricio@gmail.com' && (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => startEditing(user)}
                                                                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                                                                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                                                                    title={t('edit')}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                                                                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                                                                    title={t('delete')}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* CLASSES TAB */}
                        {activeTab === 'classes' && (
                            <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <BookOpen className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <h2 className="text-xl font-bold">Manage Classes</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="font-bold mb-4 opacity-70">Create New Class</h3>
                                        <form onSubmit={handleCreateClass} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newClassName}
                                                onChange={(e) => setNewClassName(e.target.value)}
                                                placeholder="Class Name (e.g. 1A)"
                                                className="flex-1 p-3 rounded-xl border bg-transparent"
                                                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                            />
                                            <button
                                                type="submit"
                                                className="px-6 py-3 rounded-xl font-bold transition-colors"
                                                style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                            >
                                                Add
                                            </button>
                                        </form>
                                    </div>

                                    <div>
                                        <h3 className="font-bold mb-4 opacity-70">Existing Classes</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                            {classes.length === 0 ? (
                                                <p className="opacity-50 italic">No classes created yet.</p>
                                            ) : (
                                                classes.map(cls => (
                                                    <div key={cls.id} className="flex justify-between items-center p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                        <span className="font-bold">{cls.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteClass(cls.id)}
                                                            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUGGESTIONS TAB */}
                        {activeTab === 'suggestions' && (
                            <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <Film className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <h2 className="text-xl font-bold">{t('movieSuggestions')}</h2>
                                </div>

                                {suggestions.length === 0 ? (
                                    <div className="text-center py-10 opacity-50">
                                        <Film className="w-12 h-12 mx-auto mb-3" />
                                        <p>{t('noSuggestions')}</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {suggestions.map(suggestion => (
                                            <div key={suggestion.id} className="p-5 rounded-2xl border transition-all group" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                <h3 className="font-bold text-lg group-hover:opacity-80 transition-colors" style={{ color: 'var(--text-primary)' }}>{suggestion.title}</h3>
                                                <p className="text-sm mt-2 italic opacity-70">"{suggestion.reason || 'No reason provided.'}"</p>
                                                <div className="mt-4 pt-4 border-t flex flex-col gap-1 text-xs opacity-50" style={{ borderColor: 'var(--border)' }}>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{suggestion.userEmail}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddToWishlist(suggestion)}
                                                    className="mt-4 w-full py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                                    style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {t('addToWishlist') || 'Add to Wishlist'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ADD STUDENT TAB */}
                        {activeTab === 'add_student' && (
                            <div className="backdrop-blur-md border rounded-3xl p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <GraduationCap className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <h2 className="text-xl font-bold">{t('addStudent') || 'Add Student'}</h2>
                                </div>

                                {generatedId && (
                                    <div className="p-6 rounded-xl mb-8 animate-fade-in border border-green-500/50 bg-green-500/10 text-center">
                                        <h3 className="text-xl font-bold text-green-400 mb-2">{t('studentCreatedWithId') || 'Students Created!'}</h3>
                                        <p className="text-gray-300 mb-2">{t('loginIdLabel') || 'Login IDs:'}</p>
                                        <div className="text-sm font-mono font-bold text-white bg-black/30 p-4 rounded-xl inline-block select-all whitespace-pre-wrap text-left">
                                            {generatedId}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-2">{t('saveIdWarning') || 'Save this ID. The student needs it to login.'}</p>
                                    </div>
                                )}

                                <form onSubmit={handleCreateStudent} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 opacity-70">{t('studentName') || 'Student Names (One per line)'}</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
                                            <textarea
                                                value={studentNames}
                                                onChange={(e) => setStudentNames(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none transition-colors h-32 resize-none"
                                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                placeholder="Joao Silva&#10;Maria Santos&#10;Pedro Oliveira"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 opacity-70">Class (Turma)</label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
                                            <select
                                                value={selectedClass}
                                                onChange={(e) => setSelectedClass(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none transition-colors appearance-none"
                                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                required
                                            >
                                                <option value="">Select a Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 opacity-70">{t('password') || 'Password'}</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
                                            <input
                                                type="password"
                                                value={studentPassword}
                                                onChange={(e) => setStudentPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none transition-colors"
                                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                placeholder="******"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={creatingStudent}
                                        className="w-full py-3 font-bold rounded-xl transition-colors shadow-lg hover:opacity-90 flex justify-center items-center gap-2"
                                        style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                    >
                                        {creatingStudent ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                {t('creating') || 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                {t('createStudent') || 'Create Students'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">{t('edit')}</h3>
                                <button onClick={() => setEditingUser(null)} className="hover:opacity-70">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm opacity-70 mb-2">{t('emailAddress')}</p>
                                <p className="text-lg font-bold">{editingUser.email}</p>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-bold opacity-70 mb-2">{t('selectRole')}</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {['user', 'teacher', 'admin'].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setEditRole(role)}
                                            className={`p-3 rounded-xl border text-left transition-all`}
                                            style={{
                                                backgroundColor: editRole === role ? 'rgba(255, 215, 0, 0.1)' : 'var(--bg-main)',
                                                borderColor: editRole === role ? 'var(--text-secondary)' : 'var(--border)',
                                                color: editRole === role ? 'var(--text-secondary)' : 'var(--text-primary)'
                                            }}
                                        >
                                            <span className="font-bold block">{t(role === 'user' ? 'student' : role)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-3 font-bold rounded-xl transition-colors hover:opacity-80"
                                    style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)' }}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 py-3 font-bold rounded-xl transition-colors shadow-lg hover:opacity-90"
                                    style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

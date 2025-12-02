import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, Timestamp, setDoc, doc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Users, ClipboardList, GraduationCap, Save, CheckCircle, Calendar, UserPlus, Mail, Shield } from 'lucide-react';

const TeacherDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('attendance'); // attendance, grades, add_student
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({}); // { studentId: boolean }

    // Grades State
    const [grades, setGrades] = useState({}); // { studentId: score }
    const [gradeSubject, setGradeSubject] = useState('');
    const [gradeType, setGradeType] = useState('exam'); // exam, homework, participation

    // Add Student State
    const [studentName, setStudentName] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [creatingStudent, setCreatingStudent] = useState(false);
    const [generatedId, setGeneratedId] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            // Fetch both 'student' and 'user' roles
            const qStudent = query(collection(db, 'users'), where('role', '==', 'student'));
            const qUser = query(collection(db, 'users'), where('role', '==', 'user'));

            const [snapshotStudent, snapshotUser] = await Promise.all([getDocs(qStudent), getDocs(qUser)]);

            const studentsList = [
                ...snapshotStudent.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                ...snapshotUser.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            ];

            // Remove duplicates if any (though roles should be unique)
            const uniqueStudents = Array.from(new Map(studentsList.map(item => [item.id, item])).values());

            setStudents(uniqueStudents);

            // Initialize attendance state
            const initialAttendance = {};
            uniqueStudents.forEach(s => initialAttendance[s.id] = false);
            setAttendance(initialAttendance);

        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const saveAttendance = async () => {
        setLoading(true);
        try {
            await addDoc(collection(db, 'attendance'), {
                date: attendanceDate,
                teacherId: currentUser.uid,
                teacherEmail: currentUser.email,
                records: attendance,
                createdAt: new Date().toISOString()
            });
            setMessage(t('attendanceSaved') || 'Attendance saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving attendance:", error);
            setMessage(t('errorSaving') || 'Error saving data.');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (studentId, value) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: value
        }));
    };

    const saveGrades = async () => {
        if (!gradeSubject) {
            setMessage(t('enterSubject') || 'Please enter a subject.');
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, 'grades'), {
                subject: gradeSubject,
                type: gradeType,
                teacherId: currentUser.uid,
                teacherEmail: currentUser.email,
                scores: grades,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            setMessage(t('gradesSaved') || 'Grades saved successfully!');
            setGrades({});
            setGradeSubject('');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving grades:", error);
            setMessage(t('errorSaving') || 'Error saving data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        if (!studentName || !studentPassword) return;

        setCreatingStudent(true);
        setMessage(t('creatingStudent') || 'Creating student...');
        setGeneratedId('');

        // Generate Login ID: firstname.lastname.random4
        const cleanName = studentName.toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const loginId = `${cleanName}.${randomSuffix}`;
        const fakeEmail = `${loginId}@escola.com`;

        // Initialize secondary app to create user without logging out teacher
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryTeacher");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, studentPassword);
            const user = userCredential.user;

            // Create user document in Firestore (using main app's db)
            await setDoc(doc(db, "users", user.uid), {
                email: fakeEmail, // Still need email for Firebase
                loginId: loginId, // The ID student will use
                name: studentName,
                role: 'student',
                status: 'approved',
                createdAt: new Date().toISOString(),
                photoURL: null
            });

            // Sign out from secondary app to clean up
            await signOut(secondaryAuth);

            setMessage(t('studentCreated') || 'Student created successfully!');
            setGeneratedId(loginId); // Show the ID to teacher
            setStudentName('');
            setStudentPassword('');

            // Refresh students list
            fetchStudents();

        } catch (error) {
            console.error("Error creating student:", error);
            setMessage(`${t('errorCreatingStudent') || 'Error creating student'}: ${error.message}`);
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
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {t('teacherDashboard') || 'Teacher Dashboard'}
                    </h1>

                    <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <TabButton id="attendance" label={t('attendance') || 'Attendance'} icon={ClipboardList} />
                        <TabButton id="grades" label={t('grades') || 'Grades'} icon={GraduationCap} />
                        <TabButton id="add_student" label={t('addStudent') || 'Add Student'} icon={UserPlus} />
                    </div>
                </div>

                {message && (
                    <div className="p-4 rounded-xl mb-8 animate-fade-in border flex items-center gap-2" style={{ borderColor: 'var(--text-secondary)', color: 'var(--text-secondary)', backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                        <CheckCircle className="w-5 h-5" />
                        {message}
                    </div>
                )}

                {generatedId && (
                    <div className="p-6 rounded-xl mb-8 animate-fade-in border border-green-500/50 bg-green-500/10 text-center">
                        <h3 className="text-xl font-bold text-green-400 mb-2">{t('studentCreatedWithId') || 'Student Created!'}</h3>
                        <p className="text-gray-300 mb-2">{t('loginIdLabel') || 'Login ID:'}</p>
                        <div className="text-3xl font-mono font-bold text-white bg-black/30 p-4 rounded-xl inline-block select-all">
                            {generatedId}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{t('saveIdWarning') || 'Save this ID. The student needs it to login.'}</p>
                    </div>
                )}

                {loading && students.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--text-secondary)' }}></div>
                    </div>
                ) : (
                    <div className="backdrop-blur-md border rounded-3xl p-6 shadow-xl" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

                        {/* ATTENDANCE TAB */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <ClipboardList className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t('takeAttendance') || 'Take Attendance'}</h2>
                                        <p className="text-sm opacity-70">{t('markPresentStudents') || 'Mark students who are present.'}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <input
                                            type="date"
                                            value={attendanceDate}
                                            onChange={(e) => setAttendanceDate(e.target.value)}
                                            className="p-2 rounded-lg border bg-transparent"
                                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => handleAttendanceChange(student.id)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${attendance[student.id] ? 'ring-2' : ''}`}
                                            style={{
                                                backgroundColor: attendance[student.id] ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-main)',
                                                borderColor: attendance[student.id] ? '#22c55e' : 'var(--border)',
                                                ringColor: '#22c55e'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${attendance[student.id] ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                                    {student.name ? student.name.charAt(0).toUpperCase() : student.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-bold truncate">{student.name || student.email}</p>
                                                    <p className="text-xs opacity-50 capitalize">{student.loginId || student.role}</p>
                                                </div>
                                            </div>
                                            {attendance[student.id] && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t mt-6" style={{ borderColor: 'var(--border)' }}>
                                    <button
                                        onClick={saveAttendance}
                                        disabled={loading}
                                        className="w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg ml-auto"
                                        style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                    >
                                        {loading ? 'Saving...' : <><Save className="w-5 h-5" /> {t('saveAttendance') || 'Save Attendance'}</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* GRADES TAB */}
                        {activeTab === 'grades' && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                            <GraduationCap className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{t('launchGrades') || 'Launch Grades'}</h2>
                                            <p className="text-sm opacity-70">{t('enterGradesDesc') || 'Enter scores for each student.'}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-3 ml-auto w-full md:w-auto">
                                        <input
                                            type="text"
                                            placeholder={t('subject') || "Subject (e.g. Math)"}
                                            value={gradeSubject}
                                            onChange={(e) => setGradeSubject(e.target.value)}
                                            className="p-2 rounded-lg border bg-transparent w-full md:w-48"
                                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                        />
                                        <select
                                            value={gradeType}
                                            onChange={(e) => setGradeType(e.target.value)}
                                            className="p-2 rounded-lg border bg-transparent"
                                            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-main)' }}
                                        >
                                            <option value="exam">{t('exam') || 'Exam'}</option>
                                            <option value="homework">{t('homework') || 'Homework'}</option>
                                            <option value="participation">{t('participation') || 'Participation'}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            className="p-4 rounded-xl border flex items-center justify-between"
                                            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-gray-300">
                                                    {student.name ? student.name.charAt(0).toUpperCase() : student.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{student.name || student.email}</p>
                                                    <p className="text-xs opacity-50">{student.loginId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm opacity-70 mr-2">{t('grade') || 'Grade'}:</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.1"
                                                    value={grades[student.id] || ''}
                                                    onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                                    className="w-20 p-2 rounded-lg border bg-transparent text-center font-bold"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                    placeholder="0.0"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t mt-6" style={{ borderColor: 'var(--border)' }}>
                                    <button
                                        onClick={saveGrades}
                                        disabled={loading}
                                        className="w-full md:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 shadow-lg ml-auto"
                                        style={{ backgroundColor: 'var(--text-secondary)', color: 'var(--bg-main)' }}
                                    >
                                        {loading ? 'Saving...' : <><Save className="w-5 h-5" /> {t('saveGrades') || 'Save Grades'}</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ADD STUDENT TAB */}
                        {activeTab === 'add_student' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <UserPlus className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t('addStudent') || 'Add Student'}</h2>
                                        <p className="text-sm opacity-70">{t('createStudentAccount') || 'Create a new student account.'}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleCreateStudent} className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 opacity-70">{t('studentName') || 'Student Name'}</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-3.5 w-5 h-5 opacity-50" />
                                            <input
                                                type="text"
                                                value={studentName}
                                                onChange={(e) => setStudentName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none transition-colors"
                                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                                                placeholder="Ex: Joao Silva"
                                                required
                                            />
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
                                                {t('createStudent') || 'Create Student'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;

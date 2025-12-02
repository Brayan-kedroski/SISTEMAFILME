import React, { useState, useEffect } from 'react';
import { db, firebaseConfig } from '../services/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, Timestamp, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Users, ClipboardList, GraduationCap, Save, CheckCircle, Calendar, UserPlus, Mail, Shield, Trash2, Edit, BookOpen, Clock, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

const TeacherDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('attendance'); // attendance, grades, add_student
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState('all');
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
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedClass === 'all') {
            setFilteredStudents(students);
        } else {
            setFilteredStudents(students.filter(s => s.studentClass === selectedClass));
        }
    }, [selectedClass, students]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Classes
            const classesQ = query(collection(db, 'classes'), orderBy('name'));
            const classesSnapshot = await getDocs(classesQ);
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            // Fetch Students
            await fetchStudents();
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

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
            setFilteredStudents(uniqueStudents); // Initialize filtered list

            // Initialize attendance state
            const initialAttendance = {};
            uniqueStudents.forEach(s => initialAttendance[s.id] = false);
            setAttendance(initialAttendance);

        } catch (error) {
            console.error("Error fetching students:", error);
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
            setMessage(`${t('errorSaving') || 'Error saving data'}: ${error.message}`);
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

    const [gradesHistory, setGradesHistory] = useState([]);
    const [editingGrade, setEditingGrade] = useState(null); // { id, ...data }

    // Daily Report State
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState({ attendance: [], grades: [] });

    const [generatingReport, setGeneratingReport] = useState(false);
    const [debugData, setDebugData] = useState({ allAttendance: [], allGrades: [], error: null }); // DEBUG

    useEffect(() => {
        if (activeTab === 'history') {
            fetchGradesHistory();
        }
        if (activeTab === 'report') {
            fetchDailyReport();
        }
    }, [activeTab, reportDate]);

    const fetchDailyReport = async () => {
        setGeneratingReport(true);
        try {
            // 1. Fetch Attendance for the date
            const qAttendance = query(
                collection(db, 'attendance'),
                where('date', '==', reportDate),
                where('teacherId', '==', currentUser.uid)
            );
            const attendanceSnapshot = await getDocs(qAttendance);
            const attendanceDocs = attendanceSnapshot.docs.map(doc => doc.data());

            // 2. Fetch Grades created on that date (approximate by string match or range if needed, but simple date string match for now if stored)
            // Note: Grades are stored with 'date' field which is ISO string. We need to filter client side or use range query.
            // Let's use the 'date' field in grades which seems to be ISO. We'll filter client side for simplicity if volume is low, or better, query by range.
            // Actually, I see `date: new Date().toISOString()` in saveGrades.
            // Let's query all grades for this teacher and filter by date string match (YYYY-MM-DD).

            // Optimization: Query by range for the day
            const startOfDay = new Date(reportDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(reportDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Optimization: Fetch all grades for teacher and filter client-side to avoid Composite Index requirement
            const qGrades = query(
                collection(db, 'grades'),
                where('teacherId', '==', currentUser.uid)
            );
            const gradesSnapshot = await getDocs(qGrades);
            const gradesDocs = gradesSnapshot.docs
                .map(doc => doc.data())
                .filter(g => {
                    return g.createdAt >= startOfDay.toISOString() && g.createdAt <= endOfDay.toISOString();
                });

            setReportData({
                attendance: attendanceDocs,
                grades: gradesDocs
            });

            // DEBUG: Fetch all data for teacher to see what's wrong
            const qAllAtt = query(collection(db, 'attendance'), where('teacherId', '==', currentUser.uid));
            const allAttSnap = await getDocs(qAllAtt);

            const qAllGrades = query(collection(db, 'grades'), where('teacherId', '==', currentUser.uid));
            const allGradesSnap = await getDocs(qAllGrades);

            // Sort client-side
            const allAtt = allAttSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const allGrades = allGradesSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setDebugData({
                allAttendance: allAtt,
                allGrades: allGrades,
                error: null
            });

        } catch (error) {
            console.error("Error fetching report:", error);
            setDebugData(prev => ({ ...prev, error: error.message }));
        } finally {
            setGeneratingReport(false);
        }
    };

    const fetchGradesHistory = async () => {
        try {
            // Optimization: Remove orderBy to avoid Composite Index requirement
            const q = query(collection(db, 'grades'), where('teacherId', '==', currentUser.uid));
            const snapshot = await getDocs(q);
            // Client-side sort
            const grades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            grades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setGradesHistory(grades);
        } catch (error) {
            console.error("Error fetching grades history:", error);
        }
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
            fetchGradesHistory(); // Refresh list
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving grades:", error);
            setMessage(`${t('errorSaving') || 'Error saving data'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGrade = async (gradeId, studentId, newScore) => {
        try {
            const gradeDoc = gradesHistory.find(g => g.id === gradeId);
            if (!gradeDoc) return;

            const updatedScores = { ...gradeDoc.scores, [studentId]: newScore };

            await updateDoc(doc(db, 'grades', gradeId), {
                scores: updatedScores
            });

            setGradesHistory(prev => prev.map(g => g.id === gradeId ? { ...g, scores: updatedScores } : g));
            setMessage('Grade updated!');
            setTimeout(() => setMessage(''), 2000);
        } catch (error) {
            console.error("Error updating grade:", error);
            setMessage('Error updating grade.');
        }
    };

    const handleDeleteGradeReport = async (gradeId) => {
        if (!window.confirm('Delete this grade report?')) return;
        try {
            await deleteDoc(doc(db, 'grades', gradeId));
            setGradesHistory(prev => prev.filter(g => g.id !== gradeId));
            setMessage('Report deleted.');
        } catch (error) {
            console.error("Error deleting report:", error);
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

    const generatePDF = (type) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text('ERP Escola - Relatório', 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Professor: ${currentUser.email}`, 14, 30);
            doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 36);

            if (type === 'history') {
                doc.text('Histórico de Notas', 14, 45);

                const tableColumn = ["Data", "Matéria", "Tipo", "Aluno", "Nota"];
                const tableRows = [];

                gradesHistory.forEach(grade => {
                    Object.entries(grade.scores).forEach(([studentId, score]) => {
                        const student = students.find(s => s.id === studentId);
                        if (student) {
                            const gradeDate = new Date(grade.createdAt).toLocaleDateString();
                            const gradeData = [
                                gradeDate,
                                grade.subject,
                                grade.type,
                                student.name || student.email,
                                score
                            ];
                            tableRows.push(gradeData);
                        }
                    });
                });

                autoTable(doc, {
                    head: [tableColumn],
                    body: tableRows,
                    startY: 50,
                });

                // Open in new tab
                console.log("Opening PDF for history...");
                const pdfData = doc.output('arraybuffer');
                const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
                const url = URL.createObjectURL(pdfBlob);
                window.open(url, '_blank');
            } else if (type === 'report') {
                doc.text(`Relatório Diário - ${reportDate}`, 14, 45);

                // Attendance Table
                doc.text('Presença', 14, 55);
                const attColumn = ["Aluno", "Status"];
                const attRows = [];

                if (reportData.attendance && reportData.attendance.length > 0) {
                    reportData.attendance.forEach(record => {
                        Object.entries(record.attendance).forEach(([studentId, present]) => {
                            const student = students.find(s => s.id === studentId);
                            if (student) {
                                attRows.push([student.name || student.email, present ? 'Presente' : 'Ausente']);
                            }
                        });
                    });
                }

                autoTable(doc, {
                    head: [attColumn],
                    body: attRows,
                    startY: 60,
                });

                // Grades Table
                const finalY = doc.lastAutoTable.finalY || 60;
                doc.text('Notas', 14, finalY + 10);

                const gradeColumn = ["Matéria", "Aluno", "Nota"];
                const gradeRows = [];

                if (reportData.grades && reportData.grades.length > 0) {
                    reportData.grades.forEach(grade => {
                        Object.entries(grade.scores).forEach(([studentId, score]) => {
                            const student = students.find(s => s.id === studentId);
                            if (student) {
                                gradeRows.push([grade.subject, student.name || student.email, score]);
                            }
                        });
                    });
                }

                autoTable(doc, {
                    head: [gradeColumn],
                    body: gradeRows,
                    startY: finalY + 15,
                });

                // Open in new tab
                console.log("Opening PDF for report...");
                const pdfData = doc.output('arraybuffer');
                const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
                const url = URL.createObjectURL(pdfBlob);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Erro ao gerar PDF: " + error.message);
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
                <div className="flex flex-col gap-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                            {t('teacherDashboard') || 'Teacher Dashboard'}
                        </h1>

                        <div className="relative group w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer w-full md:w-auto">
                                <BookOpen className="w-4 h-4 text-yellow-500" />
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer appearance-none pr-8 w-full md:min-w-[180px]"
                                >
                                    <option value="all" className="bg-slate-800 text-white">Todas as Turmas</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.name} className="bg-slate-800 text-white">{cls.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pb-2 border-b border-gray-800">
                        <TabButton id="attendance" label={t('attendance') || 'Attendance'} icon={ClipboardList} />
                        <TabButton id="grades" label={t('launchGradesTab') || 'Launch Grades'} icon={GraduationCap} />
                        <TabButton id="history" label={t('history') || 'History'} icon={Clock} />
                        <TabButton id="report" label={t('dailyReport') || 'Daily Report'} icon={Calendar} />
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
                                    {filteredStudents.map(student => (
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
                                    {filteredStudents.map(student => (
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



                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <Clock className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t('gradesHistory') || 'Grades History'}</h2>
                                        <p className="text-sm opacity-70">{t('gradesHistoryDesc') || 'View all grades launched.'}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <button
                                            onClick={() => generatePDF('history')}
                                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-gray-300 hover:text-white flex items-center gap-2"
                                            title={t('downloadPDF') || 'Download PDF'}
                                        >
                                            <FileDown className="w-5 h-5" />
                                            <span className="hidden md:inline text-sm font-bold">{t('downloadPDF') || 'Download PDF'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="hidden md:block bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase tracking-wider opacity-70">
                                                    <th className="p-4">Date</th>
                                                    <th className="p-4">Subject</th>
                                                    <th className="p-4">Type</th>
                                                    <th className="p-4">Student</th>
                                                    <th className="p-4">Grade</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {gradesHistory.map((grade) => (
                                                    <React.Fragment key={grade.id}>
                                                        {Object.entries(grade.scores).map(([studentId, score]) => {
                                                            const student = students.find(s => s.id === studentId);
                                                            if (!student) return null;
                                                            return (
                                                                <tr key={`${grade.id}-${studentId}`} className="hover:bg-slate-700/30 transition-colors">
                                                                    <td className="p-4 text-sm whitespace-nowrap">
                                                                        {new Date(grade.createdAt).toLocaleDateString()}
                                                                        <span className="block text-xs opacity-50">{new Date(grade.createdAt).toLocaleTimeString()}</span>
                                                                    </td>
                                                                    <td className="p-4 font-bold text-yellow-500">{grade.subject}</td>
                                                                    <td className="p-4">
                                                                        <span className="text-xs px-2 py-1 rounded bg-slate-700 font-bold uppercase">{grade.type}</span>
                                                                    </td>
                                                                    <td className="p-4 font-medium">{student.name}</td>
                                                                    <td className="p-4">
                                                                        <input
                                                                            type="number"
                                                                            min="0" max="10" step="0.1"
                                                                            defaultValue={score}
                                                                            onBlur={(e) => {
                                                                                if (e.target.value !== score) {
                                                                                    handleUpdateGrade(grade.id, student.id, e.target.value);
                                                                                }
                                                                            }}
                                                                            className="w-16 bg-slate-900/50 border-b border-gray-600 text-center focus:border-yellow-500 outline-none p-1 rounded font-mono font-bold"
                                                                        />
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        <button
                                                                            onClick={() => handleDeleteGrade(grade.id)}
                                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                                                                            title="Delete entire grade entry"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                                {gradesHistory.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="p-8 text-center opacity-50 italic">
                                                            No grades history found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View for History */}
                                <div className="md:hidden space-y-4">
                                    {gradesHistory.map((grade) => (
                                        <React.Fragment key={grade.id}>
                                            {Object.entries(grade.scores).map(([studentId, score]) => {
                                                const student = students.find(s => s.id === studentId);
                                                if (!student) return null;
                                                return (
                                                    <div key={`${grade.id}-${studentId}`} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="font-bold text-lg text-white">{student.name}</p>
                                                                <p className="text-xs text-gray-400">{new Date(grade.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                            <span className="text-xs px-2 py-1 rounded bg-slate-700 font-bold uppercase text-gray-300">{grade.type}</span>
                                                        </div>

                                                        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg">
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Subject</p>
                                                                <p className="font-bold text-yellow-500">{grade.subject}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Grade</p>
                                                                <input
                                                                    type="number"
                                                                    min="0" max="10" step="0.1"
                                                                    defaultValue={score}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== score) {
                                                                            handleUpdateGrade(grade.id, student.id, e.target.value);
                                                                        }
                                                                    }}
                                                                    className="w-16 bg-transparent border-b border-gray-600 text-center focus:border-yellow-500 outline-none font-mono font-bold text-lg"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex justify-end">
                                                            <button
                                                                onClick={() => handleDeleteGrade(grade.id)}
                                                                className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Delete Entry
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                    {gradesHistory.length === 0 && (
                                        <div className="text-center py-8 opacity-50 italic">No grades history found.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* DAILY REPORT TAB */}
                        {activeTab === 'report' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <Calendar className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{t('dailyReport') || 'Daily Report'}</h2>
                                        <p className="text-sm opacity-70">{t('dailyReportDesc') || 'View attendance and grades for a specific day.'}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <button
                                            onClick={() => generatePDF('report')}
                                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-gray-300 hover:text-white"
                                            title={t('downloadPDF') || 'Download PDF'}
                                        >
                                            <FileDown className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="date"
                                            value={reportDate}
                                            onChange={(e) => setReportDate(e.target.value)}
                                            className="p-2 rounded-lg border bg-slate-800 text-white border-slate-700 focus:border-yellow-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {generatingReport ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--text-secondary)' }}></div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Attendance Section */}
                                        <div className="p-5 rounded-2xl border bg-slate-900/50 border-slate-800">
                                            <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                                                <ClipboardList className="w-5 h-5 text-blue-400" />
                                                {t('attendance') || 'Attendance'}
                                            </h3>

                                            {reportData.attendance.length === 0 ? (
                                                <div className="text-center py-8 opacity-50">
                                                    <p className="text-sm italic">No attendance records found for this date.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {reportData.attendance.map((record, idx) => (
                                                        <div key={idx} className="bg-slate-800/50 p-4 rounded-xl">
                                                            <p className="text-xs opacity-50 mb-3 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Recorded at: {new Date(record.createdAt).toLocaleTimeString()}
                                                            </p>
                                                            <div className="space-y-2">
                                                                {Object.entries(record.records).map(([studentId, present]) => {
                                                                    const student = students.find(s => s.id === studentId);
                                                                    // Filter by class if selected
                                                                    if (student && selectedClass !== 'all' && student.studentClass !== selectedClass) return null;

                                                                    return (
                                                                        <div key={studentId} className="flex justify-between items-center text-sm border-b border-gray-700/30 pb-2 last:border-0">
                                                                            <span className="font-medium">{student ? (student.name || student.email) : <span className="text-red-400 italic">Unknown Student ({studentId})</span>}</span>
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${present ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                                                                {present ? "Present" : "Absent"}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Grades Section */}
                                        <div className="p-5 rounded-2xl border bg-slate-900/50 border-slate-800">
                                            <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                                                <GraduationCap className="w-5 h-5 text-yellow-400" />
                                                {t('gradesLaunched') || 'Grades Launched'}
                                            </h3>

                                            {reportData.grades.length === 0 ? (
                                                <div className="text-center py-8 opacity-50">
                                                    <p className="text-sm italic">No grades launched on this date.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {reportData.grades.map((grade, idx) => (
                                                        <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="font-bold text-yellow-500 text-lg">{grade.subject}</span>
                                                                <span className="text-xs px-2 py-1 rounded bg-slate-700 uppercase tracking-wider font-bold">{grade.type}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {Object.entries(grade.scores).map(([studentId, score]) => {
                                                                    const student = students.find(s => s.id === studentId);
                                                                    // Filter by class if selected
                                                                    if (student && selectedClass !== 'all' && student.studentClass !== selectedClass) return null;

                                                                    return (
                                                                        <div key={studentId} className="flex justify-between items-center text-sm bg-slate-900/30 p-2 rounded">
                                                                            <span className="opacity-80">{student ? (student.name || student.email) : <span className="text-red-400 italic">Unknown Student ({studentId})</span>}</span>
                                                                            <span className="font-mono font-bold text-white bg-slate-700 px-2 py-0.5 rounded">{score}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DEBUG SECTION */}
                                <div className="mt-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
                                    <h4 className="font-bold text-red-400 mb-2">Debug Info (Conectado ao Firebase)</h4>
                                    <p className="text-xs text-gray-400 mb-2">Teacher ID: {currentUser.uid}</p>
                                    <p className="text-xs text-gray-400 mb-2">Query Date: {reportDate}</p>
                                    <p className="text-xs text-gray-500 mb-4">Last Check: {new Date().toLocaleTimeString()}</p>

                                    {debugData.error && (
                                        <div className="bg-red-900/50 p-3 rounded mb-4 border border-red-500 text-red-200 text-xs font-mono">
                                            ERROR: {debugData.error}
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-bold text-xs uppercase text-gray-500 mb-2">All Attendance Records ({debugData.allAttendance.length})</h5>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {debugData.allAttendance.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic">Nenhum registro no Firebase.</p>
                                                ) : (
                                                    debugData.allAttendance.map(a => (
                                                        <div key={a.id} className="text-xs bg-black/20 p-1 rounded">
                                                            Date: <span className="text-yellow-400">{a.date}</span> | Created: {new Date(a.createdAt).toLocaleString()}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-xs uppercase text-gray-500 mb-2">All Grade Records ({debugData.allGrades.length})</h5>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {debugData.allGrades.length === 0 ? (
                                                    <p className="text-xs text-gray-500 italic">Nenhum registro no Firebase.</p>
                                                ) : (
                                                    debugData.allGrades.map(g => (
                                                        <div key={g.id} className="text-xs bg-black/20 p-1 rounded">
                                                            Subj: {g.subject} | Created: <span className="text-yellow-400">{new Date(g.createdAt).toLocaleString()}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
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
        </div >
    );
};

export default TeacherDashboard;

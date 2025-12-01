import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ClipboardList, CheckCircle, XCircle, Calendar } from 'lucide-react';

const StudentDashboard = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [grades, setGrades] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('grades'); // grades, attendance

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        try {
            // Fetch Grades
            // Grades are stored in 'grades' collection, where each doc has a 'scores' map: { studentId: score }
            // We need to query all grades docs and filter client-side or structure DB differently.
            // For now, let's query all and filter. Optimized approach would be to store studentId in a subcollection or array.
            // Given the current structure in TeacherDashboard: 
            // await addDoc(collection(db, 'grades'), { scores: { [studentId]: value }, ... });

            const gradesSnapshot = await getDocs(query(collection(db, 'grades'), orderBy('createdAt', 'desc')));
            const studentGrades = [];

            gradesSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.scores && data.scores[currentUser.uid]) {
                    studentGrades.push({
                        id: doc.id,
                        subject: data.subject,
                        type: data.type,
                        score: data.scores[currentUser.uid],
                        date: data.date
                    });
                }
            });
            setGrades(studentGrades);

            // Fetch Attendance
            // Similar structure: records: { [studentId]: boolean }
            const attendanceSnapshot = await getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc')));
            const studentAttendance = [];

            attendanceSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.records && data.records.hasOwnProperty(currentUser.uid)) {
                    studentAttendance.push({
                        id: doc.id,
                        date: data.date,
                        present: data.records[currentUser.uid]
                    });
                }
            });
            setAttendance(studentAttendance);

        } catch (error) {
            console.error("Error fetching student data:", error);
        } finally {
            setLoading(false);
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
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {t('studentDashboard') || 'Student Dashboard'}
                    </h1>

                    <div className="flex gap-3">
                        <TabButton id="grades" label={t('grades') || 'Grades'} icon={GraduationCap} />
                        <TabButton id="attendance" label={t('attendance') || 'Attendance'} icon={ClipboardList} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--text-secondary)' }}></div>
                    </div>
                ) : (
                    <div className="backdrop-blur-md border rounded-3xl p-6 shadow-xl" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>

                        {/* GRADES TAB */}
                        {activeTab === 'grades' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <GraduationCap className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <h2 className="text-xl font-bold">{t('myGrades') || 'My Grades'}</h2>
                                </div>

                                {grades.length === 0 ? (
                                    <p className="text-center opacity-50 py-8">{t('noGrades') || 'No grades recorded yet.'}</p>
                                ) : (
                                    <div className="grid gap-3">
                                        {grades.map(grade => (
                                            <div key={grade.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                <div>
                                                    <p className="font-bold text-lg">{grade.subject}</p>
                                                    <p className="text-xs opacity-70 capitalize">{t(grade.type) || grade.type}</p>
                                                </div>
                                                <div className="text-2xl font-bold" style={{ color: 'var(--text-secondary)' }}>
                                                    {grade.score}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ATTENDANCE TAB */}
                        {activeTab === 'attendance' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}>
                                        <ClipboardList className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
                                    </div>
                                    <h2 className="text-xl font-bold">{t('myAttendance') || 'My Attendance'}</h2>
                                </div>

                                {attendance.length === 0 ? (
                                    <p className="text-center opacity-50 py-8">{t('noAttendance') || 'No attendance records found.'}</p>
                                ) : (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {attendance.map(record => (
                                            <div key={record.id} className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border)' }}>
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-5 h-5 opacity-50" />
                                                    <span className="font-bold">{new Date(record.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${record.present ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {record.present ? (
                                                        <><CheckCircle className="w-4 h-4" /> {t('present') || 'Present'}</>
                                                    ) : (
                                                        <><XCircle className="w-4 h-4" /> {t('absent') || 'Absent'}</>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;

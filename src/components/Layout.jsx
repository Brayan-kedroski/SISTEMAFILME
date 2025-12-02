import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    Heart, Download, Calendar, MessageSquarePlus,
    BarChart2, LogOut, Film, Menu, X, GraduationCap, ChevronDown, LayoutDashboard, School
} from 'lucide-react';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const { userRole, logout } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Define Menu Groups
    const erpItems = [];
    const movieItems = [
        { path: '/wishlist', icon: Heart, label: t('nav.wishlist') || 'Wishlist' },
        { path: '/downloaded', icon: Download, label: t('nav.downloaded') || 'Downloaded' },
        { path: '/schedule', icon: Calendar, label: t('nav.schedule') || 'Schedule' },
        { path: '/suggestions', icon: MessageSquarePlus, label: t('nav.suggestions') || 'Suggestions' },
    ];

    // Populate ERP Items based on Role
    if (userRole === 'admin') {
        erpItems.push({ path: '/admin', icon: BarChart2, label: t('nav.admin') || 'Admin Panel' });
    }
    if (userRole === 'teacher' || userRole === 'admin') {
        erpItems.push({ path: '/teacher', icon: GraduationCap, label: t('teacherDashboard') || 'Teacher Panel' });
    }
    if (userRole === 'user' || userRole === 'student' || userRole === 'admin') {
        erpItems.push({ path: '/student', icon: GraduationCap, label: t('studentDashboard') || 'Student Panel' });
    }
    // Stats is available to everyone or specific roles? Assuming everyone for now as per previous logic
    erpItems.push({ path: '/stats', icon: BarChart2, label: t('nav.stats') || 'Stats' });


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const NavDropdown = ({ title, icon: Icon, items }) => (
        <div className="relative group">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white font-medium py-2 transition-colors">
                <Icon className="w-5 h-5" />
                {title}
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </button>

            {/* Dropdown Content */}
            <div className="absolute top-full left-0 w-56 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                    {items.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 bg-slate-900`}>
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
                                <School className="w-6 h-6" />
                                <span>Sistema Escolar</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">

                        {/* ERP Dropdown */}
                        {erpItems.length > 0 && (
                            <NavDropdown title="ERP" icon={LayoutDashboard} items={erpItems} />
                        )}

                        {/* Filmes Dropdown */}
                        <NavDropdown title="Filmes" icon={Film} items={movieItems} />

                        <div className="h-6 w-px bg-slate-800"></div>

                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-slate-900 pt-20 px-6 md:hidden overflow-y-auto">
                    <div className="flex flex-col gap-6">

                        {/* ERP Section Mobile */}
                        {erpItems.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ERP</h3>
                                <div className="flex flex-col gap-2">
                                    {erpItems.map(item => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={clsx(
                                                "flex items-center gap-3 text-lg font-medium p-3 rounded-xl transition-colors",
                                                location.pathname === item.path ? "bg-blue-500/10 text-blue-500" : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filmes Section Mobile */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filmes</h3>
                            <div className="flex flex-col gap-2">
                                {movieItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={clsx(
                                            "flex items-center gap-3 text-lg font-medium p-3 rounded-xl transition-colors",
                                            location.pathname === item.path ? "bg-blue-500/10 text-blue-500" : "text-gray-400 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-800" />
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 text-lg font-medium p-3 rounded-xl text-red-400 hover:bg-red-500/10"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            )}

            <main className="pt-24 pb-24 md:pt-28 md:pb-8 px-4 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;

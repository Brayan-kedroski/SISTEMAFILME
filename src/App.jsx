import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Wishlist from './pages/Wishlist';
import Downloaded from './pages/Downloaded';

import Schedule from './pages/Schedule';
import Stats from './pages/Stats';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import FirstAccess from './pages/FirstAccess';
import Suggestions from './pages/Suggestions';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';

import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MovieProvider>
          <ThemeProvider>
            <Router>
              <LanguageSwitcher />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/wishlist"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Wishlist />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/downloaded"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Downloaded />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Schedule />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Stats />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/suggestions"
                  element={
                    <Layout>
                      <Suggestions />
                    </Layout>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route path="/register" element={<Register />} />
                <Route path="/first-access" element={<FirstAccess />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Router>
          </ThemeProvider>
        </MovieProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;

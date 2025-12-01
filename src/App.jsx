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

function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/first-access" element={<FirstAccess />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <Wishlist />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/downloaded" element={
                <PrivateRoute>
                  <Layout>
                    <Downloaded />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/schedule" element={
                <PrivateRoute>
                  <Layout>
                    <Schedule />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/stats" element={
                <PrivateRoute>
                  <Layout>
                    <Stats />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </AdminRoute>
              } />
              <Route path="/suggestions" element={
                <PrivateRoute>
                  <Layout>
                    <Suggestions />
                  </Layout>
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </LanguageProvider>
      </MovieProvider>
    </AuthProvider>
  );
}

export default App;

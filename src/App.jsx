import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Wishlist from './pages/Wishlist';
import Downloaded from './pages/Downloaded';

function App() {
  return (
    <LanguageProvider>
      <MovieProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Wishlist />} />
              <Route path="/downloaded" element={<Downloaded />} />
            </Routes>
          </Layout>
        </Router>
      </MovieProvider>
    </LanguageProvider>
  );
}

export default App;

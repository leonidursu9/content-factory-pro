import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import AuthorsPage from './pages/AuthorsPage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import IdeasPage from './pages/IdeasPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ScriptsPage from './pages/ScriptsPage.jsx';
import AuthorDetailPage from './pages/AuthorDetailPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import LoginPage from './pages/LoginPage.jsx'; 

import BottomNav from './components/BottomNav.jsx';

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/authors" />} />
            <Route path="/authors" element={<AuthorsPage />} />
            <Route path="/authors/:id" element={<AuthorDetailPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/scripts/:postId" element={<ScriptsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/izbrannoe" element={<FavoritesPage />} />
            <Route path="/login" element={<LoginPage />} /> 
          </Routes>
        </main>
        <BottomNav />
      </div>
    </HashRouter>
  );
}

export default App;
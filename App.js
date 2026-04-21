import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DailyVerse from './components/DailyVerse';
import DivineGuidance from './components/DivineGuidance';
import PrayerGenerator from './components/PrayerGenerator';
import BibleQuiz from './components/BibleQuiz';
import VirtualBible from './components/VirtualBible';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import SavedVerses from './components/SavedVerses';
import AdminDashboard from './components/AdminDashboard';
import './styles/styles.css';

function GoogleOAuthHandler() {
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setToken(token);
      window.location.href = '/';
    } else {
      window.location.href = '/login';
    }
  }, [token, setToken]);

  return <div>Processing Google OAuth...</div>;
}

function AppContent() {
  const [activeTab, setActiveTab] = useState('daily');
  const { user, isGuest, loading } = useAuth();

  if (loading) return null;
  if (!user && !isGuest) return <Navigate to="/login" replace />;

  const renderContent = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyVerse />;
      case 'guidance':
        return <DivineGuidance />;
      case 'prayer':
        return <PrayerGenerator />;
      case 'quiz':
        return <BibleQuiz />;
      case 'bible':
        return <VirtualBible setActiveTab={setActiveTab} />;
      case 'saved':
        return <SavedVerses />;
      default:
        return <DailyVerse />;
    }
  };

  return (
    <div className="app">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth/callback" element={<GoogleOAuthHandler />} />
          <Route path="/dailyverse" element={<AppContent />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

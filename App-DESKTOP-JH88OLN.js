import React, { useState } from 'react';
import Navigation from './components/Navigation';
import DailyVerse from './components/DailyVerse';
import DivineGuidance from './components/DivineGuidance';
import TheologicalQA from './components/TheologicalQA';
import PrayerGenerator from './components/PrayerGenerator';
import './styles/styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('daily');

  const renderContent = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyVerse />;
      case 'guidance':
        return <DivineGuidance />;
      case 'qa':
        return <TheologicalQA />;
      case 'prayer':
        return <PrayerGenerator />;
      default:
        return <DailyVerse />;
    }
  };

  return (
    <div className="app-root">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}

export default App;


// frontend/src/App.js

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // NavLink is now in Header
import Header from './components/Header/Header'; // Import the Header component
import Home from './components/Home/Home'; // Import the Home component
import PlayersList from './components/PlayersList/PlayersList';
import GamesList from './components/GamesList/GamesList';
import './App.css'; // Your main App CSS

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Router>
      <div className="app-container"> {/* This is the main container for full page UI */}
        <Header onSearchChange={setSearchTerm} /> {/* Header now contains navigation and search */}

        <main className="app-content-area"> {/* Main content area */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/players" element={<PlayersList searchTerm={searchTerm} />} />
            <Route path="/games" element={<GamesList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

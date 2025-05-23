import React, { useState } from 'react';
import './App.css'; // Or App.module.css if you're using CSS Modules

import Navigation from './components/Navigation/Navigation';
import PlayersList from './components/PlayersList/PlayersList';
import TeamStats from './components/TeamStats/TeamStats';

function App() {
    const [activeSection, setActiveSection] = useState('players'); // 'players' or 'teamStats'
    const [searchTerm, setSearchTerm] = useState(''); // State for the global search

    const handleSearchChange = (term) => {
        setSearchTerm(term);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <Navigation
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    onSearchChange={handleSearchChange} // Pass search handler
                    searchTerm={searchTerm} // Pass current search term
                />
            </header>
            <main className="app-content-area">
                {activeSection === 'players' ? (
                    <PlayersList searchTerm={searchTerm} />
                ) : (
                    <TeamStats />
                )}
            </main>
        </div>
    );
}

export default App;
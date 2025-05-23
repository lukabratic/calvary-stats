import React from 'react';
import './Navigation.css'; // Or Navigation.module.css

function Navigation({ activeSection, onSectionChange, onSearchChange, searchTerm }) {
    return (
        <nav className="main-nav">
            <button
                className={`nav-button ${activeSection === 'teamStats' ? 'active' : ''}`}
                onClick={() => onSectionChange('teamStats')}
            >
                Team stats
            </button>
            <button
                className={`nav-button ${activeSection === 'players' ? 'active' : ''}`}
                onClick={() => onSectionChange('players')}
            >
                Players
            </button>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </nav>
    );
}

export default Navigation;
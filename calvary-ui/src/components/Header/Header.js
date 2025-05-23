// frontend/src/components/Header/Header.js

import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink for navigation
import './Header.css'; // Optional: for basic styling

function Header({ onSearchChange }) {
    return (
        <header className="app-header">
            <nav className="main-nav">
                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}>
                        Home
                    </NavLink>
                    <NavLink to="/players" className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}>
                        Players
                    </NavLink>
                    <NavLink to="/games" className={({ isActive }) => isActive ? "nav-button active" : "nav-button"}>
                        Games
                    </NavLink>
                </div>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search players..."
                        className="search-input"
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </nav>
        </header>
    );
}

export default Header;

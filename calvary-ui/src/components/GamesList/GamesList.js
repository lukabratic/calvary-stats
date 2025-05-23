// frontend/src/components/GamesList/GamesList.js

import React from 'react';
import './GamesList.css'; // Optional: for basic styling

function GamesList() {
    const gameNumbers = [1, 2, 3, 4, 5, 6, 7, 8];

    return (
        <div className="games-list-container">
            <h2>Game Numbers</h2>
            <p>Here is a list of game numbers from 1 to 8:</p>
            <ul className="game-numbers-list">
                {gameNumbers.map(number => (
                    <li key={number} className="game-number-item">
                        Game #{number}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default GamesList;

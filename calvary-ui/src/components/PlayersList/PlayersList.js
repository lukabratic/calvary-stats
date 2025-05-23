import React, { useState, useEffect } from 'react';
import './PlayersList.css'; // Or PlayersList.module.css

function PlayersList({ searchTerm }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dummy data for development
    const dummyPlayers = [
        { id: 1, name: 'Luka Doncic' },
        { id: 2, name: 'Stephen Curry' },
        { id: 3, name: 'LeBron James' },
        { id: 4, name: 'Nikola Jokic' },
        { id: 5, name: 'Kevin Durant' },
    ];

    useEffect(() => {
        // In a real app, you would fetch data from your Spring Boot backend
        // Example: fetch('/api/players')
        //     .then(response => {
        //         if (!response.ok) {
        //             throw new Error(`HTTP error! status: ${response.status}`);
        //         }
        //         return response.json();
        //     })
        //     .then(data => {
        //         setPlayers(data);
        //         setLoading(false);
        //     })
        //     .catch(err => {
        //         setError(err);
        //         setLoading(false);
        //     });

        // Using dummy data for now
        const timer = setTimeout(() => {
            setPlayers(dummyPlayers);
            setLoading(false);
        }, 500); // Simulate network delay

        return () => clearTimeout(timer); // Cleanup
    }, []); // Empty dependency array means this runs once on mount

    const filteredPlayers = players.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="players-list-container">Loading players...</div>;
    }

    if (error) {
        return <div className="players-list-container error">Error: {error.message}</div>;
    }

    return (
        <div className="players-list-container">
            <h2>Players</h2>
            {filteredPlayers.length === 0 ? (
                <p>No players found.</p>
            ) : (
                <ul>
                    {filteredPlayers.map(player => (
                        <li key={player.id}>{player.name}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PlayersList;
// frontend/src/components/PlayersList/PlayersList.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './PlayersList.css';

function PlayersList({ searchTerm }) {
    const [activeView, setActiveView] = useState('averages'); // 'averages' or 'totals'
    const [playerAverages, setPlayerAverages] = useState([]); // Stores individual player averages
    const [playerTotals, setPlayerTotals] = useState([]);   // Stores individual player totals
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New state for extracted Team Averages/Totals rows
    const [teamAveragesRow, setTeamAveragesRow] = useState(null);
    const [teamTotalsRow, setTeamTotalsRow] = useState(null);

    // State for numeric stat filters
    const [statFilters, setStatFilters] = useState({
        pts: { min: '', max: '' },
        rebs: { min: '', max: '' },
        assists: { min: '', max: '' },
        // Add more stats here if you want to filter them (e.g., 'blocks', 'steals', etc.)
        // Make sure the key matches the database column name (e.g., 'to_val' for turnovers)
    });

    // State for sorting configuration: { key: column_name, direction: 'ascending' | 'descending' }
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        const fetchPlayerStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch player averages data
                const averagesResponse = await fetch('/api/player_season_averages');
                if (!averagesResponse.ok) {
                    throw new Error(`HTTP error! status: ${averagesResponse.status} for averages`);
                }
                const averagesData = await averagesResponse.json();

                // Separate "Team Averages" row from individual player averages
                const teamAvg = averagesData.find(player => player.player === 'Team Averages');
                const individualAverages = averagesData.filter(player => player.player !== 'Team Averages');
                setTeamAveragesRow(teamAvg); // Store the team average row
                setPlayerAverages(individualAverages); // Store only individual player averages

                // Fetch player totals data
                const totalsResponse = await fetch('/api/player_season_totals');
                if (!totalsResponse.ok) {
                    throw new Error(`HTTP error! status: ${totalsResponse.status} for totals`);
                }
                const totalsData = await totalsResponse.json();

                // Separate "Team Totals" row from individual player totals
                const teamTot = totalsData.find(player => player.player === 'Team Totals');
                const individualTotals = totalsData.filter(player => player.player !== 'Team Totals');
                setTeamTotalsRow(teamTot); // Store the team total row
                setPlayerTotals(individualTotals); // Store only individual player totals

            } catch (err) {
                console.error("Failed to fetch player stats:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerStats();
    }, []); // Runs once on mount

    // Handler for filter input changes
    const handleFilterChange = (statName, type, value) => {
        setStatFilters(prevFilters => ({
            ...prevFilters,
            [statName]: {
                ...prevFilters[statName],
                [type]: value
            }
        }));
    };

    // Function to clear all numeric filters
    const clearFilters = () => {
        setStatFilters({
            pts: { min: '', max: '' },
            rebs: { min: '', max: '' },
            assists: { min: '', max: '' },
        });
    };

    // Function to handle sort requests when a header is clicked
    const requestSort = (key) => {
        let direction = 'ascending';
        // If the same key is clicked again, reverse the direction
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Function to apply all active filters (search term + numeric filters)
    // Wrapped in useCallback to provide a stable function reference
    const applyAllFilters = useCallback((players, filters) => {
        return players.filter(player => {
            // 1. Apply global player name search term
            if (searchTerm && !player.player.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // 2. Apply numeric range filters
            for (const stat in filters) {
                const { min, max } = filters[stat];
                // Ensure the stat exists on the player object before trying to parse it
                const playerStatValue = player[stat] !== undefined && player[stat] !== null
                                        ? parseFloat(player[stat])
                                        : NaN; // Use NaN if stat is missing/null

                // Check min filter
                if (min !== '' && !isNaN(parseFloat(min)) && (isNaN(playerStatValue) || playerStatValue < parseFloat(min))) {
                    return false;
                }
                if (max !== '' && !isNaN(parseFloat(max)) && (isNaN(playerStatValue) || playerStatValue > parseFloat(max))) {
                    return false;
                }
            }
            return true;
        });
    }, [searchTerm]); // Dependencies for useCallback: searchTerm and any other external state/props used inside applyAllFilters


    // Memoized sorted and filtered data for averages
    const sortedAverages = useMemo(() => {
        let sortableItems = [...applyAllFilters(playerAverages, statFilters)]; // Apply filters first
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Handle numbers, strings, and null/undefined values
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    // Case-insensitive string comparison
                    const comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                } else {
                    // Handle mixed types or null/undefined by pushing them to the end
                    if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
                    if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
                    // Fallback for other types or if comparison fails, convert to string
                    const comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [playerAverages, statFilters, sortConfig, applyAllFilters]);


    // Memoized sorted and filtered data for totals
    const sortedTotals = useMemo(() => {
        let sortableItems = [...applyAllFilters(playerTotals, statFilters)]; // Apply filters first
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    if (aValue < bValue) {
                        return sortConfig.direction === 'ascending' ? -1 : 1;
                    }
                    if (aValue > bValue) {
                        return sortConfig.direction === 'ascending' ? 1 : -1;
                    }
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    const comparison = aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                } else {
                    if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
                    if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
                    const comparison = String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
                    return sortConfig.direction === 'ascending' ? comparison : -comparison;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [playerTotals, statFilters, sortConfig, applyAllFilters]);


    // Helper to get the class name for sort indicator (arrow)
    const getSortIndicatorClass = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? 'sort-asc' : 'sort-desc';
        }
        return '';
    };

    // Define headers for Averages table (mapping display name to DB key for sorting)
    const averagesHeaders = [
        { display: "Player", key: "player" }, { display: "PTS", key: "pts" }, { display: "REBS", key: "rebs" },
        { display: "ASSISTS", key: "assists" }, { display: "STEALS", key: "steals" }, { display: "BLOCKS", key: "blocks" },
        { display: "2 PTM", key: "two_pt_m" }, { display: "2 PTA", key: "two_pt_a" }, { display: "2 PT %", key: "two_pt_pct" },
        { display: "3 PTM", key: "three_pt_m" }, { display: "3 PTA", key: "three_pt_a" }, { display: "3 PT %", key: "three_pt_pct" },
        { display: "FGM", key: "fgm" }, { display: "FGA", key: "fga" }, { display: "FG %", key: "fg_pct" },
        { display: "FTM", key: "ftm" }, { display: "FTA", key: "fta" }, { display: "FT %", key: "ft_pct" },
        { display: "TO", key: "to_val" }
    ];

    // Define headers for Totals table (mapping display name to DB key for sorting)
    const totalsHeaders = [
        { display: "Player", key: "player" }, { display: "PTS", key: "pts" }, { display: "REBS", key: "rebs" },
        { display: "ASSISTS", key: "assists" }, { display: "STEALS", key: "steals" }, { display: "BLOCKS", key: "blocks" },
        { display: "2 PTM", key: "two_pt_m" }, { display: "2 PTA", key: "two_pt_a" }, { display: "2 PT %", key: "two_pt_pct" },
        { display: "3 PTM", key: "three_pt_m" }, { display: "3 PTA", key: "three_pt_a" }, { display: "3 PT %", key: "three_pt_pct" },
        { display: "FGM", key: "fgm" }, { display: "FGA", key: "fga" }, { display: "FG %", key: "fg_pct" },
        { display: "FTM", key: "ftm" }, { display: "FTA", key: "fta" }, { display: "FT %", key: "ft_pct" },
        { display: "TO", key: "to_val" }, { display: "Games", key: "games" }
    ];


    if (loading) {
        return (
            <div className="players-list-container">
                <p>Loading player statistics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="players-list-container error">
                <p>Error loading player data: {error.message}</p>
                <p>Please ensure your Flask backend is running and data has been imported.</p>
            </div>
        );
    }

    return (
        <div className="players-list-container">
            <h2>Player Statistics</h2>

            <div className="player-stats-tabs">
                <button
                    className={`tab-button ${activeView === 'averages' ? 'active' : ''}`}
                    onClick={() => { setActiveView('averages'); setSortConfig({ key: null, direction: 'ascending' }); }} // Reset sort on tab change
                >
                    Season Averages
                </button>
                <button
                    className={`tab-button ${activeView === 'totals' ? 'active' : ''}`}
                    onClick={() => { setActiveView('totals'); setSortConfig({ key: null, direction: 'ascending' }); }} // Reset sort on tab change
                >
                    Season Totals
                </button>
            </div>

            {/* Filter Section */}
            <div className="player-filters">
                <h3>Filter by Stats:</h3>
                <div className="filter-inputs">
                    {Object.keys(statFilters).map(statName => (
                        <div key={statName} className="filter-group">
                            <label>{statName.toUpperCase()}:</label>
                            <input
                                type="number"
                                placeholder="Min"
                                value={statFilters[statName].min}
                                onChange={(e) => handleFilterChange(statName, 'min', e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={statFilters[statName].max}
                                onChange={(e) => handleFilterChange(statName, 'max', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                <button className="clear-filters-button" onClick={clearFilters}>Clear Filters</button>
            </div>


            {activeView === 'averages' && (
                sortedAverages.length === 0 && !teamAveragesRow ? ( // Check if no players AND no team average row
                    <p className="no-results">No player averages found matching your criteria.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {averagesHeaders.map(header => (
                                        <th
                                            key={header.key}
                                            onClick={() => requestSort(header.key)}
                                            className={header.key ? 'sortable' : ''} // Add 'sortable' class
                                        >
                                            {header.display}
                                            {header.key && <span className={`sort-indicator ${getSortIndicatorClass(header.key)}`}></span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAverages.map(player => (
                                    <tr key={player.id}>
                                        <td>{player.player}</td>
                                        <td>{player.pts}</td>
                                        <td>{player.rebs}</td>
                                        <td>{player.assists}</td>
                                        <td>{player.steals}</td>
                                        <td>{player.blocks}</td>
                                        <td>{player.two_pt_m}</td>
                                        <td>{player.two_pt_a}</td>
                                        <td>{player.two_pt_pct}%</td>
                                        <td>{player.three_pt_m}</td>
                                        <td>{player.three_pt_a}</td>
                                        <td>{player.three_pt_pct}%</td>
                                        <td>{player.fgm}</td>
                                        <td>{player.fga}</td>
                                        <td>{player.fg_pct}%</td>
                                        <td>{player.ftm}</td>
                                        <td>{player.fta}</td>
                                        <td>{player.ft_pct}%</td>
                                        <td>{player.to_val}</td>
                                    </tr>
                                ))}
                                {/* Render Team Averages row at the bottom */}
                                {teamAveragesRow && (
                                    <tr key={teamAveragesRow.id} className="summary-row">
                                        <td>{teamAveragesRow.player}</td>
                                        <td>{teamAveragesRow.pts}</td>
                                        <td>{teamAveragesRow.rebs}</td>
                                        <td>{teamAveragesRow.assists}</td>
                                        <td>{teamAveragesRow.steals}</td>
                                        <td>{teamAveragesRow.blocks}</td>
                                        <td>{teamAveragesRow.two_pt_m}</td>
                                        <td>{teamAveragesRow.two_pt_a}</td>
                                        <td>{teamAveragesRow.two_pt_pct}%</td>
                                        <td>{teamAveragesRow.three_pt_m}</td>
                                        <td>{teamAveragesRow.three_pt_a}</td>
                                        <td>{teamAveragesRow.three_pt_pct}%</td>
                                        <td>{teamAveragesRow.fgm}</td>
                                        <td>{teamAveragesRow.fga}</td>
                                        <td>{teamAveragesRow.fg_pct}%</td>
                                        <td>{teamAveragesRow.ftm}</td>
                                        <td>{teamAveragesRow.fta}</td>
                                        <td>{teamAveragesRow.ft_pct}%</td>
                                        <td>{teamAveragesRow.to_val}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {activeView === 'totals' && (
                sortedTotals.length === 0 && !teamTotalsRow ? ( // Check if no players AND no team total row
                    <p className="no-results">No player totals found matching your criteria.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    {totalsHeaders.map(header => (
                                        <th
                                            key={header.key}
                                            onClick={() => requestSort(header.key)}
                                            className={header.key ? 'sortable' : ''}
                                        >
                                            {header.display}
                                            {header.key && <span className={`sort-indicator ${getSortIndicatorClass(header.key)}`}></span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTotals.map(player => (
                                    <tr key={player.id}>
                                        <td>{player.player}</td>
                                        <td>{player.pts}</td>
                                        <td>{player.rebs}</td>
                                        <td>{player.assists}</td>
                                        <td>{player.steals}</td>
                                        <td>{player.blocks}</td>
                                        <td>{player.two_pt_m}</td>
                                        <td>{player.two_pt_a}</td>
                                        <td>{player.two_pt_pct}%</td>
                                        <td>{player.three_pt_m}</td>
                                        <td>{player.three_pt_a}</td>
                                        <td>{player.three_pt_pct}%</td>
                                        <td>{player.fgm}</td>
                                        <td>{player.fga}</td>
                                        <td>{player.fg_pct}%</td>
                                        <td>{player.ftm}</td>
                                        <td>{player.fta}</td>
                                        <td>{player.ft_pct}%</td>
                                        <td>{player.to_val}</td>
                                        <td>{player.games}</td>
                                    </tr>
                                ))}
                                {/* Render Team Totals row at the bottom */}
                                {teamTotalsRow && (
                                    <tr key={teamTotalsRow.id} className="summary-row">
                                        <td>{teamTotalsRow.player}</td>
                                        <td>{teamTotalsRow.pts}</td>
                                        <td>{teamTotalsRow.rebs}</td>
                                        <td>{teamTotalsRow.assists}</td>
                                        <td>{teamTotalsRow.steals}</td>
                                        <td>{teamTotalsRow.blocks}</td>
                                        <td>{teamTotalsRow.two_pt_m}</td>
                                        <td>{teamTotalsRow.two_pt_a}</td>
                                        <td>{teamTotalsRow.two_pt_pct}%</td>
                                        <td>{teamTotalsRow.three_pt_m}</td>
                                        <td>{teamTotalsRow.three_pt_a}</td>
                                        <td>{teamTotalsRow.three_pt_pct}%</td>
                                        <td>{teamTotalsRow.fgm}</td>
                                        <td>{teamTotalsRow.fga}</td>
                                        <td>{teamTotalsRow.fg_pct}%</td>
                                        <td>{teamTotalsRow.ftm}</td>
                                        <td>{teamTotalsRow.fta}</td>
                                        <td>{teamTotalsRow.ft_pct}%</td>
                                        <td>{teamTotalsRow.to_val}</td>
                                        <td>{teamTotalsRow.games}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}

export default PlayersList;

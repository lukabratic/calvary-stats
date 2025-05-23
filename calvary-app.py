# backend/calvary-app.py (Relevant sections)

import os
import sqlite3
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# --- Configuration ---
DATABASE_FILE = 'calvary_stats.db'
DB_PATH = os.path.join(os.path.dirname(__file__), DATABASE_FILE)

# --- Flask App Setup ---
app = Flask(__name__, static_folder='../calvary-ui', static_url_path='/')
CORS(app)

# --- Helper function to get a database connection ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # Makes rows behave like dictionaries
    return conn

# --- API Routes ---

# API route for player season averages
@app.route('/api/player_season_averages', methods=['GET'])
def get_player_season_averages():
    """
    Fetches all player season averages from the 'player_season_averages' table.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM player_season_averages")
    player_averages_data = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in player_averages_data])

# API route for player season totals
@app.route('/api/player_season_totals', methods=['GET'])
def get_player_season_totals():
    """
    Fetches all player season totals from the 'player_season_totals' table.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM player_season_totals")
    player_totals_data = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in player_totals_data])


# API route for original 'team_stats' (still dummy data if not explicitly handled)
@app.route('/api/team_stats', methods=['GET'])
def get_team_stats():
    dummy_team_stats = [
        {"id": 1, "name": "Team A", "wins": 10, "losses": 5},
        {"id": 2, "id": "Team B", "wins": 8, "losses": 7},
    ]
    return jsonify(dummy_team_stats)


# API route for players (still dummy data)
@app.route('/api/players', methods=['GET'])
def get_players():
    dummy_players = [
        {"id": 1, "name": "Luka Doncic", "stats": {"points": 33, "assists": 9}},
        {"id": 2, "name": "Stephen Curry", "stats": {"points": 30, "assists": 6}},
    ]
    return jsonify(dummy_players)


# --- Serve React App (Frontend) ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# --- Main execution block ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)

import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS # You'll likely need Flask-CORS for development API calls

app = Flask(__name__, static_folder='../calvary-ui', static_url_path='/')
# The static_folder should point to your React app's build directory.
# Assuming your Flask app is in a 'backend' folder and React in 'frontend'
# like this:
# project_root/
# ├── backend/
# │   └── calvary-app.py
# └── frontend/
#     ├── public/
#     ├── src/
#     └── build/ # This is where your React app builds to

CORS(app) # Enable CORS for all routes (important for development)

# API routes (your existing backend logic)
@app.route('/api/data', methods=['GET'])
def get_data():
    # Replace with your actual data fetching logic
    return jsonify({"message": "Hello from Flask backend!"})

# Add more API routes for players, teams, etc.
@app.route('/api/players', methods=['GET'])
def get_players():
    # Example: fetch players from a database or a dummy list
    players = [
        {"id": 1, "name": "Luka Doncic", "stats": {"points": 33, "assists": 9}},
        {"id": 2, "name": "Stephen Curry", "stats": {"points": 30, "assists": 6}},
        # ... more players
    ]
    return jsonify(players)

@app.route('/api/team_stats', methods=['GET'])
def get_team_stats():
    # Example: fetch team stats
    team_stats = {
        "wins": 50,
        "losses": 32,
        "championships": 1,
        # ... more stats
    }
    return jsonify(team_stats)


# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # For development, you'll run the Flask backend separately and the React frontend separately.
    # When deployed, Flask will serve the React build.
    app.run(debug=True, port=5000) # Flask typically runs on port 5000
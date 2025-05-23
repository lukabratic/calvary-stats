# backend/import_data.py

import sqlite3
import csv
import os

# --- Configuration ---
DATABASE_FILE = 'calvary_stats.db'
DB_PATH = os.path.join(os.path.dirname(__file__), DATABASE_FILE)

# CSV files for player stats
CSV_FILE_PLAYER_AVERAGES = 'player_season_averages.csv'
CSV_FILE_PLAYER_TOTALS = 'player_season_totals.csv'

CSV_PATH_PLAYER_AVERAGES = os.path.join(os.path.dirname(__file__), 'data', CSV_FILE_PLAYER_AVERAGES)
CSV_PATH_PLAYER_TOTALS = os.path.join(os.path.dirname(__file__), 'data', CSV_FILE_PLAYER_TOTALS)


# Ensure the 'data' directory exists
if not os.path.exists(os.path.join(os.path.dirname(__file__), 'data')):
    os.makedirs(os.path.join(os.path.dirname(__file__), 'data'))
    print(f"Created directory: {os.path.join(os.path.dirname(__file__), 'data')}")


# --- Table Creation Functions ---

def create_player_averages_table(conn):
    """Creates the 'player_season_averages' table if it doesn't exist."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_season_averages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            pts REAL,
            rebs REAL,
            assists REAL,
            steals REAL,
            blocks REAL,
            two_pt_m REAL,
            two_pt_a REAL,
            two_pt_pct REAL,
            three_pt_m REAL,
            three_pt_a REAL,
            three_pt_pct REAL,
            fgm REAL,
            fga REAL,
            fg_pct REAL,
            ftm REAL,
            fta REAL,
            ft_pct REAL,
            to_val REAL -- Renamed 'to' to 'to_val' to avoid potential SQL keyword conflict
        );
    ''')
    conn.commit()
    print("Table 'player_season_averages' checked/created successfully.")

def create_player_totals_table(conn):
    """Creates the 'player_season_totals' table if it doesn't exist."""
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS player_season_totals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player TEXT NOT NULL,
            pts INTEGER,
            rebs INTEGER,
            assists INTEGER,
            steals INTEGER,
            blocks INTEGER,
            two_pt_m INTEGER,
            two_pt_a INTEGER,
            two_pt_pct REAL,
            three_pt_m INTEGER,
            three_pt_a INTEGER,
            three_pt_pct REAL,
            fgm INTEGER,
            fga INTEGER,
            fg_pct REAL,
            ftm INTEGER,
            fta INTEGER,
            ft_pct REAL,
            to_val INTEGER, -- Renamed 'to' to 'to_val'
            games INTEGER
        );
    ''')
    conn.commit()
    print("Table 'player_season_totals' checked/created successfully.")

# --- Data Import Functions ---

def import_player_averages_csv_to_db(csv_file_path, db_file_path):
    """Reads data from player averages CSV and inserts into 'player_season_averages' table."""
    conn = None
    try:
        conn = sqlite3.connect(db_file_path)
        create_player_averages_table(conn)
        cursor = conn.cursor()

        # Check for existing data
        cursor.execute("SELECT count(*) FROM player_season_averages;")
        if cursor.fetchone()[0] > 0:
            print(f"Table 'player_season_averages' already contains data. Skipping import.")
            return

        with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            # Define column order for insertion, matching DB schema
            db_columns_order = [
                'player', 'pts', 'rebs', 'assists', 'steals', 'blocks',
                'two_pt_m', 'two_pt_a', 'two_pt_pct', 'three_pt_m', 'three_pt_a',
                'three_pt_pct', 'fgm', 'fga', 'fg_pct', 'ftm', 'fta', 'ft_pct', 'to_val'
            ]

            placeholders = ', '.join(['?' for _ in db_columns_order])
            columns_str = ', '.join(db_columns_order)
            insert_sql = f'INSERT INTO player_season_averages ({columns_str}) VALUES ({placeholders})'

            for i, row in enumerate(reader):
                try:
                    # Clean player name (remove leading '#XX ')
                    player_name = row.get('Player', '').strip()
                    if player_name and player_name.startswith('#'):
                        player_name = player_name.split(' ', 1)[1] if ' ' in player_name else player_name

                    data_to_insert = (
                        player_name,
                        float(row.get('PTS', 0.0)),
                        float(row.get('REBS', 0.0)),
                        float(row.get('ASSISTS', 0.0)),
                        float(row.get('STEALS', 0.0)),
                        float(row.get('BLOCKS', 0.0)),
                        float(row.get('2 PTM', 0.0)),
                        float(row.get('2 PTA', 0.0)),
                        float(row.get('2 PT %', '0.0%').replace('%', '')), # Remove '%' and convert
                        float(row.get('3 PTM', 0.0)),
                        float(row.get('3 PTA', 0.0)),
                        float(row.get('3 PT %', '0.0%').replace('%', '')),
                        float(row.get('FGM', 0.0)),
                        float(row.get('FGA', 0.0)),
                        float(row.get('FG %', '0.0%').replace('%', '')),
                        float(row.get('FTM', 0.0)),
                        float(row.get('FTA', 0.0)),
                        float(row.get('FT %', '0.0%').replace('%', '')),
                        float(row.get('TO', 0.0))
                    )
                    cursor.execute(insert_sql, data_to_insert)
                except ValueError as ve:
                    print(f"Skipping averages row {i+1} due to data conversion error: {ve} in row: {row}")
                    continue
                except Exception as e:
                    print(f"Skipping averages row {i+1} due to unexpected error: {e} in row: {row}")
                    continue
            conn.commit()
            print(f"Data imported successfully from '{csv_file_path}' to 'player_season_averages'.")

    except FileNotFoundError:
        print(f"Error: CSV file not found at '{csv_file_path}'. Please ensure it exists.")
    except sqlite3.Error as e:
        print(f"SQLite database error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during averages import: {e}")
    finally:
        if conn:
            conn.close()

def import_player_totals_csv_to_db(csv_file_path, db_file_path):
    """Reads data from player totals CSV and inserts into 'player_season_totals' table."""
    conn = None
    try:
        conn = sqlite3.connect(db_file_path)
        create_player_totals_table(conn)
        cursor = conn.cursor()

        # Check for existing data
        cursor.execute("SELECT count(*) FROM player_season_totals;")
        if cursor.fetchone()[0] > 0:
            print(f"Table 'player_season_totals' already contains data. Skipping import.")
            return

        with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            # Define column order for insertion, matching DB schema
            db_columns_order = [
                'player', 'pts', 'rebs', 'assists', 'steals', 'blocks',
                'two_pt_m', 'two_pt_a', 'two_pt_pct', 'three_pt_m', 'three_pt_a',
                'three_pt_pct', 'fgm', 'fga', 'fg_pct', 'ftm', 'fta', 'ft_pct', 'to_val', 'games'
            ]

            placeholders = ', '.join(['?' for _ in db_columns_order])
            columns_str = ', '.join(db_columns_order)
            insert_sql = f'INSERT INTO player_season_totals ({columns_str}) VALUES ({placeholders})'

            for i, row in enumerate(reader):
                try:
                    # Clean player name (remove leading '#XX ')
                    player_name = row.get('Players', '').strip() # Note: header is 'Players' here
                    if player_name and player_name.startswith('#'):
                        player_name = player_name.split(' ', 1)[1] if ' ' in player_name else player_name

                    data_to_insert = (
                        player_name,
                        int(row.get('PTS', 0)),
                        int(row.get('REBS', 0)),
                        int(row.get('ASSISTS', 0)),
                        int(row.get('STEALS', 0)),
                        int(row.get('BLOCKS', 0)),
                        int(row.get('2 PTM', 0)),
                        int(row.get('2 PTA', 0)),
                        float(row.get('2 PT %', '0.0%').replace('%', '')),
                        int(row.get('3 PTM', 0)),
                        int(row.get('3 PTA', 0)),
                        float(row.get('3 PT %', '0.0%').replace('%', '')),
                        int(row.get('FGM', 0)),
                        int(row.get('FGA', 0)),
                        float(row.get('FG %', '0.0%').replace('%', '')),
                        int(row.get('FTM', 0)),
                        int(row.get('FTA', 0)),
                        float(row.get('FT %', '0.0%').replace('%', '')),
                        int(row.get('TO', 0)),
                        int(row.get('Games', 0))
                    )
                    cursor.execute(insert_sql, data_to_insert)
                except ValueError as ve:
                    print(f"Skipping totals row {i+1} due to data conversion error: {ve} in row: {row}")
                    continue
                except Exception as e:
                    print(f"Skipping totals row {i+1} due to unexpected error: {e} in row: {row}")
                    continue
            conn.commit()
            print(f"Data imported successfully from '{csv_file_path}' to 'player_season_totals'.")

    except FileNotFoundError:
        print(f"Error: CSV file not found at '{csv_file_path}'. Please ensure it exists.")
    except sqlite3.Error as e:
        print(f"SQLite database error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred during totals import: {e}")
    finally:
        if conn:
            conn.close()

# --- Main execution block for import_data.py ---
if __name__ == "__main__":
    # --- Optional: Check if database already has data to prevent duplicate imports ---
    conn_check = None
    try:
        conn_check = sqlite3.connect(DB_PATH)
        cursor_check = conn_check.cursor()

        # Check player_season_averages table
        cursor_check.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='player_season_averages';")
        if cursor_check.fetchone():
            cursor_check.execute("SELECT count(*) FROM player_season_averages;")
            if cursor_check.fetchone()[0] > 0:
                print("Table 'player_season_averages' already contains data. Skipping its import.")
            else:
                print(f"Initiating data import for Player Averages from '{CSV_PATH_PLAYER_AVERAGES}'...")
                import_player_averages_csv_to_db(CSV_PATH_PLAYER_AVERAGES, DB_PATH)
        else:
            print("Table 'player_season_averages' does not exist. Proceeding with import.")
            import_player_averages_csv_to_db(CSV_PATH_PLAYER_AVERAGES, DB_PATH)


        # Check player_season_totals table
        cursor_check.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='player_season_totals';")
        if cursor_check.fetchone():
            cursor_check.execute("SELECT count(*) FROM player_season_totals;")
            if cursor_check.fetchone()[0] > 0:
                print("Table 'player_season_totals' already contains data. Skipping its import.")
            else:
                print(f"Initiating data import for Player Totals from '{CSV_PATH_PLAYER_TOTALS}'...")
                import_player_totals_csv_to_db(CSV_PATH_PLAYER_TOTALS, DB_PATH)
        else:
            print("Table 'player_season_totals' does not exist. Proceeding with import.")
            import_player_totals_csv_to_db(CSV_PATH_PLAYER_TOTALS, DB_PATH)

    except sqlite3.Error as e:
        print(f"Error during initial database check: {e}")
    finally:
        if conn_check:
            conn_check.close()

    # --- Optional: Verify imported data after successful import ---
    print("\nAttempting to verify imported data for player_season_averages (first 3 rows):")
    conn_verify = None
    try:
        conn_verify = sqlite3.connect(DB_PATH)
        conn_verify.row_factory = sqlite3.Row
        cursor_verify = conn_verify.cursor()
        cursor_verify.execute("SELECT * FROM player_season_averages LIMIT 3;")
        rows = cursor_verify.fetchall()
        if rows:
            for row in rows:
                print(dict(row))
        else:
            print("No data found in 'player_season_averages' table after import.")

        print("\nAttempting to verify imported data for player_season_totals (first 3 rows):")
        cursor_verify.execute("SELECT * FROM player_season_totals LIMIT 3;")
        rows = cursor_verify.fetchall()
        if rows:
            for row in rows:
                print(dict(row))
        else:
            print("No data found in 'player_season_totals' table after import.")

    except sqlite3.Error as e:
        print(f"Error verifying data: {e}")
    finally:
        if conn_verify:
            conn_verify.close()

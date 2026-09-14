import sqlite3
import os
from typing import List, Dict, Any, Tuple

DB = os.path.expanduser("~/Projects/SteamBot/games.db")

def get_db_connection():
    
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    
    return conn

def execute_query(sql : str, params : Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
    
    conn = get_db_connection()

    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()

        return [dict(row) for row in rows]
    
    finally:
        conn.close()

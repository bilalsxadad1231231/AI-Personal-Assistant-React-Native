import sqlite3
import os
from typing import Optional, Dict, Any

DATABASE_PATH = "app.db"

def init_db():
    """Initialize the database and create tables if they don't exist"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

def get_db():
    """Get a database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get a user by email"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get a user by username"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    return dict(user) if user else None

def create_user(username: str, email: str, hashed_password: str) -> Dict[str, Any]:
    """Create a new user"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (username, email, hashed_password) VALUES (?, ?, ?)",
        (username, email, hashed_password)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": hashed_password
    }

# Initialize the database when the module is imported
init_db() 
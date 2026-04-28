import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection():
    """Get database connection with error handling"""
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD", "")
        )
        return conn
        
    except mysql.connector.Error as err:
        print(f"MySQL Error: {err}")
        print(f"Error Code: {err.errno}")
        print(f"SQL State: {err.sqlstate}")
        return None
        
    except Exception as e:
        print(f"Database connection error: {e}")
        print(f"Error type: {type(e).__name__}")
        return None
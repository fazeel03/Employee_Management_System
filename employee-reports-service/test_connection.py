from database import get_connection
import os
import sys
import traceback

def test_connection():
    print("Starting database connection test...")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    # Check environment variables
    print(f"\nCurrent directory: {os.getcwd()}")
    print(f".env file exists: {os.path.exists('.env')}")
    
    # Print environment variables
    env_vars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    print("\nEnvironment Variables:")
    for var in env_vars:
        value = os.getenv(var)
        print(f"{var}: {'[SET]' if value else '[NOT SET]'}")
    
    print("\n" + "="*50)
    print("Attempting database connection...")
    print("="*50)
    
    try:
        conn = get_connection()
        
        if conn:
            print("\n[SUCCESS] Database connection established!")
            print(f"Connection ID: {getattr(conn, 'connection_id', 'N/A')}")
            
            # Test a simple query
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT DATABASE(), VERSION()")
                db_name, version = cursor.fetchone()
                print(f"Connected to database: {db_name}")
                print(f"MySQL version: {version}")
                cursor.close()
            except Exception as query_error:
                print(f"[WARNING] Could not execute test query: {query_error}")
            
            conn.close()
            print("\n[SUCCESS] Connection closed successfully")
            return True
        else:
            print("\n[FAILED] get_connection() returned None")
            print("Check database.py for error messages above")
            return False
            
    except Exception as e:
        print(f"\n[EXCEPTION] {str(e)}")
        print(f"Error type: {type(e).__name__}")
        print("\nFull traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n" + "="*50)
    print("DATABASE CONNECTION TEST")
    print("="*50 + "\n")
    
    success = test_connection()
    
    print("\n" + "="*50)
    if success:
        print("TEST RESULT: PASSED")
    else:
        print("TEST RESULT: FAILED")
    print("="*50 + "\n")
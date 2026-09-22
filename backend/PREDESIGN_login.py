
import getpass # provides censorship for pw input
import os # cross-platform func.

import bcrypt # encryption
import pyodbc # connect to db

MAX_ATTEMPTS = 3


def get_connection():
    # Connects straight to SQL Server on the Docker port
    conn_str = (
        f"DRIVER={{{os.environ.get('DB_DRIVER', 'ODBC Driver 18 for SQL Server')}}};"
        f"SERVER={os.environ.get('DB_HOST', 'localhost')},{os.environ.get('DB_PORT', '1433')};"
        f"DATABASE={os.environ['DB_NAME']};"
        f"UID={os.environ['DB_USER']};"
        f"PWD={os.environ['DB_PASSWORD']};"
        "TrustServerCertificate=yes;"  
    )
    return pyodbc.connect(conn_str)


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_login(username, password):
    conn = get_connection() # Connect to SQL Server
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT password_hash FROM users WHERE username = ?",
            (username,),
        )
        row = cur.fetchone()
    finally:
        conn.close() # Close connection after fetch

    if row is None: # Username does not exist in db
        return False
    return bcrypt.checkpw(password.encode("utf-8"), row[0].encode("utf-8"))


def main():
    for attempt in range(1, MAX_ATTEMPTS + 1):
        username = input("Username: ")
        password = getpass.getpass("Password: ") # Censored input

        if check_login(username, password):
            print("Login successful!")
            return True

        print(f"Invalid username or password. ({attempt}/{MAX_ATTEMPTS})")

    print("Too many failed attempts.")
    return False


if __name__ == "__main__":
    main()

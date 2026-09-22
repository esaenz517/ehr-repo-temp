"""Create a new login in the SQL Server `users` table used by login.py.

Only the username and password hash are stored here. The email address is
used as the username, so people log in with login.py using their email.
Personal details (name, ID number, etc.) belong in the separate account module.

Run this SQL in CloudBeaver first (in the same database as DB_NAME):

    CREATE TABLE users (
        username      NVARCHAR(254) NOT NULL PRIMARY KEY,   -- the email address
        password_hash NVARCHAR(100) NOT NULL
    );

Run:  python create_account.py     (uses the same DB_* environment variables as login.py)
"""
import getpass
import re
import string

import pyodbc

from login import get_connection, hash_password

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
MIN_PASSWORD_LENGTH = 12
MAX_PASSWORD_BYTES = 72  # bcrypt cannot use more than 72 bytes of a password


def is_valid_email(email):
    """Format check only: it can't tell whether the mailbox actually exists."""
    return len(email) <= 254 and EMAIL_PATTERN.fullmatch(email) is not None


def password_problems(password):
    """Return a list of unmet requirements (an empty list means the password is OK)."""
    problems = []
    if len(password) < MIN_PASSWORD_LENGTH:
        problems.append(f"be at least {MIN_PASSWORD_LENGTH} characters long")
    if not any(c.isupper() for c in password):
        problems.append("contain at least 1 uppercase letter")
    if not any(c.islower() for c in password):
        problems.append("contain at least 1 lowercase letter")
    if not any(c.isdigit() for c in password):
        problems.append("contain at least 1 number")
    if not any(c in string.punctuation for c in password):
        problems.append("contain at least 1 special character (for example ! @ # $ %)")
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        problems.append(f"be no longer than {MAX_PASSWORD_BYTES} bytes")
    return problems


def ask_email():
    """Keep asking until a validly formatted email address is entered."""
    while True:
        email = input("Email address: ").strip()
        if is_valid_email(email):
            return email.lower()
        print("That doesn't look like a valid email address.")


def choose_password():
    """Ask for a password (hidden), check the rules, and require it to be re-entered."""
    while True:
        password = getpass.getpass("Password: ")
        problems = password_problems(password)
        if problems:
            print("Your password must:")
            for problem in problems:
                print(f"  - {problem}")
            continue

        if getpass.getpass("Re-enter password: ") != password:
            print("Passwords do not match. Please try again.")
            continue

        return password


def account_exists(username):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM users WHERE username = ?", (username,))
        return cur.fetchone() is not None
    finally:
        conn.close()


def create_account(username, password):
    """Hash the password and store the username and hash. Returns True on success."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, hash_password(password)),
        )
        conn.commit()
        return True
    except pyodbc.IntegrityError:
        # Someone registered the same email between our check and the insert.
        return False
    finally:
        conn.close()


def main():
    print("Create a new account\n")

    username = ask_email()

    # Check before asking for a password so nobody types one for nothing.
    if account_exists(username):
        print("An account with that email already exists.")
        return False

    password = choose_password()

    if create_account(username, password):
        print("Account created! You can now log in with your email address.")
        return True

    print("An account with that email already exists.")
    return False


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled.")

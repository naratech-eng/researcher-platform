# etl/db_connector.py

import os
import mysql.connector
import psycopg2
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

def get_mysql_connection():
    """Establishes a connection to the source MySQL database."""
    try:
        conn = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DB")
        )
        print("Successfully connected to MySQL.")
        return conn
    except mysql.connector.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def get_postgres_connection():
    """Establishes a connection to the destination PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            dbname=os.getenv("POSTGRES_DB")
        )
        print("Successfully connected to PostgreSQL.")
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

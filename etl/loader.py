# etl/loader.py

import pandas as pd
from sqlalchemy import create_engine
import os

def get_sqlalchemy_engine():
    """Creates a SQLAlchemy engine for the destination PostgreSQL database."""
    try:
        engine_url = (
            f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:"
            f"{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}/"
            f"{os.getenv('POSTGRES_DB')}"
        )
        engine = create_engine(engine_url)
        print("Successfully created SQLAlchemy engine.")
        return engine
    except Exception as e:
        print(f"Error creating SQLAlchemy engine: {e}")
        return None

def load_data(data_to_load, engine):
    """Loads the transformed data into the destination PostgreSQL database.

    Args:
        data_to_load: A dictionary of transformed pandas DataFrames.
        engine: A SQLAlchemy engine object for the destination database.
    """
    print("Starting data loading...")
    try:
        for table_name, df in data_to_load.items():
            print(f"  - Loading data into table: {table_name.lower()}")
            # Use the table name in lowercase as PostgreSQL is case-sensitive
            df.to_sql(
                name=table_name.lower(),
                con=engine,
                if_exists='append', # Append data to the table
                index=False       # Do not write the DataFrame index as a column
            )
            print(f"    -> Loaded {len(df)} rows.")
        print("Data loading completed.")
    except Exception as e:
        print(f"An error occurred during data loading: {e}")

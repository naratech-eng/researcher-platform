# etl/extractor.py

import pandas as pd

def extract_data(connection, table_names):
    """Extracts data from a list of tables into a dictionary of pandas DataFrames.

    Args:
        connection: An active database connection object.
        table_names: A list of table names to extract data from.

    Returns:
        A dictionary where keys are table names and values are pandas DataFrames.
    """
    data = {}
    print("Starting data extraction...")
    try:
        for table_name in table_names:
            print(f"  - Extracting from table: {table_name}")
            query = f"SELECT * FROM {table_name};"
            df = pd.read_sql(query, connection)
            data[table_name] = df
            print(f"    -> Extracted {len(df)} rows.")
        print("Data extraction completed.")
        return data
    except Exception as e:
        print(f"An error occurred during data extraction: {e}")
        return None

# Main ETL script for migrating data from the old sheep_db to the new normalized schema.

from db_connector import get_mysql_connection, get_postgres_connection
from extractor import extract_data
from transformer import transform_data
from loader import get_sqlalchemy_engine, load_data

def main():
    """Main function to orchestrate the ETL process."""
    print("=================================================")
    print("=== Starting Database Migration ETL Process ===")
    print("=================================================")

    # Define which tables to extract from the source database
    tables_to_extract = [
        'Animals',
        'Pedigree',
        'Gproofs2',
        'Rproofs2',
        'MilkWts',
        'MilkComs',
        'Ultra',
        'QCarcass',
        'ScrapieG',
        'Breeds',
        'DisposalCodes',
        'TraitCodesNew'
    ]

    # --- 1. Connect and Extract ---
    mysql_conn = get_mysql_connection()
    if not mysql_conn:
        return
    raw_data = extract_data(mysql_conn, tables_to_extract)
    mysql_conn.close()
    if not raw_data:
        return

    # --- 2. Transform ---
    transformed_data = transform_data(raw_data)
    if not transformed_data:
        return

    # --- 3. Load ---
    # Note: Before running this, ensure the destination tables are created.
    # You can run the 'database/schema.sql' script to set them up.
    sqlalchemy_engine = get_sqlalchemy_engine()
    if not sqlalchemy_engine:
        return
    load_data(transformed_data, sqlalchemy_engine)

    print("=================================================")
    print("===      Database Migration Completed       ===")
    print("=================================================")

if __name__ == "__main__":
    main()

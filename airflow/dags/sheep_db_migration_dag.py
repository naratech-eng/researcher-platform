# airflow/dags/sheep_db_migration_dag.py

from __future__ import annotations

import pendulum
from airflow.models.dag import DAG
from airflow.operators.python import PythonOperator

# Assuming the 'etl' scripts are in a directory accessible to Airflow
# This might require adding the path to PYTHONPATH in your Airflow environment
from etl.db_connector import get_mysql_connection
from etl.extractor import extract_data
from etl.transformer import transform_data
from etl.loader import get_sqlalchemy_engine, load_data


def _extract_task():
    """Airflow task to extract data from the source database."""
    print("--- Starting Extract Task ---")
    tables_to_extract = [
        'Animals', 'Pedigree', 'Gproofs2', 'Rproofs2', 'MilkWts',
        'MilkComs', 'Ultra', 'QCarcass', 'ScrapieG', 'Breeds',
        'DisposalCodes', 'TraitCodesNew'
    ]
    conn = get_mysql_connection()
    if not conn:
        raise ConnectionError("Failed to connect to source MySQL database.")
    
    raw_data = extract_data(conn, tables_to_extract)
    conn.close()
    
    if not raw_data:
        raise ValueError("Extraction failed, no data returned.")
    
    # Airflow will automatically pass this return value via XComs
    return {table: df.to_json() for table, df in raw_data.items()}

def _transform_task(ti):
    """Airflow task to transform the extracted data."""
    print("--- Starting Transform Task ---")
    json_data = ti.xcom_pull(task_ids='extract_data_task')
    if not json_data:
        raise ValueError("Did not receive data from extraction task.")
    
    import pandas as pd
    raw_data = {table: pd.read_json(df_json) for table, df_json in json_data.items()}
    
    transformed_data = transform_data(raw_data)
    
    if not transformed_data:
        raise ValueError("Transformation failed, no data returned.")

    return {table: df.to_json() for table, df in transformed_data.items()}

def _load_task(ti):
    """Airflow task to load the transformed data into the destination database."""
    print("--- Starting Load Task ---")
    json_data = ti.xcom_pull(task_ids='transform_data_task')
    if not json_data:
        raise ValueError("Did not receive data from transformation task.")
    
    import pandas as pd
    transformed_data = {table: pd.read_json(df_json) for table, df_json in json_data.items()}
    
    engine = get_sqlalchemy_engine()
    if not engine:
        raise ConnectionError("Failed to connect to destination PostgreSQL database.")
        
    load_data(transformed_data, engine)
    print("--- Load Task Completed ---")


with DAG(
    dag_id='sheep_db_migration',
    start_date=pendulum.datetime(2023, 1, 1, tz="UTC"),
    schedule=None,  # This DAG is manually triggered
    catchup=False,
    tags=['database', 'migration', 'etl'],
    doc_md="""
    ### Sheep DB Migration DAG

    This DAG orchestrates the migration of data from the local sheep_db (MySQL)
    to a new normalized schema in an RDS PostgreSQL database.
    """
) as dag:
    extract_data_task = PythonOperator(
        task_id='extract_data_task',
        python_callable=_extract_task,
    )

    transform_data_task = PythonOperator(
        task_id='transform_data_task',
        python_callable=_transform_task,
    )

    load_data_task = PythonOperator(
        task_id='load_data_task',
        python_callable=_load_task,
    )

    extract_data_task >> transform_data_task >> load_data_task

# etl/transformer.py

import pandas as pd

def transform_data(raw_data):
    """Transforms the raw data to fit the new normalized schema.

    Args:
        raw_data: A dictionary of pandas DataFrames from the extractor.

    Returns:
        A dictionary of transformed pandas DataFrames ready for loading.
    """
    print("Starting data transformation...")
    transformed_data = {}

    # 1. Transform Animals table (split into Animals and AnimalMetrics)
    print("  - Transforming Animals data...")
    animals_df = raw_data['Animals'].copy()
    
    # Rename core columns
    animals_renamed = animals_df.rename(columns={
        'id': 'animal_id',
        'ropid': 'farmer_id',
        'birthdate': 'birth_date',
        'discode': 'disposal_code',
        'disdate': 'disposal_date'
    })

    # Create the new Animals table
    transformed_data['Animals'] = animals_renamed[
        ['animal_id', 'farmer_id', 'breed', 'sex', 'birth_date', 'disposal_code', 'disposal_date']
    ]

    # Create the new AnimalMetrics table
    transformed_data['AnimalMetrics'] = animals_renamed[
        ['animal_id', 'age50', 'adjwt50', 'adg50', 'age100', 'adjwt100', 'adg100']
    ].rename(columns={
        'age50': 'age_50_days',
        'adjwt50': 'adjusted_weight_50_days',
        'adg50': 'avg_daily_gain_50_days',
        'age100': 'age_100_days',
        'adjwt100': 'adjusted_weight_100_days',
        'adg100': 'avg_daily_gain_100_days'
    })

    # 2. Transform Pedigree
    print("  - Transforming Pedigree data...")
    pedigree_df = raw_data['Pedigree'].copy()
    transformed_data['Pedigree'] = pedigree_df.rename(columns={
        'id': 'animal_id',
        'damid': 'dam_id',
        'sireid': 'sire_id'
    })[['animal_id', 'dam_id', 'sire_id']]

    # 3. Merge Gproofs2 and Rproofs2 into GeneticProofs
    print("  - Merging Gproofs2 and Rproofs2 into GeneticProofs...")
    gproofs_df = raw_data['Gproofs2'].rename(columns={'id': 'animal_id'})
    rproofs_df = raw_data['Rproofs2'].rename(columns={'id': 'animal_id'})
    # An outer merge handles cases where an animal might have one type of proof but not the other
    genetic_proofs_df = pd.merge(gproofs_df, rproofs_df, on='animal_id', how='outer')
    transformed_data['GeneticProofs'] = genetic_proofs_df
    # Note: Further column renaming for proofs can be done here.

    # TODO: Add transformations for HealthRecords and ProductionData

    print("Data transformation completed.")
    return transformed_data

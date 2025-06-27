-- =============================================================================
-- Final Normalized Schema for the Genetic Researcher Platform
-- =============================================================================

-- This SQL script creates the tables for the new, normalized PostgreSQL database.
-- It is based on the ERD and schema defined in 'docs/final-normalized-schema.md'.

-- =============================================================================
-- 1. Reference Tables (Lookups)
-- =============================================================================

-- Stores breed information.
CREATE TABLE Breeds (
    code VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255)
);

-- Stores reasons for animal disposal.
CREATE TABLE DisposalCodes (
    code VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255)
);

-- Stores definitions for genetic traits.
CREATE TABLE TraitCodes (
    code VARCHAR(255) PRIMARY KEY,
    description VARCHAR(255)
);

-- =============================================================================
-- 2. Core Tables
-- =============================================================================

-- The central table for all individual animals.
-- This is the single source of truth for core animal attributes.
CREATE TABLE Animals (
    animal_id VARCHAR(16) PRIMARY KEY,
    farmer_id VARCHAR(16) NOT NULL, -- Links to the Users table in DynamoDB
    breed_code VARCHAR(255),
    sex CHAR(1),
    birth_date DATE,
    disposal_code VARCHAR(255),
    disposal_date DATE,
    FOREIGN KEY (breed_code) REFERENCES Breeds(code),
    FOREIGN KEY (disposal_code) REFERENCES DisposalCodes(code)
);

-- Stores the direct parent-offspring lineage.
CREATE TABLE Pedigree (
    animal_id VARCHAR(16) PRIMARY KEY,
    dam_id VARCHAR(16),
    sire_id VARCHAR(16),
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE,
    FOREIGN KEY (dam_id) REFERENCES Animals(animal_id) ON DELETE SET NULL,
    FOREIGN KEY (sire_id) REFERENCES Animals(animal_id) ON DELETE SET NULL
);

-- =============================================================================
-- 3. Data Tables (Metrics, Proofs, Health, Production)
-- =============================================================================

-- Stores calculated growth metrics.
CREATE TABLE AnimalMetrics (
    animal_id VARCHAR(16) PRIMARY KEY,
    age_50_days INT,
    adjusted_weight_50_days FLOAT,
    avg_daily_gain_50_days FLOAT,
    age_100_days INT,
    adjusted_weight_100_days FLOAT,
    avg_daily_gain_100_days FLOAT,
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- A merged table for all genetic evaluation results (Genomic and Reproductive).
CREATE TABLE GeneticProofs (
    animal_id VARCHAR(16) PRIMARY KEY,
    -- Representative columns from Gproofs2
    g_parity INT,
    gebv_direct_1 FLOAT,
    g_accuracy_direct_1 INT,
    -- Representative columns from Rproofs2
    r_parity INT,
    rebv_1 FLOAT,
    r_accuracy_1 INT,
    -- NOTE: All other columns from Gproofs2 and Rproofs2 will be added here
    -- with clean, consistent names during the ETL process.
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- Stores health-related records like ultrasound, carcass, and scrapie tests.
CREATE TABLE HealthRecords (
    record_id SERIAL PRIMARY KEY,
    animal_id VARCHAR(16) NOT NULL,
    record_date DATE,
    record_type VARCHAR(50), -- e.g., 'ultrasound', 'carcass', 'scrapie'
    -- Ultrasound Data
    ultrasound_loin_depth FLOAT,
    ultrasound_fat_depth FLOAT,
    -- Carcass Data
    carcass_weight FLOAT,
    -- Scrapie Data
    scrapie_genotype VARCHAR(50),
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- Stores milk production and composition data.
CREATE TABLE ProductionData (
    record_id SERIAL PRIMARY KEY,
    animal_id VARCHAR(16) NOT NULL,
    record_date DATE,
    milk_weight FLOAT,
    milk_fat_pct FLOAT,
    milk_protein_pct FLOAT,
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- =============================================================================
-- End of Schema
-- =============================================================================

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

-- Stores farmer and farm contact information.
CREATE TABLE Users (
    farmer_id VARCHAR(16) PRIMARY KEY,
    farm_name VARCHAR(30),
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    address VARCHAR(50),
    city VARCHAR(50),
    province VARCHAR(8),
    postcode VARCHAR(8),
    country VARCHAR(2),
    email VARCHAR(50),
    phone VARCHAR(25)
);

-- The central table for all individual animals.
-- This is the single source of truth for core animal attributes.
CREATE TABLE Animals (
    animal_id VARCHAR(16) PRIMARY KEY,
    farmer_id VARCHAR(16) NOT NULL, 
    breed_code VARCHAR(255),
    sex CHAR(1),
    birth_date DATE,
    disposal_code VARCHAR(255),
    disposal_date DATE,
    FOREIGN KEY (breed_code) REFERENCES Breeds(code),
    FOREIGN KEY (disposal_code) REFERENCES DisposalCodes(code),
    FOREIGN KEY (farmer_id) REFERENCES Users(farmer_id)
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
    record_type VARCHAR(50), 
    -- Ultrasound Data
    ultrasound_loin_depth FLOAT,
    ultrasound_fat_depth FLOAT,
    ultrasound_live_weight FLOAT,
    ultrasound_fat_1 FLOAT,
    ultrasound_fat_2 FLOAT,
    ultrasound_fat_3 FLOAT,
    ultrasound_avg_fat FLOAT,
    ultrasound_adjusted_loin_depth FLOAT,
    -- Carcass Data
    carcass_weight FLOAT,
    carcass_fat_score INT,
    carcass_shoulder_score INT,
    carcass_loin_score INT,
    carcass_leg_score INT,
    carcass_smy_score INT,
    carcass_ranking VARCHAR(16),
    carcass_index INT,
    carcass_remark_1 VARCHAR(255),
    carcass_remark_2 VARCHAR(255),
    carcass_remark_3 VARCHAR(255),
    carcass_classifier VARCHAR(255),
    carcass_plant VARCHAR(255),
    -- Scrapie Data
    scrapie_genotype VARCHAR(50),
    scrapie_lab_name VARCHAR(255),
    scrapie_codon_136 VARCHAR(10),
    scrapie_codon_154 VARCHAR(10),
    scrapie_codon_171 VARCHAR(10),
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
-- 4. Reproduction and Traceability
-- =============================================================================

-- Records individual mating events between ewes and rams.
CREATE TABLE Matings (
    mating_id SERIAL PRIMARY KEY,
    ewe_id VARCHAR(16) NOT NULL,
    ram_id VARCHAR(16) NOT NULL,
    mating_date DATE,
    mating_type VARCHAR(50),
    management_group VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (ewe_id) REFERENCES Animals(animal_id) ON DELETE CASCADE,
    FOREIGN KEY (ram_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- Records movements of animals between locations or management groups.
CREATE TABLE AnimalMoves (
    move_id SERIAL PRIMARY KEY,
    animal_id VARCHAR(16) NOT NULL,
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    move_date DATE,
    reason VARCHAR(255),
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE CASCADE
);

-- High-level traceability reports (e.g., regulatory or health events).
CREATE TABLE TraceReports (
    report_id SERIAL PRIMARY KEY,
    farmer_id VARCHAR(16),
    report_date DATE,
    report_type VARCHAR(50),
    description VARCHAR(255),
    FOREIGN KEY (farmer_id) REFERENCES Users(farmer_id)
);

-- Detailed records associated with traceability reports.
CREATE TABLE TraceRecords (
    record_id SERIAL PRIMARY KEY,
    report_id INT NOT NULL,
    animal_id VARCHAR(16),
    event_date DATE,
    event_type VARCHAR(50),
    details VARCHAR(255),
    FOREIGN KEY (report_id) REFERENCES TraceReports(report_id) ON DELETE CASCADE,
    FOREIGN KEY (animal_id) REFERENCES Animals(animal_id) ON DELETE SET NULL
);

-- =============================================================================
-- End of Schema
-- =============================================================================

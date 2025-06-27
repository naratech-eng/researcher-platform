# Database Migration and Cleanup Plan

This document outlines the table management strategy for migrating the `sheep_db` database to a new, streamlined schema for the Genetic Researcher Platform.

## Table Management Summary

The following tables have been analyzed and designated to either be **kept** in the new schema or **removed** (mitigated) to reduce redundancy and improve clarity.

### Tables to KEEP

These tables are essential for the core functionality of the platform.

| Table Name      | Purpose                                            |
| :-------------- | :------------------------------------------------- |
| `Users`         | User and farm information.                         |
| `Animals`       | Core data for each individual animal.              |
| `AnimalMoves`   | Tracks the movement of animals between locations.  |
| `Breeds`        | Reference table for breed information.             |
| `Pedigree`      | Internal parent-offspring lineage data.            |
| `MilkWts`       | Milk weight records for analysis.                  |
| `TraitCodesNew` | The most current reference for genetic trait codes.|
| `Ultra`         | Ultrasound data (e.g., for carcass traits).        |
| `progenyall`    | Summary of all progeny for an animal.              |
| `DisposalCodes` | Reference for animal disposal/exit reasons.        |
| `Matings`       | Records of planned or completed matings.           |
| `Gproofs2`      | **Genomic evaluation results** for animals.        |
| `MilkComs`      | Milk composition data (e.g., fat, protein).        |
| `QCarcass`      | Carcass quality data from evaluations.             |
| `Rproofs2`      | Reproductive proofs and evaluation results.        |
| `ScrapieG`      | Scrapie genotype information.                      |

### Tables to REMOVE

These tables are redundant, outdated, or not essential for the new architecture.

| Table Name                 | Reason for Removal                                     |
| :------------------------- | :----------------------------------------------------- |
| `epdav2New`, `epdav`, `epdav2` | Redundant summary data. Can be calculated on demand.   |
| `AnimalsBU`, `BreedsOLD`   | Obvious backup or old version tables.                  |
| `CLRCPedigree`             | Separate, official data not well-linked to internal IDs.|
| `MilkWeights`              | Redundant, as `MilkWts` is being kept.                 |
| `TraitCodes`               | Old version, as `TraitCodesNew` is being kept.         |
| `QCarcass20171109`, `QCarcassOriginalData` | Old or raw data, as `QCarcass` is the primary. |
| `testTable`, `JobBackup`   | Temporary or backup tables.                            |
| `Gproofs`, `Rproofs`       | Likely older versions of `Gproofs2` and `Rproofs2`.    |

---

*This plan will be used to guide the database schema design and migration scripts.*

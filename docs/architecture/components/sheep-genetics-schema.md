# Sheep Genetics Database Schema

## Overview

The Animal Genetics Research Platform utilizes a comprehensive database schema designed specifically for sheep genetics research and breeding management. This schema supports the collection, analysis, and application of genetic and phenotypic data across research and farming contexts.

## Core Data Entities

The database is organized around several interconnected entities that together provide a complete picture of animal genetics and performance:

### Animals

The central entity that stores comprehensive information about each individual animal in the system:

- Unique identification through multiple ID systems (internal, national, registration)
- Basic information including name and breed association
- Growth measurements at key developmental stages
- Weight tracking with adjustments for standardized comparison
- Growth rate calculations for performance evaluation
- Management grouping for environmental context

### Pedigree

Tracks the family relationships and genetic background of each animal:

- Parental connections (dam and sire linkages)
- Sex designation and breed information
- Birth date and generational status
- Inbreeding and ancestry coefficients for genetic diversity management

### Genetic Evaluations

Stores estimated breeding values (EBVs) and other genetic merit indicators:

- Direct and maternal breeding values for multiple traits
- Percentile rankings for comparative assessment
- Composite indexes for different breeding objectives:
  - Growth performance
  - Maternal ability
  - Terminal (meat) production
  - Combined production indexes

### Reproductive Performance

Captures breeding success metrics and reproductive traits:

- Reproductive history including number of breeding cycles
- Offspring production statistics
- Breeding values for key reproductive traits
- Comparative rankings for reproductive performance

### Inbreeding Analysis

Specialized calculations to monitor genetic diversity:

- Inbreeding coefficients to assess potential genetic issues
- Tools for managing genetic diversity in breeding programs

### Breeding Activities

Records of actual mating events and breeding decisions:

- Breeding pair information with date ranges
- Management context for environmental factors
- Breeding method classification
- Location and grouping details

### Breeding Predictions

Forecasts of potential offspring performance from specific matings:

- Expected progeny performance for key traits
- Percentile rankings for offspring potential
- Projected inbreeding coefficients for genetic health

### Breed Reference

Standard information about recognized sheep breeds:

- Standardized breed codes and naming
- Size classifications
- Multilingual breed naming for international use

### Carcass Quality

Meat production and quality assessment metrics:

- Slaughter weight and timing data
- Fat scoring and distribution
- Muscle development by body region
- Overall meat yield and quality indexes

### Weight History

Detailed tracking of animal growth over time:

- Sequential weight measurements with dates
- Age-correlated weight data for growth curve analysis

### Trait Definitions

Reference information for standardized trait evaluation:

- Standardized trait codes
- Multilingual trait descriptions for international collaboration

## Data Relationships

The schema implements several key relationships that enable powerful analysis:

1. **Animal Lineage Tracking**: Animals connect to their ancestors through the pedigree system, enabling multi-generational analysis
2. **Performance Measurement**: Animals link to multiple weight records, allowing growth curve analysis
3. **Genetic Evaluation**: Animals connect to their genetic proofs, enabling selection decisions
4. **Breeding Management**: The system tracks actual matings and predicts outcomes of potential pairings
5. **Quality Assessment**: Carcass data links to animals for meat quality improvement programs

## Schema Applications

This database schema supports several critical functions within the platform:

- **Genetic Improvement Programs**: Tracking genetic merit across generations
- **Breeding Decision Support**: Providing data for optimal mating decisions
- **Performance Benchmarking**: Comparing animals within management groups
- **Research Analysis**: Supporting statistical genetic studies
- **Farmer Decision Tools**: Translating complex genetic data into practical recommendations

## Integration Points

The schema is designed to integrate with:

- Farm management software used by sheep producers
- Research tools used by animal geneticists
- Educational resources for students
- Industry databases for broader genetic evaluations

## Data Visualization

![Sheep Genetics Schema](../images/sheep-genetics-schema.mermaid)

The complete entity-relationship diagram illustrates the connections between all components of the sheep genetics database.

# Animal Genetics Research Platform – Project Overview

## Inspiration
Global food demand is climbing while climate challenges threaten livestock productivity. We saw an opportunity to unite farmers and researchers on a single cloud platform that pairs cutting-edge genomic science with practical on-farm decision tools. By blending AI, real-time data, and collaborative research workspaces, we aim to accelerate genetic gain and make sustainable farming accessible to all.

## What it does
The portal aggregates farm, genomic, and research data, then delivers:
- **Emilia AI co-pilot** – ChatGPT-style assistant for breeding advice and data insights.
- **Breeding & Mating Engine** – Runs BLUP/ML models to recommend optimal pairings.
- **Research Environment** – One-click RStudio and Jupyter notebooks backed by live platform datasets.
- **Unified Dashboard** – KPIs, health alerts, and analytics for farmers & scientists.
- **Collaboration Hub** – Shared projects, comments, and versioned datasets.

## How we built it
- **Frontend**: React (TS) + Tailwind; PWA & React Native for field use.
- **APIs**: Bun.js user API, FastAPI research API; secured by Kong & AWS ALB.
- **AI Layer**: Emilia RAG (Neo4j + ChromaDB) with LLM gateway; PubMed/Nature ingest via Airflow.
- **Data**: PostgreSQL RDS, DynamoDB, Neo4j graph, S3 for objects; Kafka & CDC for real-time sync.
- **Research tools**: Containerised RStudio Server & JupyterHub.
- **DevOps**: Jenkins CI, ArgoCD GitOps, Helm charts; Prometheus-Grafana & ELK for observability.
- **Deploy**: Two-EC2 architecture + AWS managed services; cost-optimised with reserved instances.

## Challenges we ran into
1. Designing a minimal yet scalable two-EC2 topology without sacrificing availability.
2. Building a seamless data pipeline from farm devices to AI models in near real-time.
3. Harmonising security across mixed workloads (APIs, notebooks, AI) and diverse user roles.
4. Keeping costs predictable while storing large genomic datasets and vectors.

## Accomplishments that we're proud of
- Consolidated a complex microservice vision into a streamlined, cost-efficient stack.
- Integrated Neo4j + ChromaDB RAG to surface peer-reviewed research inside AI answers.
- Delivered end-to-end CI/CD with zero-downtime blue-green deploys in under eight weeks.
- Achieved WCAG 2.1 AA compliance for the entire UI.

## What we learned
- Graph-based RAG vastly improves domain-specific AI accuracy.
- Farmers value offline-first mobile design more than feature depth.
- Simplifying infrastructure early frees up cycles for user-facing polish.
- Clear knowledge boundaries between AI, analytics, and research tools reduce tech debt.

## What's next for Animal Research Portal
- **IoT Integration**: ingest sensor streams for health and environment data.
- **Marketplace**: secure exchange for genetic material and datasets.
- **Computer Vision**: mobile image capture for phenotype scoring.
- **Advanced Analytics (Beta)**: federated learning across farms.
- **Global Roll-out**: multi-region deployment & language localisation.

---
*Last updated: 2025-06-13*

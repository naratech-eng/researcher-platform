# AI-Powered Research Platform Architecture Diagrams
## Comprehensive Three-Part High-Level Architecture Overview

This document presents simplified architecture diagrams for an AI-powered research platform deployed on AWS EC2 with containerized infrastructure, featuring intelligent document retrieval and analysis capabilities.

> **Note**: These diagrams use simplified Mermaid flowchart syntax optimized for both light and dark mode viewing with consistent color theming.

---

## Part 1: Overall System Architecture

### AWS EC2 Containerized Infrastructure Overview

```mermaid
flowchart TB
    %% User Layer
    subgraph Users["Users"]
        Farmer[Farmers]
        Researcher[Researchers] 
        Student[Students]
        Admin[Administrators]
    end

    %% Frontend
    subgraph Frontend["Frontend Layer"]
        WebApp[React Web App]
        MobileApp[React Native Mobile]
    end

    %% Gateway
    subgraph Gateway["API Gateway"]
        LoadBalancer[Load Balancer]
        APIGateway[KONG Gateway]
    end

    %% Backend Cluster - AZ1A
    subgraph AZ1A["Availability Zone 1A"]
        subgraph BackendCluster["Backend EC2 Cluster"]
            UserAPI[User API]
            ResearchAPI[Research API]
            FastAPI[FastAPI Service]
        end
        
        subgraph ResearchCluster["Research EC2 Cluster"]
            RStudio[RStudio Server]
            Jupyter[JupyterHub]
            GPU[GPU Nodes]
        end
    end

    %% AI Cluster - AZ1B
    subgraph AZ1B["Availability Zone 1B"]
        subgraph AICluster["AI/RAG EC2 Cluster"]
            RAGEngine[RAG Engine]
            ChromaDB[ChromaDB]
            Neo4j[Neo4j Graph DB]
            LLMGateway[LLM Gateway]
        end
    end

    %% DevOps Cluster - AZ1C
    subgraph AZ1C["Availability Zone 1C"]
        subgraph DevOpsCluster["DevOps EC2 Cluster"]
            GitOps[ArgoCD]
            Monitoring[Prometheus]
            Logging[ELK Stack]
        end
    end

    %% Data Layer
    subgraph DataLayer["AWS Data Services"]
        PostgreSQL[(PostgreSQL RDS)]
        DynamoDB[(DynamoDB)]
        S3Storage[(S3 Storage)]
    end

    %% External APIs
    subgraph ExternalAPIs["External APIs"]
        PubMed[PubMed]
        Nature[Nature]
        ArXiv[ArXiv]
    end

    %% Connections
    Users --> Frontend
    Frontend --> Gateway
    Gateway --> BackendCluster
    BackendCluster --> DataLayer
    BackendCluster --> AICluster
    ResearchCluster --> S3Storage
    AICluster --> ExternalAPIs
    DevOpsCluster --> BackendCluster
    DevOpsCluster --> ResearchCluster
    DevOpsCluster --> AICluster

    %% Styling
    classDef primaryNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff
    classDef boldNode fill:#407AE9,stroke:#346DDB,stroke-width:2px,color:#fff
    classDef subtleNode fill:#BCCFEF,stroke:#346DDB,stroke-width:1px,color:#000
    classDef dataNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff

    class BackendCluster,AICluster,ResearchCluster,DevOpsCluster primaryNode
    class Gateway,DataLayer boldNode
    class Users,Frontend,ExternalAPIs subtleNode
    class PostgreSQL,DynamoDB,S3Storage dataNode
```

---

## Part 2: Emilia AI Architecture

### LangChain RAG Implementation with Dual Search Strategy

```mermaid
flowchart TB
    %% User Interface
    subgraph UserInterface["User Interface"]
        ChatWidget[Chat Interface]
        VoiceInput[Voice Input]
        FileUpload[File Upload]
    end

    %% FastAPI Layer
    subgraph FastAPILayer["FastAPI Service"]
        QueryProcessor[Query Processor]
        PromptEnhancer[Prompt Enhancer]
        ResponseFormatter[Response Formatter]
    end

    %% RAG Pipeline
    subgraph RAGPipeline["LangChain RAG Pipeline"]
        QueryAnalyzer[Query Analyzer]
        RetrievalOrchestrator[Retrieval Orchestrator]
        ContextMerger[Context Merger]
    end

    %% Vector Search
    subgraph VectorSearch["Vector Search System"]
        EmbeddingService[Embedding Service]
        ChromaDBVector[ChromaDB Vector Store]
        SimilaritySearch[Similarity Search]
    end

    %% Graph Search
    subgraph GraphSearch["Knowledge Graph System"]
        CypherGenerator[Cypher Generator]
        Neo4jGraph[Neo4j Graph DB]
        RelationshipFinder[Relationship Finder]
    end

    %% LLM Services
    subgraph LLMServices["LLM Services"]
        LLMRouter[LLM Router]
        GPT4[GPT-4]
        Claude[Claude]
        LocalLLM[Local LLM]
    end

    %% Knowledge Base
    subgraph KnowledgeBase["Knowledge Base"]
        ResearchPapers[Research Papers]
        GeneticData[Genetic Datasets]
        UserDocs[User Documents]
    end

    %% Connections
    UserInterface --> FastAPILayer
    FastAPILayer --> RAGPipeline
    RAGPipeline --> VectorSearch
    RAGPipeline --> GraphSearch
    VectorSearch --> ChromaDBVector
    GraphSearch --> Neo4jGraph
    VectorSearch --> ContextMerger
    GraphSearch --> ContextMerger
    ContextMerger --> LLMServices
    LLMServices --> ResponseFormatter
    KnowledgeBase --> ChromaDBVector
    KnowledgeBase --> Neo4jGraph

    %% Styling
    classDef primaryNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff
    classDef boldNode fill:#407AE9,stroke:#346DDB,stroke-width:2px,color:#fff
    classDef subtleNode fill:#BCCFEF,stroke:#346DDB,stroke-width:1px,color:#000
    classDef dataNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff

    class RAGPipeline,VectorSearch,GraphSearch primaryNode
    class FastAPILayer,LLMServices boldNode
    class UserInterface,KnowledgeBase subtleNode
    class ChromaDBVector,Neo4jGraph dataNode
```

---

## Part 3: ETL Pipeline for Neo4j

### Data Transformation from PostgreSQL to Graph Database

```mermaid
flowchart TB
    %% Source Systems
    subgraph Sources["Data Sources"]
        FarmerPortal[Farmer Portal]
        PostgreSQLDB[PostgreSQL DB]
        LegacySystems[Legacy Systems]
        ExternalFeeds[External Feeds]
    end

    %% Extraction Layer
    subgraph Extraction["Data Extraction"]
        PostgreSQLExtractor[PostgreSQL Extractor]
        APIExtractor[API Extractor]
        FileExtractor[File Extractor]
        CDC[Change Data Capture]
    end

    %% Staging Area
    subgraph Staging["Data Staging"]
        RawDataLake[Raw Data Lake]
        ValidatedData[Validated Data]
        ErrorQuarantine[Error Quarantine]
    end

    %% Transformation Engine
    subgraph Transformation["Data Transformation"]
        DataValidator[Data Validator]
        SchemaMapper[Schema Mapper]
        RelationshipBuilder[Relationship Builder]
        GraphFormatter[Graph Formatter]
    end

    %% Quality Control
    subgraph Quality["Quality Control"]
        DataProfiler[Data Profiler]
        QualityChecker[Quality Checker]
        AnomalyDetector[Anomaly Detector]
    end

    %% Loading Services
    subgraph Loading["Graph Loading"]
        Neo4jLoader[Neo4j Bulk Loader]
        IndexBuilder[Index Builder]
        ConstraintEnforcer[Constraint Enforcer]
    end

    %% Target Database
    subgraph Target["Neo4j Target"]
        AnimalNodes[Animal Nodes]
        FarmNodes[Farm Nodes]
        GeneticRelations[Genetic Relations]
        BreedingNetworks[Breeding Networks]
    end

    %% Orchestration
    subgraph Orchestration["Pipeline Orchestration"]
        AirflowScheduler[Airflow Scheduler]
        TaskMonitor[Task Monitor]
        AlertManager[Alert Manager]
    end

    %% Connections
    Sources --> Extraction
    Extraction --> Staging
    Staging --> Transformation
    Transformation --> Loading
    Loading --> Target
    Quality --> Transformation
    Orchestration --> Extraction
    Orchestration --> Transformation
    Orchestration --> Loading

    %% Styling
    classDef primaryNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff
    classDef boldNode fill:#407AE9,stroke:#346DDB,stroke-width:2px,color:#fff
    classDef subtleNode fill:#BCCFEF,stroke:#346DDB,stroke-width:1px,color:#000
    classDef dataNode fill:#346DDB,stroke:#407AE9,stroke-width:2px,color:#fff

    class Extraction,Transformation,Loading primaryNode
    class Staging,Quality,Orchestration boldNode
    class Sources,Target subtleNode
    class RawDataLake,ValidatedData,ErrorQuarantine dataNode
```

---

## Architecture Summary

### Key Components Overview

#### **Part 1 - Overall Architecture:**
- **Multi-AZ Deployment**: Three availability zones with dedicated EC2 clusters
- **Containerized Services**: Kubernetes orchestration across all clusters
- **API Gateway Layer**: Load balancing and API management with KONG
- **Data Services**: PostgreSQL RDS, DynamoDB, and S3 storage
- **External Integration**: Research APIs (PubMed, Nature, ArXiv)

#### **Part 2 - Emilia AI System:**
- **LangChain RAG Pipeline**: Advanced retrieval augmented generation
- **Dual Search Strategy**: Vector similarity + Knowledge graph traversal
- **Multi-LLM Support**: GPT-4, Claude, and local LLM options
- **Knowledge Base**: Research papers, genetic datasets, user documents
- **Real-time Processing**: Query analysis, context merging, response formatting

#### **Part 3 - ETL Pipeline:**
- **Multi-Source Extraction**: PostgreSQL, APIs, files, and change data capture
- **Data Quality Control**: Validation, profiling, and anomaly detection
- **Graph Transformation**: Schema mapping and relationship building
- **Bulk Loading**: Optimized Neo4j loading with indexing and constraints
- **Pipeline Orchestration**: Apache Airflow for workflow management

### Technology Stack

- **Container Platform**: Kubernetes on AWS EC2
- **AI Framework**: LangChain for RAG implementation
- **Vector Database**: ChromaDB for semantic search
- **Graph Database**: Neo4j for relationship modeling
- **Workflow Engine**: Apache Airflow for ETL orchestration
- **Monitoring**: Prometheus, Grafana, and ELK stack

### Data Flow

1. **User Requests** → Frontend → API Gateway → Backend Services
2. **AI Queries** → FastAPI → RAG Pipeline → Vector/Graph Search → LLM Services
3. **Data Pipeline** → Extraction → Staging → Transformation → Quality Control → Neo4j Loading

This simplified architecture provides clear separation of concerns while maintaining scalability and reliability for the AI-powered genetics research platform.
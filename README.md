# ⚖️ JurisBot - Assistant Juridique Marocain RAG

> Système intelligent de question-réponse juridique basé sur l'architecture RAG (Retrieval-Augmented Generation) avec LLM local.

## 📋 Description

JurisBot est un assistant juridique spécialisé dans le droit marocain. Il utilise un pipeline RAG complet pour répondre aux questions juridiques en se basant **uniquement** sur les documents PDF officiels indexés. Le système fournit des réponses sourcées avec citations précises (document, page, article).

## 🏗️ Architecture
┌─────────────────┐
│ React Frontend │ (Port 5173)
└────────┬────────┘
│ HTTP/JWT
▼
┌─────────────────┐
│ Spring Boot │ (Port 8080) - Auth, Users, Conversations
└────────┬────────┘
│ REST
▼
┌─────────────────┐
│ Flask RAG │ (Port 5001) - Pipeline IA
└────────┬────────┘
│
┌────┼────┬─────────┐
▼ ▼ ▼ ▼
Qdrant Redis Ollama MySQL
(Vector) (Cache) (LLM) (Data)


## 🛠️ Technologies

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** + **Material UI**
- **React Router** + **Axios**
- **React Markdown** + **Framer Motion**

### Backend Métier
- **Java 21** + **Spring Boot 3**
- **Spring Security** + **JWT**
- **JPA/Hibernate** + **MySQL**
- **Maven**

### Backend IA (RAG)
- **Python 3.10** + **Flask**
- **LangChain** + **Sentence Transformers**
- **Qdrant** (Vector DB)
- **Redis** (Cache)
- **Ollama** + **Llama 3.2** (LLM local)
- **PyMuPDF** (PDF parsing)

## ✨ Fonctionnalités

- 🔐 Authentification JWT (Login/Register)
- 💬 Chat en temps réel avec historique
- 📚 Réponses sourcées avec citations (document, page, article)
- 🌍 Multilingue (Français, Arabe, Anglais)
- ⭐ Évaluation des réponses (1-5 étoiles)
- 👑 Panel Administrateur (utilisateurs, documents, métriques)
- 📄 Upload et ingestion de PDFs
- 🎨 Interface moderne inspirée de ChatGPT
- 🔊 Reconnaissance vocale (Speech-to-Text)
- 💾 Cache Redis pour performances

## 📁 Structure du Projet
jurisbot-rag/
├── rag_pipeline/ # Backend IA (Flask)
│ ├── app/
│ │ ├── rag/ # Pipeline RAG
│ │ ├── llm/ # Ollama Client
│ │ ├── cache/ # Redis
│ │ └── api/ # Routes
│ ├── data/pdfs/ # Documents juridiques
│ ├── scripts/ # Ingestion
│ ├── config.py
│ └── requirements.txt
│
├── spring-boot-backend/ # Backend Métier (Java)
│ ├── src/main/java/
│ ├── src/main/java/
│ │ └── com/assistant/Rag/
│ │ ├── controller/ # REST APIs
│ │ ├── service/ # Business Logic
│ │ ├── entity/ # JPA Entities
│ │ ├── repository/ # Data Access
│ │ ├── security/ # JWT
│ │ └── dto/ # Data Transfer
│ └── pom.xml
│
└── react-frontend/ # Frontend (React)
├── src/
│ ├── components/ # UI Components
│ ├── pages/ # Pages
│ ├── context/ # State Management
│ ├── hooks/ # Custom Hooks
│ └── api/ # Axios Config
└── package.json


## 🚀 Installation & Lancement

### Prérequis
- Docker & Docker Compose
- Java 21+
- Python 3.10+
- Node.js 18+
- Ollama (avec llama3.2)

### 1. Démarrer les services Docker

```bash
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
docker run -d --name redis -p 6379:6379 redis:alpine
docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8.0

ollama serve
ollama pull llama3.2:3b

cd rag_pipeline
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
pip install -r requirements.txt

# Ingestion des PDFs
python scripts/ingest_pdfs.py

# Lancer le serveur
python run.py

cd assisatnt_rag  # backend springboot 
mvn clean install
mvn spring-boot:run

cd moroccan_rag-frontend
npm install
npm run dev

Pipeline RAG
Chargement : Extraction du texte des PDFs (PyMuPDF)

Nettoyage : Suppression des caractères spéciaux

Chunking : Découpage en morceaux de 500 caractères

Embeddings : Génération de vecteurs (multilingual-e5-base)

Indexation : Stockage dans Qdrant

Recherche : Retrieval MMR (Maximum Marginal Relevance)

Reranking : Cross-encoder pour pertinence

Génération : Ollama (Llama 3.2)

Cache : Redis pour réponses fréquentes
# config.py
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    PORT = int(os.getenv('FLASK_PORT', 5001))
    HOST = os.getenv('FLASK_HOST', '127.0.0.1')
    
    # Qdrant
    QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
    QDRANT_PORT = int(os.getenv('QDRANT_PORT', 6333))
    QDRANT_COLLECTION_NAME = os.getenv('QDRANT_COLLECTION_NAME', 'moroccan_law')
    QDRANT_VECTOR_SIZE = int(os.getenv('QDRANT_VECTOR_SIZE', 768))
    
    # Redis
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_CACHE_TTL = int(os.getenv('REDIS_CACHE_TTL', 86400))
    
    # Modèles
    EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'intfloat/multilingual-e5-base')
    RERANKER_MODEL = os.getenv('RERANKER_MODEL', 'cross-encoder/mmarco-mMiniLMv2-L12-H384-v1')
    
    #  Ollama 
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:3b')
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_TEMPERATURE = float(os.getenv('OLLAMA_TEMPERATURE', 0.3))
    OLLAMA_MAX_TOKENS = int(os.getenv('OLLAMA_MAX_TOKENS', 160))
    OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', 25))
    OLLAMA_NUM_CTX = int(os.getenv('OLLAMA_NUM_CTX', 2048))
    OLLAMA_KEEP_ALIVE = os.getenv('OLLAMA_KEEP_ALIVE', '10m')
    OLLAMA_STREAM = os.getenv('OLLAMA_STREAM', 'True').lower() == 'true'
    
    # RAG
    CHUNK_SIZE = int(os.getenv('CHUNK_SIZE', 500))
    CHUNK_OVERLAP = int(os.getenv('CHUNK_OVERLAP', 50))
    TOP_K = int(os.getenv('TOP_K', 5))
    RERANK_TOP_K = int(os.getenv('RERANK_TOP_K', 2))
    RERANK_MAX_CHARS = int(os.getenv('RERANK_MAX_CHARS', 800))
    PROMPT_MAX_CHARS_PER_DOC = int(os.getenv('PROMPT_MAX_CHARS_PER_DOC', 350))
    # Bump this when extraction or indexed document content changes so cached
    # answers from an older corpus are not served after re-ingestion.
    RAG_CACHE_VERSION = os.getenv('RAG_CACHE_VERSION', 'v6')
    
    # Chemins
    PROJECT_DIR = Path(__file__).resolve().parent
    PDF_DIR = os.path.abspath(os.getenv('PDF_DIR', str(PROJECT_DIR / 'data' / 'pdfs')))
    PDF_OCR_ENABLED = os.getenv('PDF_OCR_ENABLED', 'true').lower() == 'true'
    PDF_OCR_LANGUAGE = os.getenv('PDF_OCR_LANGUAGE', 'fra+eng+ara')
    PDF_OCR_DPI = int(os.getenv('PDF_OCR_DPI', 250))
    PDF_OCR_MIN_TEXT_CHARS = int(os.getenv('PDF_OCR_MIN_TEXT_CHARS', 30))

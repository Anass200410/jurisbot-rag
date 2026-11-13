import logging
from typing import Dict, Any
from config import Config
from app.rag.vector_store import VectorStore
from app.rag.embeddings import EmbeddingGenerator
from app.rag.retriever import Retriever
from app.rag.reranker import Reranker
from app.rag.prompt import PromptBuilder
from app.rag.rag_chain import RAGChain
from app.cache.redis_cache import RedisCache
from app.llm.ollama_client import OllamaClient  

logger = logging.getLogger(__name__)

class ChatService:
    """Service principal de chat avec Ollama uniquement"""
    
    def __init__(self, app):
        """Initialise tous les composants"""
        self.app = app
        
        logger.info("🚀 Initialisation du ChatService...")
        
        try:
            # 1. Vector Store
            logger.info("📦 Initialisation du Vector Store...")
            self.vector_store = VectorStore(
                host=Config.QDRANT_HOST,
                port=Config.QDRANT_PORT,
                collection_name=Config.QDRANT_COLLECTION_NAME,
                vector_size=Config.QDRANT_VECTOR_SIZE
            )
            
            # 2. Embeddings
            logger.info("🧮 Initialisation des Embeddings...")
            self.embedding_generator = EmbeddingGenerator(
                model_name=Config.EMBEDDING_MODEL
            )
            
            # 3. Retriever
            logger.info("🔍 Initialisation du Retriever...")
            self.retriever = Retriever(
                vector_store=self.vector_store,
                embedding_generator=self.embedding_generator,
                top_k=Config.TOP_K,
                use_mmr=True,
                lambda_mult=0.5
            )
            
            # 4. Reranker
            logger.info("🔄 Initialisation du Reranker...")
            self.reranker = Reranker(
                model_name=Config.RERANKER_MODEL,
                top_k=Config.RERANK_TOP_K,
                max_chars=Config.RERANK_MAX_CHARS
            )
            
            # 5. Prompt Builder
            logger.info("📝 Initialisation du Prompt Builder...")
            self.prompt_builder = PromptBuilder(
                max_chars_per_doc=Config.PROMPT_MAX_CHARS_PER_DOC
            )
            
            # 6.  Ollama Client uniquement
            logger.info(f"🤖 Utilisation de Ollama avec {Config.OLLAMA_MODEL}")
            self.llm_client = OllamaClient(
                model=Config.OLLAMA_MODEL,
                base_url=Config.OLLAMA_BASE_URL,
                temperature=Config.OLLAMA_TEMPERATURE,
                max_tokens=Config.OLLAMA_MAX_TOKENS,
                timeout=Config.OLLAMA_TIMEOUT,
                num_ctx=Config.OLLAMA_NUM_CTX,
                keep_alive=Config.OLLAMA_KEEP_ALIVE,
                stream=Config.OLLAMA_STREAM
            )
            
            # 7. Cache
            logger.info("💾 Initialisation du Cache Redis...")
            self.cache = RedisCache(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                db=Config.REDIS_DB,
                ttl=Config.REDIS_CACHE_TTL
            )
            
            # 8. RAG Chain
            logger.info("🔗 Initialisation du Pipeline RAG...")
            self.rag_chain = RAGChain(
                retriever=self.retriever,
                reranker=self.reranker,
                prompt_builder=self.prompt_builder,
                llm_client=self.llm_client,
                cache=self.cache,
                use_cache=True
            )
            
            logger.info("✅ ChatService initialisé avec succès!")
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'initialisation: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def process_question(self, question: str, language: str = 'fr') -> Dict[str, Any]:
        """Traite une question avec la langue spécifiée"""
        logger.info("📝 Traitement d'une question (%s caractères, langue=%s)", len(question), language)
        return self.rag_chain.process_query(question, language)

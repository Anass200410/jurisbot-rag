import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from app.rag.vector_store import VectorStore
from app.rag.embeddings import EmbeddingGenerator
from app.rag.retriever import Retriever
from app.rag.reranker import Reranker
from app.rag.prompt import PromptBuilder
from app.llm.ollama_client import OllamaClient
from app.cache.redis_cache import RedisCache
from app.rag.rag_chain import RAGChain
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_rag():
    try:
        logger.info("🧪 Test du pipeline RAG avec Ollama...")
        
        logger.info("📦 Initialisation des composants...")
        
        vector_store = VectorStore(
            host=Config.QDRANT_HOST,
            port=Config.QDRANT_PORT,
            collection_name=Config.QDRANT_COLLECTION_NAME,
            vector_size=Config.QDRANT_VECTOR_SIZE
        )
        
        info = vector_store.get_collection_info()
        logger.info(f"📊 Collection: {info}")
        
        if info.get('points_count', 0) == 0:
            logger.warning("⚠️ La collection est vide!")
            return
        
        embedder = EmbeddingGenerator(Config.EMBEDDING_MODEL)
        
        retriever = Retriever(
            vector_store=vector_store,
            embedding_generator=embedder,
            top_k=Config.TOP_K,
            use_mmr=True
        )
        
        reranker = Reranker(
            Config.RERANKER_MODEL,
            top_k=Config.RERANK_TOP_K,
            max_chars=Config.RERANK_MAX_CHARS
        )
        prompt_builder = PromptBuilder(
            max_chars_per_doc=Config.PROMPT_MAX_CHARS_PER_DOC
        )
        
        llm_client = OllamaClient(
            model=Config.OLLAMA_MODEL,
            base_url=Config.OLLAMA_BASE_URL,
            temperature=Config.OLLAMA_TEMPERATURE,
            max_tokens=Config.OLLAMA_MAX_TOKENS,
            timeout=Config.OLLAMA_TIMEOUT,
            num_ctx=Config.OLLAMA_NUM_CTX,
            keep_alive=Config.OLLAMA_KEEP_ALIVE
        )
        
        cache = RedisCache(
            host=Config.REDIS_HOST,
            port=Config.REDIS_PORT
        )
        
        rag_chain = RAGChain(
            retriever=retriever,
            reranker=reranker,
            prompt_builder=prompt_builder,
            llm_client=llm_client,
            cache=cache,
            use_cache=True
        )
        
        test_questions = [
            "Qu'est-ce que le droit du travail au Maroc?",
            "Quels sont les droits des employés?",
            "Comment fonctionne la justice au Maroc?"
        ]
        
        test_limit = int(os.getenv('RAG_TEST_LIMIT', len(test_questions)))
        for i, question in enumerate(test_questions[:test_limit], 1):
            logger.info(f"\n📝 Question {i}: {question}")
            print("-" * 80)
            
            try:
                response = rag_chain.process_query(question)
                
                print(f"📄 Réponse: {response['answer'][:500]}...")
                print(f"📚 Sources trouvées: {len(response['sources'])}")
                
                if response['sources']:
                    for j, source in enumerate(response['sources'][:3], 1):
                        print(f"   Source {j}: {source.get('document', 'Inconnu')} - Page {source.get('page', 'N/A')}")
                
                print("-" * 80)
                
            except Exception as e:
                logger.error(f"❌ Erreur pour la question {i}: {str(e)}")
            
        logger.info("✅ Tests terminés avec succès!")
        
    except Exception as e:
        logger.error(f"❌ Erreur: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == '__main__':
    test_rag()

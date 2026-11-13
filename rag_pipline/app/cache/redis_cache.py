# app/core/cache/redis_cache.py
import json
import hashlib
import logging
from typing import Optional, Dict, Any
import redis
from config import Config

logger = logging.getLogger(__name__)

class RedisCache:
    """Gère le cache Redis"""
    
    def __init__(
        self,
        host: str = 'localhost',
        port: int = 6379,
        db: int = 0,
        ttl: int = 86400
    ):
        self.ttl = ttl
        self.host = host
        self.port = port
        self.db = db
        
        try:
            self.client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            self.client.ping()
            logger.info(f"🔌 Connecté à Redis à {host}:{port}")
        except Exception as e:
            logger.warning(f"⚠️ Redis non disponible: {str(e)}")
            self.client = None
    
    def _generate_key(self, query: str) -> str:
        """Génère une clé unique pour une requête"""
        # ✅ Utiliser OLLAMA_MODEL au lieu de GOOGLE_MODEL
        model = getattr(Config, 'OLLAMA_MODEL', 'qwen3:4b')
        
        key_data = (
            f"{query}_"
            f"{Config.EMBEDDING_MODEL}_"
            f"{model}_"
            f"{Config.QDRANT_COLLECTION_NAME}_"
            f"{Config.OLLAMA_TEMPERATURE}_"
            f"{getattr(Config, 'OLLAMA_MAX_TOKENS', '')}_"
            f"{getattr(Config, 'RERANK_TOP_K', '')}_"
            f"{getattr(Config, 'PROMPT_MAX_CHARS_PER_DOC', '')}_"
            f"{getattr(Config, 'RAG_CACHE_VERSION', 'v1')}"
        )
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"rag_cache:{key_hash}"
    
    def get(self, query: str) -> Optional[Dict[str, Any]]:
        if not self.client:
            return None
            
        try:
            key = self._generate_key(query)
            data = self.client.get(key)
            
            if data:
                logger.info("💾 Cache HIT")
                return json.loads(data)
            else:
                return None
                
        except json.JSONDecodeError as e:
            logger.error(f"❌ Erreur JSON: {str(e)}")
            try:
                key = self._generate_key(query)
                self.client.delete(key)
            except:
                pass
            return None
        except Exception as e:
            logger.error(f"❌ Erreur lecture cache: {str(e)}")
            return None
    
    def set(self, query: str, response: Dict[str, Any]) -> bool:
        if not self.client:
            return False
            
        try:
            key = self._generate_key(query)
            data = json.dumps(response, ensure_ascii=False)
            self.client.setex(key, self.ttl, data)
            return True
        except TypeError as e:
            logger.error(f"❌ Erreur d'encodage JSON: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Erreur écriture cache: {str(e)}")
            return False
    
    def clear(self) -> bool:
        if not self.client:
            return False
            
        try:
            pattern = "rag_cache:*"
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
                logger.info(f"🗑️ {len(keys)} clés supprimées")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur vidage: {str(e)}")
            return False

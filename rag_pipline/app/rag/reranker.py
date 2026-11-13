import logging
from typing import List, Dict, Any
from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

class Reranker:
    """Réordonne les documents avec un Cross-encoder"""
    
    def __init__(
        self,
        model_name: str = 'cross-encoder/mmarco-mMiniLMv2-L12-H384-v1',
        top_k: int = 5,
        max_chars: int = 1200
    ):
        self.model_name = model_name
        self.top_k = top_k
        self.max_chars = max_chars
        
        logger.info(f"🔄 Chargement du reranker: {model_name}")
        self.model = CrossEncoder(model_name)
        logger.info("✅ Reranker chargé")
        
    def rerank(
        self, 
        query: str, 
        documents: List[Dict[str, Any]], 
        top_k: int = None
    ) -> List[Dict[str, Any]]:
        if not documents:
            return []
        top_k = top_k or self.top_k
            
        try:
            pairs = [
                [query, doc.get('content', '')[:self.max_chars]]
                for doc in documents
            ]
            
            scores = self.model.predict(pairs)
            
            for doc, score in zip(documents, scores):
                doc['rerank_score'] = float(score)
            
            reranked = sorted(
                documents, 
                key=lambda x: x['rerank_score'], 
                reverse=True
            )
            
            result = reranked[:top_k]
            
            logger.info(f"🔄 Reranké {len(documents)} documents en {len(result)}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erreur reranking: {str(e)}")
            return documents[:top_k]

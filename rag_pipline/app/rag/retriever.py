import logging
import numpy as np
from typing import List, Dict, Any, Optional
from app.rag.vector_store import VectorStore
from app.rag.embeddings import EmbeddingGenerator
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class Retriever:
    """Gère la recherche des documents pertinents"""
    
    def __init__(
        self,
        vector_store: VectorStore,
        embedding_generator: EmbeddingGenerator,
        top_k: int = 5,
        use_mmr: bool = True,
        lambda_mult: float = 0.5
    ):
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator
        self.top_k = top_k
        self.use_mmr = use_mmr
        self.lambda_mult = lambda_mult
    
    def retrieve(self, query: str, filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        query_vector = self.embedding_generator.embed_query(query)
        
        results = self.vector_store.search(
            query_vector=query_vector,
            top_k=self.top_k * 2 if self.use_mmr else self.top_k,
            filter_conditions=filters,
            with_vectors=self.use_mmr
        )
        
        if not results:
            logger.warning("⚠️ Aucun résultat trouvé")
            return []
        
        if self.use_mmr and len(results) > self.top_k:
            results = self._apply_mmr(results, query_vector)
        else:
            results = results[:self.top_k]
            
        logger.info(f"📋 Retourné {len(results)} documents pertinents")
        return results
    
    def _apply_mmr(
        self, 
        results: List[Dict[str, Any]], 
        query_vector: np.ndarray
    ) -> List[Dict[str, Any]]:
        if not results:
            return []
            
        try:
            vectors = [self._normalize_vector(result.get('vector')) for result in results]
            
            vectors = np.array(vectors)
            query_vector = query_vector.reshape(1, -1)
            
            query_similarities = cosine_similarity(query_vector, vectors)[0]
            document_similarities = cosine_similarity(vectors)
            
            selected_indices = []
            remaining_indices = list(range(len(results)))
            
            best_idx = np.argmax(query_similarities)
            selected_indices.append(best_idx)
            remaining_indices.remove(best_idx)
            
            while len(selected_indices) < self.top_k and remaining_indices:
                mmr_scores = []
                
                for idx in remaining_indices:
                    sim_query = query_similarities[idx]
                    
                    if selected_indices:
                        sim_selected = max(document_similarities[idx][sel] for sel in selected_indices)
                    else:
                        sim_selected = 0
                    
                    mmr_score = self.lambda_mult * sim_query - (1 - self.lambda_mult) * sim_selected
                    mmr_scores.append(mmr_score)
                
                best_idx = remaining_indices[np.argmax(mmr_scores)]
                selected_indices.append(best_idx)
                remaining_indices.remove(best_idx)
            
            return [results[i] for i in selected_indices]
            
        except Exception as e:
            logger.error(f"❌ Erreur MMR: {str(e)}")
            return results[:self.top_k]

    def _normalize_vector(self, vector: Any) -> np.ndarray:
        if isinstance(vector, dict):
            vector = next(iter(vector.values()), None)

        if vector is None:
            return np.zeros(self.vector_store.vector_size)

        try:
            normalized = np.asarray(vector, dtype=float)
            if normalized.size == 0 or normalized.shape[0] != self.vector_store.vector_size:
                return np.zeros(self.vector_store.vector_size)
            return normalized
        except Exception:
            return np.zeros(self.vector_store.vector_size)

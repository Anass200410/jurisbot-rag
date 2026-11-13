import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
import torch

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    """Génère des embeddings vectoriels"""
    
    def __init__(self, model_name: str = 'intfloat/multilingual-e5-base'):
        self.model_name = model_name
        
        logger.info(f"🧮 Chargement du modèle: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)
        
        logger.info(f"✅ Modèle chargé sur {self.device}")
        
    def embed_text(self, text: str) -> np.ndarray:
        embedding = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding
    
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> np.ndarray:
        if not chunks:
            logger.warning("⚠️ Aucun chunk à encoder")
            return np.array([])
        
        texts = [self._format_passage(chunk['content']) for chunk in chunks]
        
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True,
                batch_size=32,
                show_progress_bar=True
            )
            
            logger.info(f"🧮 Généré {len(embeddings)} embeddings")
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de la génération des embeddings: {str(e)}")
            return np.array([])
    
    def embed_query(self, query: str) -> np.ndarray:
        if 'e5' in self.model_name.lower():
            query = f"query: {query}"
            
        embedding = self.model.encode(
            query,
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        return embedding

    def _format_passage(self, text: str) -> str:
        if 'e5' in self.model_name.lower():
            return f"passage: {text}"
        return text

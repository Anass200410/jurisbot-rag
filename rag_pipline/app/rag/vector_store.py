import logging
import numpy as np
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, 
    VectorParams, 
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue
)
import uuid

logger = logging.getLogger(__name__)

class VectorStore:
    """Interface avec Qdrant"""
    
    def __init__(
        self,
        host: str = 'localhost',
        port: int = 6333,
        collection_name: str = 'moroccan_law',
        vector_size: int = 768
    ):
        self.host = host
        self.port = port
        self.collection_name = collection_name
        self.vector_size = vector_size
        
        self.client = QdrantClient(host=host, port=port)
        logger.info(f"🔌 Connecté à Qdrant à {host}:{port}")
        
    def create_collection(self, force_recreate: bool = False) -> bool:
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            
            if exists and force_recreate:
                self.client.delete_collection(self.collection_name)
                exists = False
                logger.info(f"🗑️ Collection {self.collection_name} supprimée")
            
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"✅ Collection {self.collection_name} créée")
                return True
            else:
                logger.info(f"ℹ️ Collection {self.collection_name} existe déjà")
                return True
                
        except Exception as e:
            logger.error(f"❌ Erreur création collection: {str(e)}")
            return False
    
    def upsert_chunks(
        self, 
        chunks: List[Dict[str, Any]], 
        embeddings: np.ndarray
    ) -> bool:
        if len(chunks) != len(embeddings):
            logger.error(f"❌ Nombre de chunks ({len(chunks)}) ne correspond pas aux embeddings ({len(embeddings)})")
            return False
            
        if len(chunks) == 0:
            logger.warning("⚠️ Aucun chunk à indexer")
            return True
            
        try:
            points = []
            
            for chunk, embedding in zip(chunks, embeddings):
                point_id = chunk.get('id', str(uuid.uuid4()))
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload={
                        'content': chunk['content'],
                        **chunk['metadata']
                    }
                )
                points.append(point)
            
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i+batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch,
                    wait=True
                )
                logger.info(f"💾 Batch {i//batch_size + 1}: {len(batch)} points indexés")
            
            logger.info(f"✅ {len(points)} points indexés avec succès dans Qdrant")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur upsert: {str(e)}")
            return False
    
    def search(
        self, 
        query_vector: np.ndarray, 
        top_k: int = 5,
        filter_conditions: Optional[Dict] = None,
        with_vectors: bool = False
    ) -> List[Dict[str, Any]]:
        try:
            qdrant_filter = None
            if filter_conditions:
                conditions = []
                for key, value in filter_conditions.items():
                    conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value)
                        )
                    )
                qdrant_filter = Filter(
                    must=conditions
                )
            
            try:
                results = self.client.search_points(
                    collection_name=self.collection_name,
                    vector=query_vector.tolist(),
                    limit=top_k,
                    query_filter=qdrant_filter,
                    with_payload=True,
                    with_vectors=with_vectors
                )
            except AttributeError:
                results = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector.tolist(),
                    limit=top_k,
                    query_filter=qdrant_filter,
                    with_payload=True,
                    with_vectors=with_vectors
                )
            
            formatted_results = []
            for result in results:
                payload = result.payload or {}
                formatted = {
                    'id': result.id,
                    'score': result.score,
                    'content': payload.get('content', ''),
                    'metadata': {
                        k: v for k, v in payload.items()
                        if k != 'content'
                    }
                }
                if with_vectors:
                    formatted['vector'] = getattr(result, 'vector', None)
                formatted_results.append(formatted)
            
            logger.info(f"🔍 Trouvé {len(formatted_results)} résultats")
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Erreur recherche: {str(e)}")
            return []
    
    def get_collection_info(self) -> Dict:
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                'name': self.collection_name,
                'points_count': info.points_count if hasattr(info, 'points_count') else 0,
                'vectors_count': info.vectors_count if hasattr(info, 'vectors_count') else 0,
                'status': 'ready'
            }
        except Exception as e:
            logger.error(f"❌ Erreur info collection: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def delete_collection(self) -> bool:
        try:
            self.client.delete_collection(self.collection_name)
            logger.info(f"🗑️ Collection {self.collection_name} supprimée")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur suppression collection: {str(e)}")
            return False

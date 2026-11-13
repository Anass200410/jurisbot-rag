import logging
import uuid
import re
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

class TextSplitter:
    """Découpe le texte en chunks"""

    ARTICLE_PATTERN = re.compile(r'\b(?:Article|Art\.?)\s+([0-9]+(?:[-–][0-9]+)?(?:\s*(?:bis|ter))?)', re.IGNORECASE)
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""]
        )
        
    def split_document(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        content = document['content']
        metadata = document['metadata']
        
        chunks = self.splitter.split_text(content)
        
        result = []
        for i, chunk in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            
            result.append({
                'id': chunk_id,
                'content': chunk,
                'metadata': {
                    **metadata,
                    'article': self._extract_article(chunk) or metadata.get('article', 'N/A'),
                    'chunk_index': i,
                    'total_chunks': len(chunks)
                }
            })
            
        return result
    
    def split_all(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        all_chunks = []
        
        for doc in documents:
            chunks = self.split_document(doc)
            all_chunks.extend(chunks)
            
        logger.info(f"✂️ Créé {len(all_chunks)} chunks")
        return all_chunks

    def _extract_article(self, text: str) -> str:
        match = self.ARTICLE_PATTERN.search(text or '')
        if not match:
            return None
        return match.group(1).strip()

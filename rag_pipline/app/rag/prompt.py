# app/core/rag/prompt.py
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PromptBuilder:
    """Construit le prompt avec support multilingue renforcé"""
    
    def __init__(self, max_chars_per_doc: int = 800):
        self.max_chars_per_doc = max_chars_per_doc
        self.instructions = {
            'fr': """Utilise uniquement le contexte fourni. N'invente aucune information.
Si le contexte ne suffit pas, réponds exactement: "Je ne dispose pas d'informations suffisantes pour répondre à cette question."
Réponds en 2 phrases maximum et cite les sources utiles avec le document, la page et l'article si disponible.""",
            'ar': """استخدم السياق المقدم فقط. لا تخترع أي معلومات.
إذا لم يكن السياق كافياً، أجب بالضبط: "لا أملك معلومات كافية للإجابة على هذا السؤال."
أجب في جملتين كحد أقصى واذكر المصادر المفيدة مع الوثيقة والصفحة والمادة إن وجدت.""",
            'en': """Use only the provided context. Do not invent information.
If the context is not enough, answer exactly: "I don't have enough information to answer this question."
Answer in 2 sentences maximum and cite useful sources with the document, page and article when available."""
        }
    
    def build_prompt(
        self, 
        query: str, 
        documents: List[Dict[str, Any]],
        language: str = 'fr'
    ) -> str:
        """Construit un prompt court avec le contexte juridique."""
        instructions = self.instructions.get(language, self.instructions['fr'])
        context = self._build_context(documents, language)
        
        prompt = f"""INSTRUCTIONS:
{instructions}

CONTEXTE:
{context}

QUESTION: {query}

RÉPONSE:"""
        
        return prompt
    
    def _build_context(self, documents: List[Dict[str, Any]], language: str = 'fr') -> str:
        context_parts = []
        
        labels = {
            'fr': {'source': 'Source', 'page': 'Page', 'article': 'Article'},
            'ar': {'source': 'المصدر', 'page': 'الصفحة', 'article': 'المادة'},
            'en': {'source': 'Source', 'page': 'Page', 'article': 'Article'}
        }
        label = labels.get(language, labels['fr'])
        
        for i, doc in enumerate(documents, 1):
            metadata = doc.get('metadata', {})
            source = metadata.get('source', 'Document inconnu')
            page = metadata.get('page', 'N/A')
            article = metadata.get('article', 'N/A')
            
            header = f"[{i}] {label['source']}: {source} | {label['page']}: {page} | {label['article']}: {article}"
            content = self._truncate(doc.get('content', ''), self.max_chars_per_doc)
            
            context_parts.append(f"{header}\n{content}\n")
        
        return "\n".join(context_parts)
    
    def extract_sources(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sources = []
        seen = set()

        for doc in documents:
            metadata = doc.get('metadata', {})
            document = metadata.get('source', 'Document inconnu')
            article = metadata.get('article', 'N/A')
            page = metadata.get('page', 'N/A')
            key = (document, article, page)

            if key in seen:
                continue
            seen.add(key)

            source = {
                'document': metadata.get('source', 'Document inconnu'),
                'article': article,
                'page': page,
                'content': self._truncate(doc.get('content', ''), 240)
            }

            chunk_index = metadata.get('chunk_index')
            if chunk_index is not None:
                source['chunk_index'] = chunk_index

            score = doc.get('rerank_score', doc.get('score'))
            if score is not None:
                try:
                    source['score'] = round(float(score), 4)
                except (TypeError, ValueError):
                    pass

            sources.append(source)
        return sources

    def _truncate(self, text: str, max_chars: int) -> str:
        text = ' '.join((text or '').split())
        if len(text) <= max_chars:
            return text

        truncated = text[:max_chars].rsplit(' ', 1)[0].strip()
        return f"{truncated}..."

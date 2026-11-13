# app/core/rag/rag_chain.py
import logging
import re
import time
import unicodedata
from typing import Dict, Any
from app.rag.retriever import Retriever
from app.rag.reranker import Reranker
from app.rag.prompt import PromptBuilder
from app.llm.ollama_client import OllamaClient  # ✅ Uniquement Ollama
from app.cache.redis_cache import RedisCache

logger = logging.getLogger(__name__)

class RAGChain:
    """Pipeline RAG complet avec support multilingue"""
    
    def __init__(
        self,
        retriever: Retriever,
        reranker: Reranker,
        prompt_builder: PromptBuilder,
        llm_client: OllamaClient,  # ✅ Uniquement Ollama
        cache: RedisCache,
        use_cache: bool = True
    ):
        self.retriever = retriever
        self.reranker = reranker
        self.prompt_builder = prompt_builder
        self.llm_client = llm_client
        self.cache = cache
        self.use_cache = use_cache
        
        logger.info("🔗 RAGChain initialisé avec Ollama")
    
    def process_query(self, query: str, language: str = 'fr') -> Dict[str, Any]:
        """
        Traite une requête avec la langue spécifiée
        """
        try:
            total_start = time.time()
            small_talk_response = self._get_small_talk_response(query, language)
            if small_talk_response:
                logger.info(f"💬 Message simple détecté ({language})")
                return small_talk_response

            # 1. Cache
            if self.use_cache and self.cache:
                cache_key = f"{query}_{language}"
                cached_response = self.cache.get(cache_key)
                if cached_response:
                    logger.info(f"💾 Cache HIT ({language})")
                    return cached_response
            
            # 2. Recherche
            logger.info(f"🔍 Recherche de documents ({language})...")
            step_start = time.time()
            documents = self.retriever.retrieve(query)
            logger.info(f"⏱️ Recherche terminée en {time.time() - step_start:.2f}s")
            
            if not documents:
                response = {
                    'answer': self._get_message('no_answer', language),
                    'sources': []
                }
                self._cache_response(f"{query}_{language}", response)
                return response
            
            # 3. Reranking
            logger.info("🔄 Reranking...")
            step_start = time.time()
            documents = self.reranker.rerank(query, documents)
            logger.info(f"⏱️ Reranking terminé en {time.time() - step_start:.2f}s")
            
            # 4. Prompt
            logger.info(f"📝 Construction du prompt ({language})...")
            prompt = self.prompt_builder.build_prompt(query, documents, language)
            
            # 5. ✅ Appel à Ollama avec la langue
            logger.info(f"🤖 Appel à Ollama ({language})...")
            step_start = time.time()
            answer = self.llm_client.generate(prompt, language)
            logger.info(f"⏱️ Ollama terminé en {time.time() - step_start:.2f}s")
            
            # 6. Sources
            sources = self.prompt_builder.extract_sources(documents)
            
            response = {
                'answer': answer,
                'sources': sources
            }
            
            self._cache_response(f"{query}_{language}", response)
            
            logger.info(f"✅ Réponse générée ({language}) en {time.time() - total_start:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"❌ Erreur: {str(e)}")
            return {
                'answer': self._get_message('error', language),
                'sources': []
            }
    
    def _get_message(self, msg_type: str, language: str) -> str:
        """Messages multilingues"""
        messages = {
            'greeting': {
                'fr': "Bonjour ! Je peux vous aider avec des questions sur les documents juridiques disponibles.",
                'ar': "مرحباً! يمكنني مساعدتك في الأسئلة المتعلقة بالوثائق القانونية المتاحة.",
                'en': "Hello! I can help you with questions about the available legal documents."
            },
            'thanks': {
                'fr': "Avec plaisir. Je reste disponible pour vos questions sur les documents juridiques.",
                'ar': "على الرحب والسعة. أنا متاح لأسئلتك حول الوثائق القانونية.",
                'en': "You're welcome. I'm here for your questions about the legal documents."
            },
            'goodbye': {
                'fr': "Au revoir ! N'hésitez pas à revenir avec une question juridique liée aux documents.",
                'ar': "إلى اللقاء! يمكنك العودة بأي سؤال قانوني مرتبط بالوثائق.",
                'en': "Goodbye! Feel free to come back with a legal question related to the documents."
            },
            'acknowledgement': {
                'fr': "D'accord. Posez-moi votre question sur les documents quand vous êtes prêt.",
                'ar': "حسناً. اطرح سؤالك حول الوثائق عندما تكون جاهزاً.",
                'en': "Alright. Ask me your question about the documents when you're ready."
            },
            'no_answer': {
                'fr': "Je ne dispose pas d'informations suffisantes pour répondre à cette question.",
                'ar': "لا أملك معلومات كافية للإجابة على هذا السؤال.",
                'en': "I don't have enough information to answer this question."
            },
            'error': {
                'fr': "Une erreur s'est produite. Veuillez réessayer.",
                'ar': "حدث خطأ. يرجى المحاولة مرة أخرى.",
                'en': "An error occurred. Please try again."
            }
        }
        return messages.get(msg_type, {}).get(language, messages[msg_type]['fr'])

    def _get_small_talk_response(self, query: str, language: str) -> Dict[str, Any]:
        """Répond aux messages sociaux courts sans lancer la recherche documentaire."""
        intent = self._detect_small_talk_intent(query)
        if not intent:
            return None

        return {
            'answer': self._get_message(intent, language),
            'sources': []
        }

    def _detect_small_talk_intent(self, query: str) -> str:
        normalized = self._normalize_intent_text(query)
        if not normalized:
            return None

        words = normalized.split()
        if len(words) > 8 or len(normalized) > 80:
            return None

        greeting_phrases = {
            'bonjour', 'bonsoir', 'salut', 'coucou', 'salam', 'salam alaykoum',
            'salam aleikoum', 'assalam alaykoum', 'hello', 'hi', 'hey',
            'good morning', 'good evening', 'مرحبا', 'اهلا', 'السلام عليكم',
            'ca va', 'comment ca va'
        }
        thanks_phrases = {
            'merci', 'merci beaucoup', 'merci bien', 'merci bcp', 'thanks',
            'thank you', 'thx', 'شكرا', 'شكرا لك', 'barak allah fik',
            'jazak allah khayr', 'جزاك الله خيرا'
        }
        goodbye_phrases = {
            'au revoir', 'a bientot', 'bye', 'goodbye', 'see you',
            'إلى اللقاء', 'الى اللقاء'
        }
        acknowledgement_phrases = {
            'ok', 'okay', 'd accord', 'daccord', 'bien', 'parfait',
            'tres bien', 'تمام', 'حسنا'
        }

        if normalized in greeting_phrases:
            return 'greeting'
        if normalized in thanks_phrases or normalized.startswith('merci '):
            return 'thanks'
        if normalized in goodbye_phrases:
            return 'goodbye'
        if normalized in acknowledgement_phrases:
            return 'acknowledgement'

        return None

    def _normalize_intent_text(self, text: str) -> str:
        text = unicodedata.normalize('NFD', (text or '').casefold().strip())
        text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
        text = re.sub(r'[^\w\s]', ' ', text, flags=re.UNICODE)
        return re.sub(r'\s+', ' ', text).strip()
    
    def _cache_response(self, key: str, response: Dict[str, Any]):
        if self.use_cache and self.cache:
            try:
                self.cache.set(key, response)
            except Exception as e:
                logger.warning(f"⚠️ Cache error: {str(e)}")

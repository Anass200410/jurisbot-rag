# app/core/llm/ollama_client.py
import logging
import json
import requests
import time

logger = logging.getLogger(__name__)

class OllamaClient:
    """Client pour Ollama avec support multilingue renforcé"""
    
    def __init__(
        self,
        model: str = 'llama3.2:3b',
        base_url: str = 'http://localhost:11434',
        temperature: float = 0.3,
        max_tokens: int = 600,
        top_p: float = 0.9,
        repeat_penalty: float = 1.1,
        timeout: int = 45,
        num_ctx: int = 2048,
        keep_alive: str = '10m',
        stream: bool = True
    ):
        self.model = model
        self.base_url = base_url
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.top_p = top_p
        self.repeat_penalty = repeat_penalty
        self.timeout = timeout
        self.num_ctx = num_ctx
        self.keep_alive = keep_alive
        self.stream = stream
        self.session = requests.Session()
        
        self._check_connection()
        logger.info(f"🤖 Ollama configuré avec {model}")
    
    def _check_connection(self):
        try:
            response = self.session.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m['name'] for m in models]
                
                if self.model not in model_names:
                    alt_model = f"{self.model}:latest"
                    if alt_model in model_names:
                        logger.info(f"✅ Modèle trouvé comme '{alt_model}'")
                        self.model = alt_model
                    else:
                        logger.warning(f"⚠️ Modèle '{self.model}' non trouvé")
                else:
                    logger.info(f"✅ Modèle '{self.model}' disponible")
        except Exception as e:
            logger.warning(f"⚠️ Erreur de connexion: {str(e)}")
    
    def _get_language_instruction(self, language: str) -> str:
        """Instruction FORTE pour la langue"""
        instructions = {
            'fr': "Réponds uniquement en français, même si la question est dans une autre langue. Style juridique professionnel, clair et bref.",
            
            'ar': "أجب باللغة العربية فقط، حتى لو كان السؤال بلغة أخرى. استخدم أسلوباً قانونياً ومهنياً وواضحاً ومختصراً.",
            
            'en': "Answer only in English, even if the question is in another language. Use a professional, clear and brief legal style."
        }
        return instructions.get(language, instructions['fr'])
    
    def _get_system_prompt(self, language: str) -> str:
        """System prompt avec langue"""
        system_prompts = {
            'fr': "Tu es un expert juridique marocain en droit du travail. Utilise seulement le contexte fourni et cite les articles disponibles.",
            'ar': "أنت خبير قانوني مغربي في قانون العمل. استخدم السياق المقدم فقط واستشهد بالمواد المتاحة.",
            'en': "You are a Moroccan labor-law expert. Use only the provided context and cite available articles."
        }
        return system_prompts.get(language, system_prompts['fr'])
    
    def generate(self, prompt: str, language: str = 'fr') -> str:
        try:
            url = f"{self.base_url}/api/generate"
            
            # ✅ Construction du prompt avec INSTRUCTION FORTE
            system_prompt = self._get_system_prompt(language)
            lang_instruction = self._get_language_instruction(language)
            
            final_prompt = f"""{system_prompt}

{lang_instruction}

{prompt}"""
            
            data = {
                'model': self.model,
                'prompt': final_prompt,
                'stream': self.stream,
                'keep_alive': self.keep_alive,
                'options': {
                    'num_predict': self.max_tokens,
                    'temperature': self.temperature,
                    'top_p': self.top_p,
                    'repeat_penalty': self.repeat_penalty,
                    'num_ctx': self.num_ctx,
                    'stop': ["\n\n---", "---\n\n"]
                }
            }
            
            logger.info(f"📤 Envoi à {self.model} en {language.upper()}...")
            start_time = time.time()

            if self.stream:
                answer = self._generate_stream(url, data, start_time, language)
            else:
                answer = self._generate_blocking(url, data)
            
            elapsed_time = time.time() - start_time
            logger.info(f"✅ {len(answer)} caractères en {elapsed_time:.2f}s")
            
            return answer
            
        except requests.exceptions.Timeout:
            logger.error(f"❌ Timeout après {self.timeout}s")
            return self._get_error_message(language, 'timeout')
        except Exception as e:
            logger.error(f"❌ Erreur: {str(e)}")
            return self._get_error_message(language, 'error')

    def _generate_blocking(self, url: str, data: dict) -> str:
        response = self.session.post(url, json=data, timeout=(5, self.timeout))
        response.raise_for_status()
        result = response.json()
        return result.get('response', '').strip()

    def _generate_stream(
        self,
        url: str,
        data: dict,
        start_time: float,
        language: str
    ) -> str:
        parts = []

        with self.session.post(url, json=data, stream=True, timeout=(5, self.timeout)) as response:
            response.raise_for_status()

            try:
                for line in response.iter_lines(decode_unicode=True):
                    if not line:
                        continue

                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    token = chunk.get('response', '')
                    if token:
                        parts.append(token)

                    if chunk.get('done'):
                        break

                    if time.time() - start_time >= self.timeout:
                        logger.warning(f"⚠️ Temps limite atteint après {self.timeout}s, réponse partielle retournée")
                        break
            except requests.exceptions.Timeout:
                if parts:
                    logger.warning(f"⚠️ Timeout streaming après {self.timeout}s, réponse partielle retournée")
                else:
                    raise

        answer = ''.join(parts).strip()
        if answer:
            return answer
        return self._get_error_message(language, 'timeout')
    
    def _get_error_message(self, language: str, error_type: str) -> str:
        messages = {
            'fr': {
                'timeout': "⏱️ Le modèle prend trop de temps. Veuillez réessayer.",
                'error': "❌ Erreur lors de la génération."
            },
            'ar': {
                'timeout': "⏱️ النموذج يستغرق وقتاً طويلاً. يرجى المحاولة مرة أخرى.",
                'error': "❌ حدث خطأ. يرجى المحاولة مرة أخرى."
            },
            'en': {
                'timeout': "⏱️ The model is taking too long. Please try again.",
                'error': "❌ Error occurred. Please try again."
            }
        }
        return messages.get(language, messages['fr']).get(error_type, "Erreur")

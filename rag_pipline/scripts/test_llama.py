#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from app.llm.ollama_client import OllamaClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_llama():
    """Test de Llama 3.2 via Ollama"""
    
    logger.info("🧪 Test de Llama 3.2...")
    
    # Initialiser le client
    client = OllamaClient(
        model=Config.OLLAMA_MODEL,
        base_url=Config.OLLAMA_BASE_URL,
        temperature=Config.OLLAMA_TEMPERATURE,
        max_tokens=Config.OLLAMA_MAX_TOKENS,
        timeout=Config.OLLAMA_TIMEOUT,
        num_ctx=Config.OLLAMA_NUM_CTX,
        keep_alive=Config.OLLAMA_KEEP_ALIVE
    )
    
    # Test en français
    logger.info("\n📝 Test en français:")
    response_fr = client.generate(
        "Quelle est la durée légale du travail au Maroc ?",
        language='fr'
    )
    print(f"🇫🇷 Réponse: {response_fr}")
    
    # Test en anglais
    logger.info("\n📝 Test en anglais:")
    response_en = client.generate(
        "What is the legal working hours in Morocco?",
        language='en'
    )
    print(f"🇬🇧 Réponse: {response_en}")
    
    # Test en arabe
    logger.info("\n📝 Test en arabe:")
    response_ar = client.generate(
        "ما هي مدة العمل القانونية في المغرب؟",
        language='ar'
    )
    print(f"🇲🇦 Réponse: {response_ar}")

if __name__ == '__main__':
    test_llama()

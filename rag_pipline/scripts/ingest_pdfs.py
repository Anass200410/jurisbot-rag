#!/usr/bin/env python
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from app.rag.loader import PDFLoader
from app.rag.cleaner import TextCleaner
from app.rag.splitter import TextSplitter
from app.rag.embeddings import EmbeddingGenerator
from app.rag.vector_store import VectorStore
import logging
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    pdf_dir = Path(Config.PDF_DIR)
    if not pdf_dir.exists():
        pdf_dir.mkdir(parents=True, exist_ok=True)
        logger.warning(f"📁 Dossier {Config.PDF_DIR} créé")
        return False
    
    pdf_files = [path for path in pdf_dir.iterdir() if path.is_file() and path.suffix.lower() == ".pdf"]
    if not pdf_files:
        logger.warning("⚠️ Aucun fichier PDF trouvé")
        return False
    
    logger.info(f"📄 Trouvé {len(pdf_files)} fichiers PDF")
    return True

def ingest_pdfs():
    try:
        if not check_environment():
            logger.info("ℹ️ Aucun PDF à ingérer")
            return
        
        logger.info("🚀 Début de l'ingestion des PDFs...")
        
        # 1. Charger les PDFs
        logger.info("📄 Chargement des PDFs...")
        loader = PDFLoader(Config.PDF_DIR)
        documents = loader.load_all_pdfs()
        
        if not documents:
            logger.warning("⚠️ Aucun document chargé")
            return
            
        logger.info(f"✅ {len(documents)} documents chargés")
        
        # 2. Nettoyer le texte
        logger.info("🧹 Nettoyage du texte...")
        cleaner = TextCleaner()
        cleaned_docs = cleaner.clean_all(documents)
        
        if not cleaned_docs:
            logger.warning("⚠️ Aucun document après nettoyage")
            return
            
        logger.info(f"✅ Nettoyage terminé: {len(cleaned_docs)} documents")
        
        # 3. Découper en chunks
        logger.info("✂️ Découpage en chunks...")
        splitter = TextSplitter(
            chunk_size=Config.CHUNK_SIZE,
            chunk_overlap=Config.CHUNK_OVERLAP
        )
        chunks = splitter.split_all(cleaned_docs)
        
        if not chunks:
            logger.warning("⚠️ Aucun chunk créé")
            return
            
        logger.info(f"✅ {len(chunks)} chunks créés")
        
        # 4. Générer les embeddings
        logger.info("🧮 Génération des embeddings...")
        embedder = EmbeddingGenerator(Config.EMBEDDING_MODEL)
        embeddings = embedder.embed_chunks(chunks)
        
        if embeddings is None or len(embeddings) == 0:
            logger.warning("⚠️ Aucun embedding généré")
            return
            
        logger.info(f"✅ Embeddings générés: {len(embeddings)}")
        
        # 5. Indexer dans Qdrant
        logger.info("💾 Indexation dans Qdrant...")
        vector_store = VectorStore(
            host=Config.QDRANT_HOST,
            port=Config.QDRANT_PORT,
            collection_name=Config.QDRANT_COLLECTION_NAME,
            vector_size=Config.QDRANT_VECTOR_SIZE
        )
        
        vector_store.create_collection(force_recreate=True)
        success = vector_store.upsert_chunks(chunks, embeddings)
        
        if not success:
            logger.error("❌ Échec de l'indexation")
            return
            
        # 6. Vérifier
        info = vector_store.get_collection_info()
        logger.info("📊 Informations de la collection:")
        logger.info(f"   - Nom: {info.get('name', 'N/A')}")
        logger.info(f"   - Points: {info.get('points_count', 0)}")
        logger.info(f"   - Vecteurs: {info.get('vectors_count', 0)}")
        
        # 7. Tester une recherche
        logger.info("🧪 Test de recherche...")
        test_query = "droit du travail"
        test_embedding = embedder.embed_query(test_query)
        results = vector_store.search(test_embedding, top_k=3)
        
        if results:
            logger.info(f"✅ Recherche test réussie: {len(results)} résultats")
            for i, result in enumerate(results[:3], 1):
                logger.info(f"   📝 Résultat {i}: Score={result['score']:.4f}")
                logger.info(f"      {result['content'][:150]}...")
                logger.info(f"      📄 Source: {result['metadata'].get('source', 'Inconnu')} - Page {result['metadata'].get('page', 'N/A')}")
        else:
            logger.warning("⚠️ Recherche test n'a retourné aucun résultat")
        
        logger.info("🎉 Ingestion terminée avec succès!")
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'ingestion: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == '__main__':
    ingest_pdfs()

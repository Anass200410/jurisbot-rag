# app/api/routes.py - Ajout de la détection de langue
from flask import Blueprint, request, jsonify
import logging
import sys
import os
import glob
import time
import subprocess
from werkzeug.utils import secure_filename
from langdetect import detect

chat_bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)

# Variable globale pour le service
_chat_service = None

def init_chat_service(app):
    global _chat_service
    try:
        from app.services.chat_service import ChatService
        _chat_service = ChatService(app)
        logger.info("✅ ChatService initialisé avec succès dans routes.py")
        return _chat_service
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation du ChatService: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def get_chat_service():
    return _chat_service

@chat_bp.route('/chat', methods=['POST'])
def process_chat():
    """Traite une question en respectant la langue choisie par le client."""
    try:
        chat_service = get_chat_service()
        if chat_service is None:
            logger.error("❌ ChatService non initialisé!")
            return jsonify({'error': 'Service non initialisé'}), 500

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Corps JSON invalide'}), 400
        question = data.get('question')
        if not isinstance(question, str):
            return jsonify({'error': 'La question est requise'}), 400
        question = question.strip()
        if not question:
            return jsonify({'error': 'La question ne peut pas être vide'}), 400
        if len(question) > 4000:
            return jsonify({'error': 'La question est trop longue'}), 400

        language = data.get('language')
        if not isinstance(language, str) or language not in {'fr', 'ar', 'en'}:
            try:
                detected = detect(question)
            except Exception:
                detected = 'fr'
            language = detected if detected in {'fr', 'ar', 'en'} else 'fr'
        logger.info("Question reçue (%s caractères, langue=%s)", len(question), language)
        response = chat_service.process_question(question, language)
        if not isinstance(response, dict) or not response.get('answer'):
            return jsonify({'error': 'Le service RAG a retourné une réponse invalide'}), 502
        return jsonify(response), 200
    except Exception:
        logger.exception("Erreur dans /chat")
        return jsonify({'error': 'Le service RAG est temporairement indisponible'}), 502

# ... le reste du code (endpoints admin) reste identique ...

# ============================================
# ENDPOINTS ADMIN - DOCUMENTS
# ============================================

@chat_bp.route('/admin/documents', methods=['GET'])
def admin_get_documents():
    """Liste tous les documents PDF disponibles"""
    try:
        from config import Config
        
        pdf_dir = Config.PDF_DIR
        if not os.path.exists(pdf_dir):
            os.makedirs(pdf_dir)
            return jsonify({'documents': [], 'count': 0}), 200
        
        documents = []
        for file in glob.glob(os.path.join(pdf_dir, '*')):
            if not os.path.isfile(file) or not file.lower().endswith('.pdf'):
                continue
            stat = os.stat(file)
            documents.append({
                'name': os.path.basename(file),
                'size': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'modified': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime))
            })
        
        return jsonify({'documents': documents, 'count': len(documents)}), 200
    except Exception as e:
        logger.error(f"❌ Erreur get_documents: {str(e)}")
        return jsonify({'error': 'Impossible de lire les documents', 'documents': [], 'count': 0}), 500

@chat_bp.route('/admin/documents/upload', methods=['POST'])
def admin_upload_document():
    """Upload un nouveau document PDF"""
    try:
        from config import Config
        
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier envoyé'}), 400
        
        file = request.files['file']
        if not file.filename:
            return jsonify({'error': 'Nom de fichier vide'}), 400

        safe_filename = secure_filename(file.filename)
        if not safe_filename or not safe_filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Seuls les fichiers PDF sont acceptés'}), 400

        header = file.stream.read(1024)
        file.stream.seek(0)
        if b'%PDF-' not in header:
            return jsonify({'error': 'Le fichier envoyé n’est pas un PDF valide'}), 400
        
        pdf_dir = Config.PDF_DIR
        if not os.path.exists(pdf_dir):
            os.makedirs(pdf_dir)
        
        filepath = os.path.join(pdf_dir, safe_filename)
        if os.path.exists(filepath):
            base, ext = os.path.splitext(safe_filename)
            counter = 1
            while os.path.exists(os.path.join(pdf_dir, f"{base}_{counter}{ext}")):
                counter += 1
            filepath = os.path.join(pdf_dir, f"{base}_{counter}{ext}")
        
        file.save(filepath)
        
        return jsonify({
            'message': f'Document {os.path.basename(filepath)} téléchargé avec succès',
            'filename': os.path.basename(filepath)
        }), 200
    except Exception as e:
        logger.error(f"❌ Erreur upload_document: {str(e)}")
        return jsonify({'error': 'Impossible d’enregistrer le document'}), 500

@chat_bp.route('/admin/documents/<filename>', methods=['DELETE'])
def admin_delete_document(filename):
    """Supprime un document PDF"""
    try:
        from config import Config
        
        safe_filename = secure_filename(filename)
        if not safe_filename or not safe_filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Nom de fichier invalide'}), 400
        filepath = os.path.join(Config.PDF_DIR, safe_filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'Document non trouvé'}), 404
        
        os.remove(filepath)
        return jsonify({'message': f'Document {safe_filename} supprimé'}), 200
    except Exception as e:
        logger.error(f"❌ Erreur delete_document: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/admin/pipeline/ingest', methods=['POST'])
def admin_trigger_ingestion():
    """Déclenche l'ingestion des PDFs"""
    try:
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'scripts', 'ingest_pdfs.py')
        
        if not os.path.exists(script_path):
            return jsonify({'error': f'Script non trouvé: {script_path}'}), 500
        
        logger.info("🚀 Démarrage de l'ingestion...")
        
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=1800
        )
        
        from app.rag.vector_store import VectorStore
        from config import Config
        
        vector_store = VectorStore(
            host=Config.QDRANT_HOST,
            port=Config.QDRANT_PORT,
            collection_name=Config.QDRANT_COLLECTION_NAME,
            vector_size=Config.QDRANT_VECTOR_SIZE
        )
        info = vector_store.get_collection_info()
        points_count = info.get('points_count', 0)
        
        success = result.returncode == 0 and points_count > 0
        
        return jsonify({
            'message': 'Ingestion terminée avec succès' if success else 'Ingestion terminée avec des erreurs',
            'success': success,
            'points_count': points_count,
            'returncode': result.returncode
        }), 200 if success else 500
        
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Ingestion trop longue (plus de 30 minutes)'}), 500
    except Exception as e:
        logger.error(f"❌ Erreur trigger_ingestion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/admin/metrics', methods=['GET'])
def admin_get_metrics():
    """Métriques de performance du système"""
    try:
        from config import Config
        from app.rag.vector_store import VectorStore
        
        pdf_dir = Config.PDF_DIR
        doc_count = sum(
            1 for filename in os.listdir(pdf_dir)
            if filename.lower().endswith('.pdf')
        ) if os.path.isdir(pdf_dir) else 0
        
        vector_store = VectorStore(
            host=Config.QDRANT_HOST,
            port=Config.QDRANT_PORT,
            collection_name=Config.QDRANT_COLLECTION_NAME,
            vector_size=Config.QDRANT_VECTOR_SIZE
        )
        info = vector_store.get_collection_info()
        
        metrics = {
            'documents_count': doc_count,
            'qdrant_points': info.get('points_count', 0),
            'collection_name': Config.QDRANT_COLLECTION_NAME,
            'status': 'ready' if info.get('points_count', 0) > 0 else 'empty'
        }
        return jsonify(metrics), 200
    except Exception as e:
        logger.error(f"❌ Erreur get_metrics: {str(e)}")
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/health', methods=['GET'])
def health_check():
    """Endpoint de santé"""
    chat_service = get_chat_service()
    status_code = 200 if chat_service is not None else 503
    return jsonify({
        'status': 'healthy' if chat_service is not None else 'unavailable',
        'service': 'rag-api',
        'chat_service_initialized': chat_service is not None
    }), status_code

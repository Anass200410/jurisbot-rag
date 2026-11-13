from flask import Flask
from flask_cors import CORS
from config import Config
import logging

def create_app():
    """Factory function pour créer l'application Flask"""
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['MAX_CONTENT_LENGTH'] = 205 * 1024 * 1024
    
    # Configuration CORS
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"])
    
    # Configuration des logs
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    
    # Initialiser le service de chat
    try:
        from app.api.routes import init_chat_service
        chat_service = init_chat_service(app)
        if chat_service:
            logger.info("✅ ChatService initialisé avec succès!")
        else:
            logger.error("❌ Échec de l'initialisation du ChatService")
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'initialisation: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
    
    # Enregistrer les blueprints
    from app.api.routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api')
    
    @app.route('/health', methods=['GET'])
    def health_check():
        from app.api.routes import get_chat_service
        chat_service = get_chat_service()
        status_code = 200 if chat_service is not None else 503
        return {
            'status': 'healthy' if chat_service is not None else 'unavailable',
            'message': 'Flask RAG service is running',
            'chat_service_initialized': chat_service is not None
        }, status_code
    
    return app

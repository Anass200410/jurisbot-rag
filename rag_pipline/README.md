# Assistant RAG juridique

Le projet contient trois services : le moteur RAG Flask/Python, l'API Spring Boot pour les comptes et les conversations, et l'interface React. Les étapes de recherche, classement et génération RAG restent celles déjà en place.

## Démarrage local

1. Démarrer MySQL, Qdrant, Redis et Ollama.
2. Installer les dépendances Python avec `python -m pip install -r requirements.txt`, puis lancer `python run.py`.
3. Dans `assistant_rag`, démarrer Spring Boot avec `./mvnw spring-boot:run`.
4. Dans `moroccan-rag-frontend`, installer les dépendances npm puis lancer `npm run dev`.

Configurer les accès à la base (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`), la clé JWT (`JWT_SECRET`) et l'adresse Flask (`FLASK_API_URL`) selon l'environnement. Le service Flask écoute sur `127.0.0.1` par défaut. Pour un réseau de conteneurs, définir `FLASK_HOST` à l'adresse d'écoute attendue et ne pas exposer directement les routes administratives Flask.

Pour créer le premier compte administrateur, définir temporairement `ADMIN_BOOTSTRAP_EMAIL` et `ADMIN_BOOTSTRAP_PASSWORD` au démarrage de Spring Boot. Le compte est créé seulement s'il n'existe pas déjà. Supprimer ces variables après l'initialisation. Les promotions suivantes se font depuis l'administration.

## Documents et évaluation

Les PDF sont lus depuis `data/pdfs`. Le nettoyage conserve les paragraphes et la pagination. L'OCR de secours est documenté dans [docs/document-extraction.md](docs/document-extraction.md).

Pour évaluer les réponses sans alourdir l'API de chat, installer l'environnement optionnel et suivre [docs/evaluation.md](docs/evaluation.md). Le tableau admin rassemble aussi les notes de 1 à 5 étoiles déposées sous les réponses.

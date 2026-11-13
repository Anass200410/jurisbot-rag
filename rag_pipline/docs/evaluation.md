# Évaluer le RAG

L'évaluation hors ligne utilise Ragas sans ajouter de dépendance au service de chat. Elle appelle l'API Flask existante et mesure la fidélité des réponses au contexte récupéré. Si chaque entrée contient une référence rédigée par un humain, le script calcule aussi la factualité par rapport à cette référence.

## Installation isolée

Garder Ragas dans un environnement séparé évite les conflits avec les dépendances de l'application.

```bash
python3 -m venv .venv-evaluation
source .venv-evaluation/bin/activate
python -m pip install -r requirements-evaluation.txt
```

## Jeu de questions

Créer un fichier JSONL avec une entrée par ligne. Le champ `reference` est facultatif, mais il faut fournir une réponse de référence pour chaque question afin d'activer la métrique de factualité.

```json
{"question":"Quel document régit le contrat de travail ?","language":"fr","reference":"Réponse de référence validée par un juriste."}
{"question":"ما هي مدة الإجازة السنوية؟","language":"ar","reference":"إجابة مرجعية راجعها مختص قانوني."}
```

Les réponses de référence doivent être validées par un juriste. Ne pas les générer depuis le modèle évalué.

## Lancer une évaluation

Démarrer Flask, Qdrant, Redis et Ollama comme pour le chat, puis lancer :

```bash
python scripts/evaluate_rag.py data/evaluation.jsonl --output artifacts/ragas-results.csv
```

Le modèle évaluateur par défaut est `llama3.2:3b` via l'API compatible OpenAI d'Ollama. Les variables `RAG_API_URL`, `RAGAS_EVALUATOR_MODEL`, `RAGAS_EVALUATOR_URL` et `RAGAS_EVALUATOR_API_KEY` permettent de changer les adresses et le modèle sans modifier le pipeline.

Les métriques Ragas utilisent un LLM évaluateur et donnent une estimation, pas une preuve de qualité juridique. Comparer les scores avec les notes attribuées par les utilisateurs et relire les cas faibles.

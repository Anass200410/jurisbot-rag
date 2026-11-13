#!/usr/bin/env python3
"""Run an offline Ragas evaluation against the existing Flask chat endpoint."""

import argparse
import json
import os
from pathlib import Path
from typing import Any, Dict, List

import requests


def load_cases(path: Path, limit: int | None) -> List[Dict[str, Any]]:
    cases = []
    with path.open("r", encoding="utf-8") as dataset_file:
        for line_number, line in enumerate(dataset_file, start=1):
            if not line.strip():
                continue
            case = json.loads(line)
            question = case.get("question")
            if not isinstance(question, str) or not question.strip():
                raise ValueError(f"Ligne {line_number}: le champ 'question' est obligatoire")
            cases.append(case)
            if limit and len(cases) >= limit:
                break
    if not cases:
        raise ValueError("Le jeu d'évaluation ne contient aucune question")
    return cases


def collect_responses(cases: List[Dict[str, Any]], endpoint: str) -> List[Dict[str, Any]]:
    rows = []
    for index, case in enumerate(cases, start=1):
        response = requests.post(
            endpoint,
            json={"question": case["question"], "language": case.get("language", "fr")},
            timeout=180,
        )
        response.raise_for_status()
        payload = response.json()

        row = {
            "user_input": case["question"],
            "response": payload.get("answer", ""),
            "retrieved_contexts": [
                source.get("content", "")
                for source in payload.get("sources", [])
                if isinstance(source, dict) and source.get("content")
            ],
        }
        reference = case.get("reference")
        if isinstance(reference, str) and reference.strip():
            row["reference"] = reference.strip()
        rows.append(row)
        print(f"Réponse RAG collectée: {index}/{len(cases)}")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Évalue le RAG avec Ragas et Ollama.")
    parser.add_argument("dataset", type=Path, help="Fichier JSONL contenant les questions et références")
    parser.add_argument(
        "--endpoint",
        default=os.getenv("RAG_API_URL", "http://localhost:5001/api/chat"),
        help="URL de l'API Flask de chat",
    )
    parser.add_argument("--limit", type=int, default=None, help="Nombre maximal de questions")
    parser.add_argument("--output", type=Path, default=Path("evaluation-results.csv"))
    parser.add_argument(
        "--evaluator-model",
        default=os.getenv("RAGAS_EVALUATOR_MODEL", "llama3.2:3b"),
        help="Modèle Ollama utilisé par Ragas pour noter les réponses",
    )
    parser.add_argument(
        "--evaluator-url",
        default=os.getenv("RAGAS_EVALUATOR_URL", "http://localhost:11434/v1"),
        help="URL OpenAI-compatible du modèle évaluateur",
    )
    args = parser.parse_args()

    from langchain_openai import ChatOpenAI
    from ragas import EvaluationDataset, evaluate
    from ragas.llms import LangchainLLMWrapper

    try:
        from ragas.metrics import Faithfulness, FactualCorrectness
    except ImportError:
        from ragas.metrics.collections import Faithfulness, FactualCorrectness

    cases = load_cases(args.dataset, args.limit)
    rows = collect_responses(cases, args.endpoint)
    metrics = [Faithfulness()]
    if all("reference" in row for row in rows):
        metrics.append(FactualCorrectness())

    evaluator = ChatOpenAI(
        model=args.evaluator_model,
        base_url=args.evaluator_url,
        api_key=os.getenv("RAGAS_EVALUATOR_API_KEY", "ollama"),
        temperature=0,
    )
    result = evaluate(
        dataset=EvaluationDataset.from_list(rows),
        metrics=metrics,
        llm=LangchainLLMWrapper(evaluator),
        show_progress=True,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    result.to_pandas().to_csv(args.output, index=False)
    print(result)
    print(f"Résultats détaillés enregistrés dans {args.output}")


if __name__ == "__main__":
    main()

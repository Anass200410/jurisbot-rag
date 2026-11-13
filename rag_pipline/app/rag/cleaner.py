import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class TextCleaner:
    """Normalize extracted text while retaining page and paragraph boundaries."""

    def clean_text(self, text: str) -> str:
        if not text:
            return ""

        cleaned = text.replace("\u00ad", "")
        cleaned = re.sub(r"^[ \t]*\d+(?:[ \t]*/[ \t]*\d+)?[ \t]*$", "", cleaned, flags=re.MULTILINE)
        cleaned = re.sub(r"§\s*", "Section ", cleaned)
        cleaned = re.sub(
            r"[^\w\s.,;:?!()\-'\"\u060c\u061b\u061f\u064b-\u065f\u0670\u06d6-\u06ed\u0300-\u036f\u2011\u2013\u2014]+",
            " ",
            cleaned,
            flags=re.UNICODE,
        )
        cleaned = re.sub(r"[\t\r\f\v ]+", " ", cleaned)
        cleaned = re.sub(r" *\n *", "\n", cleaned)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        cleaned = re.sub(r"\bArt(?:\.|\b)\s*", "Article ", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    def clean_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "content": self.clean_text(document.get("content", "")),
            "metadata": document.get("metadata", {}),
        }

    def clean_all(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned_docs = [self.clean_document(document) for document in documents]
        cleaned_docs = [document for document in cleaned_docs if document["content"]]
        logger.info("Cleaned %s pages", len(cleaned_docs))
        return cleaned_docs

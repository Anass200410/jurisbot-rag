"""PDF text extraction with layout preservation and optional OCR fallback."""

import logging
import os
import re
import shutil
from typing import Any, Dict, List

import fitz

from config import Config

logger = logging.getLogger(__name__)


class PDFLoader:
    """Extract one document per PDF page while retaining paragraph boundaries."""

    def __init__(self, pdf_directory: str):
        self.pdf_directory = pdf_directory

    def _extract_page_text(self, page: fitz.Page) -> tuple[str, str]:
        """Read positioned text blocks first; use Tesseract for image-only pages."""
        blocks = page.get_text("blocks", sort=True)
        paragraphs = []
        for block in blocks:
            if len(block) < 7 or block[6] != 0:
                continue
            text = block[4].replace("\u00ad", "").strip()
            text = re.sub(r"(?<=\w)-\s*\n\s*(?=\w)", "", text)
            text = re.sub(r"[\t\r\f\v ]+", " ", text)
            text = re.sub(r"\n{2,}", "\n", text)
            if text:
                paragraphs.append(text)

        text = "\n\n".join(paragraphs).strip()
        has_enough_native_text = (
            len(text) >= Config.PDF_OCR_MIN_TEXT_CHARS
            and len(text.split()) >= 8
        )
        if has_enough_native_text or not Config.PDF_OCR_ENABLED:
            return text, "text"

        if not shutil.which("tesseract"):
            logger.debug("Tesseract not found; keeping native PDF text extraction")
            return text, "text"

        languages = list(dict.fromkeys((Config.PDF_OCR_LANGUAGE, "fra+eng", "eng")))
        for language in languages:
            try:
                text_page = page.get_textpage_ocr(
                    language=language,
                    dpi=Config.PDF_OCR_DPI,
                    full=True,
                )
                ocr_text = page.get_text("text", textpage=text_page, sort=True).strip()
                if len(ocr_text) > len(text):
                    return ocr_text, "ocr"
            except Exception as exc:
                logger.debug("OCR (%s) failed for page %s: %s", language, page.number + 1, exc)

        return text, "text"

    def load_single_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        documents: List[Dict[str, Any]] = []
        filename = os.path.basename(file_path)

        try:
            with fitz.open(file_path) as pdf:
                total_pages = len(pdf)
                for page_num, page in enumerate(pdf, start=1):
                    text, extraction_method = self._extract_page_text(page)
                    if not text:
                        continue

                    documents.append({
                        "content": text,
                        "metadata": {
                            "source": filename,
                            "page": page_num,
                            "total_pages": total_pages,
                            "extraction_method": extraction_method,
                        },
                    })

            logger.info("Loaded %s: %s/%s pages", filename, len(documents), total_pages)
        except Exception:
            logger.exception("Could not extract PDF %s", file_path)

        return documents

    def load_all_pdfs(self) -> List[Dict[str, Any]]:
        if not os.path.isdir(self.pdf_directory):
            os.makedirs(self.pdf_directory, exist_ok=True)
            logger.warning("Created PDF directory %s", self.pdf_directory)
            return []

        pdf_files = sorted(
            filename for filename in os.listdir(self.pdf_directory)
            if filename.lower().endswith(".pdf")
            and os.path.isfile(os.path.join(self.pdf_directory, filename))
        )
        if not pdf_files:
            logger.warning("No PDF files found in %s", self.pdf_directory)
            return []

        documents: List[Dict[str, Any]] = []
        for filename in pdf_files:
            documents.extend(self.load_single_pdf(os.path.join(self.pdf_directory, filename)))

        logger.info("Loaded %s pages from %s PDFs", len(documents), len(pdf_files))
        return documents

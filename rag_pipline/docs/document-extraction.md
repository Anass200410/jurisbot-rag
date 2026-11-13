# Extraction des PDF

L'ingestion conserve l'ordre des blocs et les séparations entre paragraphes. Les PDF textuels utilisent l'extraction native de PyMuPDF. Les pages presque vides peuvent passer par OCR quand Tesseract est disponible; l'OCR reste un secours au niveau de l'extraction et ne modifie pas la recherche, le classement ou la génération RAG.

Après une modification de l'extraction ou des PDF, relancer l'ingestion pour reconstruire l'index Qdrant. La version du cache est également incrémentée afin d'éviter les réponses mises en cache avant cette mise à jour.

Configuration facultative :

```env
PDF_OCR_ENABLED=true
PDF_OCR_LANGUAGE=fra+eng+ara
PDF_OCR_DPI=250
PDF_OCR_MIN_TEXT_CHARS=30
```

Installer Tesseract et les données de langue voulues sur la machine d'ingestion pour activer le secours OCR. Si un moteur ou une langue n'est pas disponible, le chargeur essaie le français et l'anglais, puis garde le texte natif si l'OCR échoue. L'extraction indique `text` ou `ocr` dans les métadonnées de page.

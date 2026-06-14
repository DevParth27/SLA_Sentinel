"""
pdf_parser.py
Reads a PDF file (local path or downloaded from S3) and returns raw text.
Handles multi-page PDFs, skips empty pages, and raises clear errors if the
file is unreadable or password-protected.
"""

import pdfplumber
import boto3
import tempfile
import os
from pathlib import Path


def parse_pdf_local(file_path: str) -> str:
    """
    Parse a PDF from a local file path.
    Returns concatenated text from all pages.
    Raises ValueError if no text is extracted (e.g. scanned image PDF).
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")
    if path.suffix.lower() != ".pdf":
        raise ValueError(f"File is not a PDF: {file_path}")

    pages_text = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text and text.strip():
                pages_text.append(text.strip())
            else:
                print(f"[pdf_parser] Warning: page {i+1} is empty or unreadable")

    if not pages_text:
        raise ValueError(
            "No text extracted. PDF may be a scanned image. "
            "OCR support is not included in this version."
        )

    return "\n\n".join(pages_text)


def parse_pdf_from_s3(bucket: str, key: str) -> str:
    """
    Downloads a PDF from S3 to a temp file, parses it, then deletes the temp file.
    Uses boto3 — make sure AWS credentials are in your .env.
    """
    s3 = boto3.client("s3")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        print(f"[pdf_parser] Downloading s3://{bucket}/{key}")
        s3.download_file(bucket, key, tmp_path)
        return parse_pdf_local(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def parse_pdf(source: str, from_s3: bool = False, bucket: str = None) -> str:
    """
    Main entry point. 
    - If from_s3=True, source is the S3 key and bucket must be provided.
    - Otherwise, source is a local file path.
    """
    if from_s3:
        if not bucket:
            raise ValueError("bucket must be provided when from_s3=True")
        return parse_pdf_from_s3(bucket, source)
    return parse_pdf_local(source)


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python pdf_parser.py <path_to_pdf>")
        sys.exit(1)
    result = parse_pdf(sys.argv[1])
    print(f"\n[RESULT] Extracted {len(result)} characters\n")
    print(result[:500], "...")
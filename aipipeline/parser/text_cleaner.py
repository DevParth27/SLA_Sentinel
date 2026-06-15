"""
text_cleaner.py
Cleans up raw PDF text before it goes to the LLM.
PDFs often have page numbers, headers, footers, weird spacing, and broken
line breaks that confuse the model. This file fixes all of that.
"""

import re


def remove_page_artifacts(text: str) -> str:
    """Remove common PDF artifacts like page numbers and headers."""
    # Remove "Page X of Y" patterns
    text = re.sub(r"Page\s+\d+\s+of\s+\d+", "", text, flags=re.IGNORECASE)
    # Remove standalone page numbers (a line that is just a number)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)
    # Remove common header/footer patterns
    text = re.sub(r"CONFIDENTIAL\s*[-–]\s*", "", text, flags=re.IGNORECASE)
    return text


def fix_line_breaks(text: str) -> str:
    """
    PDFs often break sentences mid-line with a newline.
    This joins lines that don't end with punctuation back together.
    """
    # Join lines that end without punctuation (mid-sentence breaks)
    text = re.sub(r"(?<![.!?:])\n(?![•\-\d\n])", " ", text)
    return text


def normalize_whitespace(text: str) -> str:
    """Collapse multiple blank lines and extra spaces."""
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse multiple spaces into one
    text = re.sub(r" {2,}", " ", text)
    # Strip trailing whitespace from each line
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip()


def remove_non_printable(text: str) -> str:
    """Remove non-printable characters that sneak in from PDFs."""
    return re.sub(r"[^\x20-\x7E\n]", " ", text)


def truncate_for_llm(text: str, max_chars: int = 12000) -> str:
    """
    LLMs have token limits. Most contracts fit in 12000 chars (~3000 tokens).
    If the contract is longer, we take the first 12000 chars which usually
    contains all the key clauses.
    Increase max_chars if you're using a model with a larger context window.
    """
    if len(text) > max_chars:
        print(f"[text_cleaner] Warning: text truncated from {len(text)} to {max_chars} chars")
        return text[:max_chars]
    return text


def clean_text(raw: str, max_chars: int = 12000) -> str:
    """
    Master function — runs all cleaning steps in order.
    Call this before sending text to the LLM extractor.
    """
    text = remove_non_printable(raw)
    text = remove_page_artifacts(text)
    text = fix_line_breaks(text)
    text = normalize_whitespace(text)
    text = truncate_for_llm(text, max_chars)
    return text


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample = """
    VENDOR AGREEMENT

    Page 1 of 5

    This agreement is made between Acme Corp
    and Vendor Ltd on January 1, 2024.

    Page 2 of 5

    1. PAYMENT TERMS
    Payment shall be due within 30 days
    of invoice receipt.    All late payments will incur
    a penalty of 2% per month.


    CONFIDENTIAL - Draft v2
    """

    cleaned = clean_text(sample)
    print("[CLEANED OUTPUT]")
    print(cleaned)
    print(f"\nOriginal: {len(sample)} chars → Cleaned: {len(cleaned)} chars")
    
#Removes page numbers, headers, broken line breaks, and weird characters from raw PDF text before it goes to the LLM.
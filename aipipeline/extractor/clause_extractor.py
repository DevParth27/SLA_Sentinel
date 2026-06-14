"""
clause_extractor.py
The main function your backend calls. Ties everything together:
parse PDF → clean text → extract clauses → generate risks.
Returns one complete result dict ready to save to the database.
"""

import json
from datetime import datetime

from parser.pdf_parser import parse_pdf
from parser.text_cleaner import clean_text
from extractor.chain import extract_clauses, generate_risk_flags


def process_contract(
    source: str,
    from_s3: bool = False,
    bucket: str = None,
    contract_id: str = None,
) -> dict:
    """
    Full pipeline for a single contract.

    Args:
        source      : local file path OR S3 key
        from_s3     : set True if source is an S3 key
        bucket      : S3 bucket name (required if from_s3=True)
        contract_id : optional ID to include in the result for DB linking

    Returns a dict with:
        - contract_id
        - raw_text (truncated)
        - clauses (extracted structured data)
        - risk_flags (list of risk objects)
        - processed_at (timestamp)
        - status ("success" or "error")
    """
    result = {
        "contract_id": contract_id,
        "processed_at": datetime.utcnow().isoformat(),
        "status": "error",
        "raw_text": None,
        "clauses": None,
        "risk_flags": [],
    }

    try:
        # Step 1: Parse PDF to raw text
        print(f"[clause_extractor] Step 1: Parsing PDF from {'S3' if from_s3 else 'local'}")
        raw_text = parse_pdf(source, from_s3=from_s3, bucket=bucket)
        result["raw_text"] = raw_text[:500]  # store only preview in result

        # Step 2: Clean text
        print("[clause_extractor] Step 2: Cleaning text")
        cleaned = clean_text(raw_text)

        # Step 3: Extract clauses via LLM
        print("[clause_extractor] Step 3: Extracting clauses")
        clauses = extract_clauses(cleaned)
        result["clauses"] = clauses

        # Step 4: Generate risk flags
        print("[clause_extractor] Step 4: Generating risk flags")
        risk_flags = generate_risk_flags(clauses)
        result["risk_flags"] = risk_flags

        result["status"] = "success"
        print(f"[clause_extractor] Done. {len(risk_flags)} risk flags found.")

    except FileNotFoundError as e:
        result["error"] = f"File not found: {str(e)}"
        print(f"[clause_extractor] ERROR: {e}")

    except ValueError as e:
        result["error"] = f"Processing error: {str(e)}"
        print(f"[clause_extractor] ERROR: {e}")

    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        print(f"[clause_extractor] UNEXPECTED ERROR: {e}")

    return result


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python clause_extractor.py <path_to_pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    print(f"\nProcessing: {pdf_path}\n{'='*50}")

    result = process_contract(pdf_path, contract_id="test-001")

    print(f"\n{'='*50}")
    print(f"Status: {result['status']}")
    if result["status"] == "success":
        print(f"Clauses found: {list(result['clauses'].keys())}")
        print(f"Risk flags: {len(result['risk_flags'])}")
        for flag in result["risk_flags"]:
            print(f"  [{flag.get('severity')}] {flag.get('description')}")
    else:
        print(f"Error: {result.get('error')}")

    print("\nFull result:")
    print(json.dumps(result, indent=2))
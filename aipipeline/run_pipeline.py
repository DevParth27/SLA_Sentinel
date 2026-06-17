"""
run_pipeline.py

Run this file to test the COMPLETE AI pipeline end to end.
It uses the real vendor_agreement.pdf and your real OpenAI API key.
This is the single script that proves everything works together.

HOW TO RUN:
  cd ai-pipeline
  python run_pipeline.py

WHAT IT DOES:
  Step 1 - Parses vendor_agreement.pdf into text
  Step 2 - Cleans the text
  Step 3 - Sends to OpenAI and extracts clauses as JSON
  Step 4 - Scores the contract and generates risk flags
  Step 5 - Compares two contracts side by side
  Step 6 - Answers a what-if query

You will see real output from GPT-4o on your actual contract.
This costs approximately $0.02-0.05 in OpenAI credits per full run.
"""

import os
import json
import sys
from dotenv import load_dotenv

load_dotenv(".env.local")  # local dev secrets (gitignored)
load_dotenv()              # fallback to .env; no-op in production

# ── Check API key before doing anything ─────────────────────────────────────
if not os.getenv("OPENAI_API_KEY"):
    print("\n ERROR: OPENAI_API_KEY not found in .env file")
    print(" Copy .env.example to .env and add your OpenAI API key\n")
    sys.exit(1)

from parser.pdf_parser import parse_pdf_local
from parser.text_cleaner import clean_text
from extractor.clause_extractor import process_contract
from extractor.chain import answer_query, compare_contracts as llm_compare
from scorer.risk_scorer import calculate_score
from scorer.diff_engine import compare_contracts as diff_compare

PDF_PATH = os.path.join("samples", "sample_contract.pdf")


def print_section(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}")


def print_result(label, value):
    if isinstance(value, (dict, list)):
        print(f"\n{label}:")
        print(json.dumps(value, indent=2))
    else:
        print(f"\n{label}: {value}")


# ════════════════════════════════════════════════════════
# STEP 1 + 2 — Parse and clean the PDF
# ════════════════════════════════════════════════════════
print_section("STEP 1 & 2 — Parse and clean PDF")

if not os.path.exists(PDF_PATH):
    print(f"\n ERROR: PDF not found at {PDF_PATH}")
    print(" Run this first:  python tests/generate_sample_pdf.py\n")
    sys.exit(1)

raw_text = parse_pdf_local(PDF_PATH)
cleaned_text = clean_text(raw_text)

print(f" PDF path     : {PDF_PATH}")
print(f" Raw chars    : {len(raw_text)}")
print(f" Cleaned chars: {len(cleaned_text)}")
print(f"\n First 300 chars of cleaned text:")
print(f" {cleaned_text[:300]}...")
print("\n PASS: PDF parsed and cleaned successfully")


# ════════════════════════════════════════════════════════
# STEP 3 + 4 — Extract clauses and score (full pipeline)
# ════════════════════════════════════════════════════════
print_section("STEP 3 & 4 — Extract clauses + Score (calling OpenAI now...)")
print(" This may take 10-20 seconds...")

result = process_contract(PDF_PATH, contract_id="hackathon-demo-001")

if result["status"] == "error":
    print(f"\n ERROR during processing: {result.get('error')}")
    sys.exit(1)

clauses = result["clauses"]
risk_flags = result["risk_flags"]

# Show extracted clauses
print("\n EXTRACTED CLAUSES:")
print(f"   Contract title  : {clauses.get('contract_title', 'N/A')}")
print(f"   Party A         : {clauses.get('parties', {}).get('party_a', 'N/A')}")
print(f"   Party B         : {clauses.get('parties', {}).get('party_b', 'N/A')}")
print(f"   Effective date  : {clauses.get('effective_date', 'N/A')}")
print(f"   Expiry date     : {clauses.get('expiry_date', 'N/A')}")
print(f"   Renewal date    : {clauses.get('renewal_date', 'N/A')}")
print(f"   Renewal terms   : {clauses.get('renewal_terms', 'N/A')}")
print(f"   Notice period   : {clauses.get('notice_period_days', 'N/A')} days")
print(f"   Governing law   : {clauses.get('governing_law', 'N/A')}")
print(f"   Liability cap   : {clauses.get('liability_cap', 'N/A')}")
print(f"   Indemnification : {clauses.get('indemnification', 'N/A')}")
print(f"   Confidentiality : {clauses.get('confidentiality_clause', 'N/A')}")

pt = clauses.get("payment_terms", {})
print(f"\n PAYMENT TERMS:")
print(f"   Amount          : {pt.get('currency','?')} {pt.get('amount','N/A')}")
print(f"   Due in          : {pt.get('due_days', 'N/A')} days")
print(f"   Frequency       : {pt.get('frequency', 'N/A')}")

penalties = clauses.get("penalty_clauses", [])
print(f"\n PENALTY CLAUSES ({len(penalties)} found):")
for p in penalties:
    print(f"   - {p.get('description')}: {p.get('amount_or_rate')}")

slas = clauses.get("sla_terms", [])
print(f"\n SLA TERMS ({len(slas)} found):")
for s in slas:
    print(f"   - {s.get('metric')} → target: {s.get('target')} | breach: {s.get('consequence','None')}")

terms = clauses.get("termination_conditions", [])
print(f"\n TERMINATION CONDITIONS ({len(terms)} found):")
for t in terms:
    print(f"   - {t}")

# Show risk score
print_section("RISK SCORE (calculated from extracted clauses)")
score_result = calculate_score(clauses)
print(f"\n Score  : {score_result['score']} / 100")
print(f" Grade  : {score_result['grade']}")
print(f" Summary: {score_result['summary']}")
print(f"\n Risk flags from scorer ({len(score_result['flags'])} flags):")
for flag in score_result["flags"]:
    print(f"   [{flag['severity']:6}] {flag['risk_type']:12} — {flag['description'][:70]}")

# Show LLM-generated risk flags
print(f"\n Risk flags from LLM ({len(risk_flags)} flags):")
for flag in risk_flags:
    sev = flag.get("severity", "?")
    rtype = flag.get("risk_type", "?")
    desc = flag.get("description", "")[:70]
    print(f"   [{sev:6}] {rtype:12} — {desc}")

print("\n PASS: Clauses extracted and scored successfully")


# ════════════════════════════════════════════════════════
# STEP 5 — Compare two contracts
# ════════════════════════════════════════════════════════
print_section("STEP 5 — Compare two contracts (calling OpenAI now...)")
print(" Creating a second contract variant for comparison...")

# Second contract with different terms to compare against
contract_b_clauses = {
    "contract_title": "Vendor Service Agreement — Competitor",
    "parties": {"party_a": "TechCorp Solutions Pvt. Ltd.", "party_b": "RivalVendor Pvt. Ltd."},
    "effective_date": "2024-01-01",
    "expiry_date": "2025-06-30",
    "renewal_date": "2025-05-31",
    "renewal_terms": "Auto-renews for 2 years unless 60-day notice",
    "payment_terms": {"amount": 380000, "currency": "INR", "due_days": 30, "frequency": "Monthly"},
    "penalty_clauses": [],
    "sla_terms": [{"metric": "uptime", "target": "99.5%", "consequence": None}],
    "termination_conditions": ["90 days written notice", "Immediate for material breach"],
    "notice_period_days": 90,
    "governing_law": "Maharashtra, courts of Mumbai",
    "liability_cap": "INR 10,00,000",
    "indemnification": False,
    "confidentiality_clause": True,
}

contracts_for_compare = [
    {"title": clauses.get("contract_title", "Contract A"), "clauses": clauses},
    {"title": "RivalVendor Agreement",                      "clauses": contract_b_clauses},
]

# Fast deterministic diff (no API call)
diff = diff_compare(contracts_for_compare)
print(f"\n FIELD DIFF RESULTS:")
print(f"   Total differences : {diff['total_differences']}")
print(f"   Total matches     : {diff['total_matches']}")
print(f"\n Key differences:")
for d in diff["differences"][:6]:
    print(f"   {d['label']}:")
    for contract_title, val in d["values"].items():
        better = " ← better" if d.get("better_contract") == contract_title else ""
        print(f"     {contract_title}: {val}{better}")

# LLM summary
print(f"\n Generating LLM comparison summary...")
llm_comparison = llm_compare([clauses, contract_b_clauses])
print(f"\n LLM COMPARISON SUMMARY:")
print(f"   {llm_comparison.get('summary', 'N/A')}")
print(f"\n Recommendation:")
print(f"   {llm_comparison.get('recommendation', 'N/A')}")
print("\n PASS: Contract comparison completed")


# ════════════════════════════════════════════════════════
# STEP 6 — What-if query
# ════════════════════════════════════════════════════════
print_section("STEP 6 — What-if natural language query")

question = "What contracts are renewing soon and what is the notice period I need to give?"

print(f"\n Question: {question}")
print(f"\n Asking OpenAI...")

answer = answer_query(
    question=question,
    contracts_data=[clauses, contract_b_clauses],
)

print(f"\n Answer:\n {answer}")
print("\n PASS: What-if query answered")


# ════════════════════════════════════════════════════════
# FINAL SUMMARY
# ════════════════════════════════════════════════════════
print_section("COMPLETE PIPELINE TEST — FINAL SUMMARY")
print(f"""
 Step 1 — PDF parsed        : {len(raw_text)} characters extracted
 Step 2 — Text cleaned      : {len(cleaned_text)} characters after cleaning
 Step 3 — Clauses extracted : {len(clauses)} fields returned by GPT-4o
 Step 4 — Risk scored       : {score_result['score']}/100 (Grade {score_result['grade']})
 Step 5 — Contracts compared: {diff['total_differences']} differences found
 Step 6 — Query answered    : question answered in plain English

 ALL STEPS PASSED — pipeline is working correctly
 Your AI pipeline is ready for the hackathon demo!
""")
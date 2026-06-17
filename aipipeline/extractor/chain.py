"""
chain.py
Connects prompts to the LLM using the OpenAI SDK directly.
Handles JSON parsing and error logging.
This is the file that actually talks to the OpenAI API.
"""

import json
import re
import os
from datetime import date
from openai import OpenAI
from dotenv import load_dotenv

from .prompts import (
    CLAUSE_EXTRACTION_PROMPT,
    RISK_FLAG_PROMPT,
    WHAT_IF_PROMPT,
    COMPARISON_PROMPT,
)

load_dotenv(".env.local")  # local dev secrets (gitignored)
load_dotenv()              # fallback to .env; no-op in production

MODEL = "gpt-4o-mini"

# Reuse a single client across calls instead of rebuilding it each time.
_client: OpenAI | None = None


def get_client() -> OpenAI:
    """
    Returns a cached OpenAI client.
    Raises if the API key is missing so failures are obvious during dev.
    """
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"[chain] API key loaded: {'YES' if api_key else 'NO — CHECK .env'}")
        if not api_key:
            raise EnvironmentError("OPENAI_API_KEY not set in .env")
        _client = OpenAI(api_key=api_key)
    return _client


def _complete(prompt: str, temperature: float = 0.0) -> str:
    """
    Sends a single user prompt to the chat model and returns the raw text.
    temperature=0 means deterministic output — important for JSON extraction.
    """
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def parse_json_response(raw: str) -> dict | list:
    """
    LLMs sometimes wrap JSON in markdown code blocks like ```json ... ```
    This function strips that and parses cleanly.
    Raises ValueError if the output is not valid JSON.
    """
    # Strip markdown code blocks if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\n\nRaw output:\n{raw}")


def extract_clauses(contract_text: str) -> dict:
    """
    Sends cleaned contract text to the LLM and returns structured clause data.
    This is the core extraction function — everything else builds on this.
    """
    formatted = CLAUSE_EXTRACTION_PROMPT.format(contract_text=contract_text)

    print("[chain] Sending contract to LLM for extraction...")
    raw = _complete(formatted)

    print("[chain] Parsing LLM response...")
    return parse_json_response(raw)


def generate_risk_flags(contract_data: dict) -> list:
    """
    Takes extracted clause data and asks the LLM to identify risk flags.
    Returns a list of risk objects with severity and description.
    """
    formatted = RISK_FLAG_PROMPT.format(
        contract_data=json.dumps(contract_data, indent=2),
        today=date.today().isoformat(),
    )

    print("[chain] Generating risk flags...")
    return parse_json_response(_complete(formatted))


def answer_query(question: str, contracts_data: list[dict]) -> str:
    """
    Answers a natural language what-if question using contract data.
    e.g. "What contracts are renewing next quarter?"
    Returns a plain text answer string.
    """
    formatted = WHAT_IF_PROMPT.format(
        question=question,
        contracts_data=json.dumps(contracts_data, indent=2),
        today=date.today().isoformat(),
    )

    print(f"[chain] Answering query: {question}")
    # slight creativity for natural answers
    return _complete(formatted, temperature=0.2).strip()


def compare_contracts(contracts_data: list[dict]) -> dict:
    """
    Compares two or more contracts and highlights differences.
    Returns structured comparison with a recommendation.
    """
    if len(contracts_data) < 2:
        raise ValueError("Need at least 2 contracts to compare")

    formatted = COMPARISON_PROMPT.format(
        contracts_data=json.dumps(contracts_data, indent=2)
    )

    print(f"[chain] Comparing {len(contracts_data)} contracts...")
    return parse_json_response(_complete(formatted))


# ── Quick test ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    sample_text = """
    SERVICE AGREEMENT between TechCorp Inc and Vendor Ltd.
    Effective Date: January 1, 2024. Expiry: December 31, 2024.
    Auto-renews for 1 year unless 30-day written notice is given.
    Payment: $5,000 USD per month, due within 15 days of invoice.
    Late payment penalty: 2% per month on outstanding amounts.
    SLA: 99.9% uptime. Breach results in 10% credit of monthly fee.
    Either party may terminate with 60 days written notice.
    Governing law: State of California.
    """

    print("=== Testing clause extraction ===")
    clauses = extract_clauses(sample_text)
    print(json.dumps(clauses, indent=2))

    print("\n=== Testing risk flag generation ===")
    flags = generate_risk_flags(clauses)
    print(json.dumps(flags, indent=2))

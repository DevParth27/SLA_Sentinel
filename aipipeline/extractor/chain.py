"""
chain.py
Connects prompts to the LLM using LangChain.
Handles JSON parsing, retries on bad output, and error logging.
This is the file that actually talks to OpenAI / Anthropic API.
"""

import json
import re
import os
from datetime import date
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage
from dotenv import load_dotenv

from .prompts import (
    CLAUSE_EXTRACTION_PROMPT,
    RISK_FLAG_PROMPT,
    WHAT_IF_PROMPT,
    COMPARISON_PROMPT,
)

load_dotenv()


def get_llm(temperature: float = 0.0) -> ChatOpenAI:
    """
    Returns the LLM client.
    temperature=0 means deterministic output — important for JSON extraction.
    Change model to "gpt-3.5-turbo" if you want faster/cheaper results for testing.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENAI_API_KEY not set in .env")
    return ChatOpenAI(
        model="gpt-4o",
        temperature=temperature,
        openai_api_key=api_key,
    )


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
    llm = get_llm()
    prompt = PromptTemplate.from_template(CLAUSE_EXTRACTION_PROMPT)
    formatted = prompt.format(contract_text=contract_text)

    print("[chain] Sending contract to LLM for extraction...")
    response = llm.invoke([HumanMessage(content=formatted)])
    raw = response.content

    print("[chain] Parsing LLM response...")
    return parse_json_response(raw)


def generate_risk_flags(contract_data: dict) -> list:
    """
    Takes extracted clause data and asks the LLM to identify risk flags.
    Returns a list of risk objects with severity and description.
    """
    llm = get_llm()
    prompt = PromptTemplate.from_template(RISK_FLAG_PROMPT)
    formatted = prompt.format(
        contract_data=json.dumps(contract_data, indent=2),
        today=date.today().isoformat(),
    )

    print("[chain] Generating risk flags...")
    response = llm.invoke([HumanMessage(content=formatted)])
    return parse_json_response(response.content)


def answer_query(question: str, contracts_data: list[dict]) -> str:
    """
    Answers a natural language what-if question using contract data.
    e.g. "What contracts are renewing next quarter?"
    Returns a plain text answer string.
    """
    llm = get_llm(temperature=0.2)  # slight creativity for natural answers
    prompt = PromptTemplate.from_template(WHAT_IF_PROMPT)
    formatted = prompt.format(
        question=question,
        contracts_data=json.dumps(contracts_data, indent=2),
        today=date.today().isoformat(),
    )

    print(f"[chain] Answering query: {question}")
    response = llm.invoke([HumanMessage(content=formatted)])
    return response.content.strip()


def compare_contracts(contracts_data: list[dict]) -> dict:
    """
    Compares two or more contracts and highlights differences.
    Returns structured comparison with a recommendation.
    """
    if len(contracts_data) < 2:
        raise ValueError("Need at least 2 contracts to compare")

    llm = get_llm()
    prompt = PromptTemplate.from_template(COMPARISON_PROMPT)
    formatted = prompt.format(
        contracts_data=json.dumps(contracts_data, indent=2)
    )

    print(f"[chain] Comparing {len(contracts_data)} contracts...")
    response = llm.invoke([HumanMessage(content=formatted)])
    return parse_json_response(response.content)


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
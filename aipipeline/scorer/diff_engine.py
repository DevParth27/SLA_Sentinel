"""
diff_engine.py

WHAT IT DOES (2-3 lines):
Compares two or more extracted contract JSONs side by side and highlights
differences in key fields like payment terms, notice periods, renewal dates,
and penalties. Returns a structured diff ready to display on the dashboard.

WHY THIS EXISTS SEPARATELY FROM chain.py:
chain.py calls the LLM for a qualitative comparison summary.
This file does fast deterministic field-by-field diffing in pure Python —
no API call, no cost, instant results. Both are used together on the dashboard.
"""

from datetime import date, datetime
from typing import Optional


# Fields to compare and their display labels
COMPARABLE_FIELDS = [
    ("expiry_date",            "Expiry date"),
    ("renewal_date",           "Renewal date"),
    ("renewal_terms",          "Renewal terms"),
    ("notice_period_days",     "Notice period (days)"),
    ("governing_law",          "Governing law"),
    ("liability_cap",          "Liability cap"),
    ("indemnification",        "Indemnification clause"),
    ("confidentiality_clause", "Confidentiality clause"),
]

NESTED_FIELDS = [
    ("payment_terms.amount",    "Payment amount"),
    ("payment_terms.currency",  "Currency"),
    ("payment_terms.due_days",  "Payment due (days)"),
    ("payment_terms.frequency", "Payment frequency"),
]


def _get_nested(data: dict, dotted_key: str):
    """Safely get a value from a nested dict using dot notation e.g. 'payment_terms.amount'"""
    keys = dotted_key.split(".")
    val = data
    for k in keys:
        if not isinstance(val, dict):
            return None
        val = val.get(k)
    return val


def _format_value(val) -> str:
    """Convert any value to a readable string for display."""
    if val is None:
        return "Not specified"
    if isinstance(val, bool):
        return "Yes" if val else "No"
    if isinstance(val, list):
        if not val:
            return "None"
        # For lists of strings
        if all(isinstance(i, str) for i in val):
            return "; ".join(val)
        # For lists of dicts (e.g. penalty_clauses)
        return f"{len(val)} item(s)"
    return str(val)


def _days_until(date_str: Optional[str]) -> Optional[int]:
    """Returns days until a date string (YYYY-MM-DD)."""
    if not date_str:
        return None
    try:
        d = datetime.strptime(date_str, "%Y-%m-%d").date()
        return (d - date.today()).days
    except (ValueError, TypeError):
        return None


def _highlight_better(field_key: str, values: list) -> Optional[int]:
    """
    For certain fields, determine which contract has a "better" value.
    Returns the index of the better contract, or None if not determinable.
    Lower is better for: due_days, notice_period_days (more notice = better).
    Higher is better for: payment amount (you want to be paid more).
    Sooner is worse for: expiry_date, renewal_date.
    """
    try:
        if field_key == "payment_terms.due_days":
            # More days to pay = better for you as payer
            nums = [int(v) for v in values if v not in (None, "Not specified")]
            if len(nums) == len(values):
                return values.index(max(nums))

        if field_key == "notice_period_days":
            # More notice days = more time to plan = better
            nums = [int(v) for v in values if v not in (None, "Not specified")]
            if len(nums) == len(values):
                return values.index(max(nums))

        if field_key in ("expiry_date", "renewal_date"):
            # Later date = more time = better
            days = [_days_until(v) for v in values]
            if all(d is not None for d in days):
                return days.index(max(days))

    except (ValueError, TypeError):
        pass

    return None


def compare_contracts(contracts: list[dict]) -> dict:
    """
    Main comparison function.

    Args:
        contracts: list of dicts, each with:
                   - 'title': contract name (string)
                   - 'clauses': extracted clause dict from clause_extractor

    Returns:
        {
          "contract_titles": [...],
          "differences": [...],   # fields that differ across contracts
          "matches": [...],       # fields that are the same
          "penalty_comparison": [...],
          "sla_comparison": [...],
          "termination_comparison": [...]
        }
    """
    if len(contracts) < 2:
        raise ValueError("Need at least 2 contracts to compare")

    titles = [c.get("title", f"Contract {i+1}") for i, c in enumerate(contracts)]
    clauses_list = [c.get("clauses", {}) for c in contracts]

    differences = []
    matches = []

    # ── Compare flat fields ──────────────────────────────────────────────────
    all_fields = COMPARABLE_FIELDS + [(k, label) for k, label in NESTED_FIELDS]

    for field_key, label in all_fields:
        if "." in field_key:
            raw_values = [_get_nested(c, field_key) for c in clauses_list]
        else:
            raw_values = [c.get(field_key) for c in clauses_list]

        display_values = [_format_value(v) for v in raw_values]

        entry = {
            "field": field_key,
            "label": label,
            "values": dict(zip(titles, display_values)),
        }

        # Check if all values are the same
        if len(set(display_values)) == 1:
            entry["match"] = True
            matches.append(entry)
        else:
            entry["match"] = False
            better_idx = _highlight_better(field_key, raw_values)
            entry["better_contract"] = titles[better_idx] if better_idx is not None else None
            differences.append(entry)

    # ── Compare penalty clauses ──────────────────────────────────────────────
    penalty_comparison = []
    for i, (title, clauses) in enumerate(zip(titles, clauses_list)):
        penalties = clauses.get("penalty_clauses", [])
        penalty_comparison.append({
            "contract": title,
            "count": len(penalties),
            "details": penalties,
        })

    # ── Compare SLA terms ────────────────────────────────────────────────────
    sla_comparison = []
    for title, clauses in zip(titles, clauses_list):
        slas = clauses.get("sla_terms", [])
        sla_comparison.append({
            "contract": title,
            "count": len(slas),
            "details": slas,
        })

    # ── Compare termination conditions ───────────────────────────────────────
    termination_comparison = []
    for title, clauses in zip(titles, clauses_list):
        terms = clauses.get("termination_conditions", [])
        termination_comparison.append({
            "contract": title,
            "conditions": terms,
        })

    return {
        "contract_titles": titles,
        "total_differences": len(differences),
        "total_matches": len(matches),
        "differences": differences,
        "matches": matches,
        "penalty_comparison": penalty_comparison,
        "sla_comparison": sla_comparison,
        "termination_comparison": termination_comparison,
    }


# ── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    contract_a = {
        "title": "Vendor A Agreement",
        "clauses": {
            "expiry_date": "2024-12-31",
            "renewal_date": "2024-11-30",
            "renewal_terms": "Auto-renews for 1 year unless 30-day notice",
            "notice_period_days": 30,
            "governing_law": "California",
            "liability_cap": "$100,000",
            "indemnification": True,
            "confidentiality_clause": True,
            "payment_terms": {
                "amount": 5000,
                "currency": "USD",
                "due_days": 15,
                "frequency": "Monthly",
            },
            "penalty_clauses": [
                {"description": "Late payment", "amount_or_rate": "2% per month"}
            ],
            "sla_terms": [
                {"metric": "uptime", "target": "99.9%", "consequence": "10% credit"}
            ],
            "termination_conditions": ["60 days written notice"],
        },
    }

    contract_b = {
        "title": "Vendor B Agreement",
        "clauses": {
            "expiry_date": "2025-06-30",
            "renewal_date": "2025-05-31",
            "renewal_terms": "Auto-renews for 2 years unless 60-day notice",
            "notice_period_days": 60,
            "governing_law": "New York",
            "liability_cap": None,
            "indemnification": False,
            "confidentiality_clause": True,
            "payment_terms": {
                "amount": 4000,
                "currency": "USD",
                "due_days": 30,
                "frequency": "Monthly",
            },
            "penalty_clauses": [],
            "sla_terms": [],
            "termination_conditions": [
                "90 days written notice",
                "Immediate termination for material breach",
            ],
        },
    }

    result = compare_contracts([contract_a, contract_b])

    print(f"Differences: {result['total_differences']}")
    print(f"Matches: {result['total_matches']}")
    print("\nKey differences:")
    for diff in result["differences"]:
        print(f"  {diff['label']}:")
        for contract, val in diff["values"].items():
            better = " ← better" if diff.get("better_contract") == contract else ""
            print(f"    {contract}: {val}{better}")

    print("\nFull result:")
    print(json.dumps(result, indent=2))
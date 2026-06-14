"""
risk_scorer.py

WHAT IT DOES (2-3 lines):
Takes the extracted clause JSON from the LLM and calculates a risk score (0-100)
using pure Python logic — no LLM call needed here. Checks renewal dates, penalty
clauses, SLA terms, notice periods, and liability caps to produce a score + flag list.

WHY THIS EXISTS SEPARATELY FROM chain.py:
chain.py uses the LLM to generate qualitative risk flags in plain English.
This file uses deterministic rule-based logic for a numeric score.
Both are used together — the score goes into the DB, the flags show on the dashboard.
"""

from datetime import date, datetime
from typing import Optional


# ── Scoring weights ──────────────────────────────────────────────────────────
# Each risk category deducts points from a perfect score of 100.
# Adjust these weights based on what matters most to your users.

WEIGHTS = {
    "renewal_within_30_days":  25,   # Critical — likely to be missed
    "renewal_within_90_days":  15,   # Warning — approaching soon
    "has_penalty_clause":      15,   # Notable — financial exposure
    "high_penalty_rate":       10,   # Extra deduction if penalty > 5%
    "sla_with_consequence":    10,   # SLA breach has financial consequence
    "no_liability_cap":        10,   # Uncapped liability = high exposure
    "short_notice_period":     10,   # Notice < 14 days = risky
    "no_termination_clause":   10,   # No exit terms = trapped
    "indemnification":          5,   # Has indemnification clause = some risk
}


def _parse_date(date_str: Optional[str]) -> Optional[date]:
    """Safely parse a date string in YYYY-MM-DD format. Returns None if invalid."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _days_until(target_date: Optional[date]) -> Optional[int]:
    """Returns number of days until a future date. Negative means it's passed."""
    if not target_date:
        return None
    return (target_date - date.today()).days


def score_renewal(clauses: dict) -> tuple[int, list[dict]]:
    """Check renewal date proximity."""
    deduction = 0
    flags = []

    renewal_date = _parse_date(clauses.get("renewal_date"))
    expiry_date = _parse_date(clauses.get("expiry_date"))

    # Use whichever is sooner — renewal or expiry
    check_date = None
    if renewal_date and expiry_date:
        check_date = min(renewal_date, expiry_date)
    elif renewal_date:
        check_date = renewal_date
    elif expiry_date:
        check_date = expiry_date

    days = _days_until(check_date)

    if days is not None:
        if 0 <= days <= 30:
            deduction += WEIGHTS["renewal_within_30_days"]
            flags.append({
                "risk_type": "RENEWAL",
                "severity": "HIGH",
                "description": f"Contract renews or expires in {days} days ({check_date}). Immediate action required.",
                "field_reference": "renewal_date / expiry_date",
            })
        elif 31 <= days <= 90:
            deduction += WEIGHTS["renewal_within_90_days"]
            flags.append({
                "risk_type": "RENEWAL",
                "severity": "MEDIUM",
                "description": f"Contract renews or expires in {days} days ({check_date}). Plan ahead.",
                "field_reference": "renewal_date / expiry_date",
            })
        elif days < 0:
            deduction += WEIGHTS["renewal_within_30_days"]
            flags.append({
                "risk_type": "RENEWAL",
                "severity": "HIGH",
                "description": f"Contract expired {abs(days)} days ago on {check_date}. Verify current status.",
                "field_reference": "renewal_date / expiry_date",
            })

    return deduction, flags


def score_penalties(clauses: dict) -> tuple[int, list[dict]]:
    """Check for penalty clauses and their severity."""
    deduction = 0
    flags = []

    penalties = clauses.get("penalty_clauses", [])
    if not penalties:
        return 0, []

    deduction += WEIGHTS["has_penalty_clause"]
    flags.append({
        "risk_type": "PENALTY",
        "severity": "MEDIUM",
        "description": f"Contract contains {len(penalties)} penalty clause(s). Review financial exposure.",
        "field_reference": "penalty_clauses",
    })

    # Check if any penalty rate is above 5% (high severity)
    for p in penalties:
        rate_str = str(p.get("amount_or_rate", ""))
        # Look for a percentage number above 5
        import re
        match = re.search(r"(\d+(?:\.\d+)?)\s*%", rate_str)
        if match and float(match.group(1)) > 5:
            deduction += WEIGHTS["high_penalty_rate"]
            flags.append({
                "risk_type": "PENALTY",
                "severity": "HIGH",
                "description": f"High penalty rate detected: {rate_str}. This exceeds the 5% threshold.",
                "field_reference": "penalty_clauses",
            })
            break  # only flag once even if multiple high penalties

    return deduction, flags


def score_sla(clauses: dict) -> tuple[int, list[dict]]:
    """Check SLA terms for financial consequences."""
    deduction = 0
    flags = []

    slas = clauses.get("sla_terms", [])
    for sla in slas:
        if sla.get("consequence"):
            deduction += WEIGHTS["sla_with_consequence"]
            flags.append({
                "risk_type": "SLA",
                "severity": "MEDIUM",
                "description": f"SLA breach for '{sla.get('metric')}' (target: {sla.get('target')}) results in: {sla.get('consequence')}",
                "field_reference": "sla_terms",
            })
            break  # deduct once even if multiple SLAs have consequences

    return deduction, flags


def score_liability(clauses: dict) -> tuple[int, list[dict]]:
    """Check for missing or uncapped liability."""
    deduction = 0
    flags = []

    if not clauses.get("liability_cap"):
        deduction += WEIGHTS["no_liability_cap"]
        flags.append({
            "risk_type": "LIABILITY",
            "severity": "HIGH",
            "description": "No liability cap found. Unlimited liability exposure in case of breach.",
            "field_reference": "liability_cap",
        })

    if clauses.get("indemnification"):
        deduction += WEIGHTS["indemnification"]
        flags.append({
            "risk_type": "LIABILITY",
            "severity": "LOW",
            "description": "Contract includes an indemnification clause. Review scope of indemnity.",
            "field_reference": "indemnification",
        })

    return deduction, flags


def score_termination(clauses: dict) -> tuple[int, list[dict]]:
    """Check termination conditions and notice period."""
    deduction = 0
    flags = []

    termination = clauses.get("termination_conditions", [])
    notice_days = clauses.get("notice_period_days")

    if not termination:
        deduction += WEIGHTS["no_termination_clause"]
        flags.append({
            "risk_type": "TERMINATION",
            "severity": "HIGH",
            "description": "No termination conditions found. You may be locked into this contract.",
            "field_reference": "termination_conditions",
        })

    if notice_days is not None:
        try:
            days = int(notice_days)
            if days < 14:
                deduction += WEIGHTS["short_notice_period"]
                flags.append({
                    "risk_type": "TERMINATION",
                    "severity": "MEDIUM",
                    "description": f"Very short notice period: {days} days. May not be enough time to transition.",
                    "field_reference": "notice_period_days",
                })
        except (ValueError, TypeError):
            pass

    return deduction, flags


def calculate_score(clauses: dict) -> dict:
    """
    Master scoring function. Runs all checks and returns:
    - score (0-100, higher is safer)
    - grade (A/B/C/D/F)
    - flags (list of risk objects)
    - summary (plain text)
    """
    total_deduction = 0
    all_flags = []

    checks = [
        score_renewal(clauses),
        score_penalties(clauses),
        score_sla(clauses),
        score_liability(clauses),
        score_termination(clauses),
    ]

    for deduction, flags in checks:
        total_deduction += deduction
        all_flags.extend(flags)

    # Clamp score between 0 and 100
    score = max(0, min(100, 100 - total_deduction))

    # Assign grade
    if score >= 80:
        grade = "A"
    elif score >= 65:
        grade = "B"
    elif score >= 50:
        grade = "C"
    elif score >= 35:
        grade = "D"
    else:
        grade = "F"

    # Count by severity
    high = sum(1 for f in all_flags if f["severity"] == "HIGH")
    medium = sum(1 for f in all_flags if f["severity"] == "MEDIUM")
    low = sum(1 for f in all_flags if f["severity"] == "LOW")

    summary = (
        f"Risk score: {score}/100 (Grade {grade}). "
        f"{high} high, {medium} medium, {low} low severity issues found."
    )

    return {
        "score": score,
        "grade": grade,
        "flags": all_flags,
        "summary": summary,
        "high_count": high,
        "medium_count": medium,
        "low_count": low,
    }


# ── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    sample_clauses = {
        "renewal_date": "2024-07-15",
        "expiry_date": "2024-12-31",
        "penalty_clauses": [
            {"description": "Late payment", "amount_or_rate": "2% per month"}
        ],
        "sla_terms": [
            {
                "metric": "uptime",
                "target": "99.9%",
                "consequence": "10% credit of monthly fee",
            }
        ],
        "termination_conditions": ["60 days written notice"],
        "notice_period_days": 60,
        "liability_cap": None,
        "indemnification": True,
    }

    result = calculate_score(sample_clauses)
    print(json.dumps(result, indent=2))
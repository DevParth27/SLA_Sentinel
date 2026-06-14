"""
prompts.py
All LLM prompts live here in one place.
Keeping prompts separate from code makes them easy to tweak and test
without touching any logic files.
"""

# ── Main clause extraction prompt ───────────────────────────────────────────
CLAUSE_EXTRACTION_PROMPT = """
You are an expert legal contract analyst. Your job is to carefully read the
contract text below and extract key information.

Extract ONLY what is explicitly stated in the contract. If a field is not
mentioned, return null for that field. Do NOT guess or infer.

Return your response as valid JSON only. No explanation, no markdown, no
code blocks — just raw JSON.

Extract these fields:

{{
  "contract_title": "Name or title of the contract if mentioned",
  "parties": {{
    "party_a": "First party name",
    "party_b": "Second party name"
  }},
  "effective_date": "Contract start date in YYYY-MM-DD format or null",
  "expiry_date": "Contract end date in YYYY-MM-DD format or null",
  "renewal_date": "Auto-renewal or next renewal date in YYYY-MM-DD format or null",
  "renewal_terms": "Description of renewal terms (e.g. auto-renews for 1 year unless 30-day notice) or null",
  "payment_terms": {{
    "amount": "Contract value or payment amount as a number or null",
    "currency": "Currency code e.g. USD, INR or null",
    "due_days": "Number of days for payment after invoice or null",
    "frequency": "One-time / Monthly / Quarterly / Annual or null"
  }},
  "penalty_clauses": [
    {{
      "description": "What the penalty is for",
      "amount_or_rate": "Penalty amount or percentage rate"
    }}
  ],
  "sla_terms": [
    {{
      "metric": "What is being measured e.g. uptime, response time",
      "target": "The SLA target e.g. 99.9%, 4 hours",
      "consequence": "What happens if SLA is breached or null"
    }}
  ],
  "termination_conditions": [
    "List each termination condition as a plain English string"
  ],
  "notice_period_days": "Number of days notice required for termination or null",
  "governing_law": "Jurisdiction or governing law mentioned or null",
  "key_obligations": [
    "List the top 3-5 key obligations of each party as plain English strings"
  ],
  "confidentiality_clause": true or false,
  "liability_cap": "Maximum liability amount mentioned or null",
  "indemnification": true or false
}}

CONTRACT TEXT:
{contract_text}
"""


# ── Risk flag prompt ─────────────────────────────────────────────────────────
RISK_FLAG_PROMPT = """
You are a contract risk analyst. Given this extracted contract data, identify
risks that a business should be aware of.

Look for:
- Upcoming renewal or expiry dates within 90 days
- High penalty clauses
- Aggressive SLA requirements with heavy consequences
- Short notice periods for termination
- Missing liability caps
- Auto-renewal clauses that might be missed
- Unusual or one-sided obligations

Return ONLY a JSON array of risk flags. Each flag has:
{{
  "risk_type": "One of: RENEWAL | PENALTY | SLA | TERMINATION | LIABILITY | OBLIGATION | OTHER",
  "severity": "One of: HIGH | MEDIUM | LOW",
  "description": "Plain English explanation of the risk in 1-2 sentences",
  "field_reference": "Which field this came from e.g. renewal_date, penalty_clauses"
}}

Contract data:
{contract_data}

Today's date: {today}
"""


# ── What-if / natural language query prompt ──────────────────────────────────
WHAT_IF_PROMPT = """
You are a contract intelligence assistant. You have access to a set of
contracts and their extracted data. Answer the user's question based ONLY
on the contract data provided.

Be concise and specific. If the answer involves dates, mention them explicitly.
If multiple contracts are relevant, mention each one.
If the data does not contain enough information to answer, say so clearly.

Contract data:
{contracts_data}

Today's date: {today}

User's question: {question}
"""


# ── Multi-contract comparison prompt ─────────────────────────────────────────
COMPARISON_PROMPT = """
You are a contract comparison analyst. Compare the following contracts and
highlight the key differences between them.

Focus on:
- Payment terms and amounts
- Renewal dates and terms
- Penalty clauses
- SLA requirements
- Termination conditions
- Notice periods

Return ONLY a JSON object structured as:
{{
  "summary": "2-3 sentence plain English summary of the key differences",
  "differences": [
    {{
      "field": "Field name e.g. notice_period_days",
      "values": {{
        "contract_1_title": "value from contract 1",
        "contract_2_title": "value from contract 2"
      }},
      "note": "Brief note on which is more favourable or null"
    }}
  ],
  "recommendation": "1-2 sentence recommendation on which contract terms are more favourable overall"
}}

Contracts:
{contracts_data}
"""
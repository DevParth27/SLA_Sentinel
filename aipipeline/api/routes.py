"""
api/routes.py

WHAT IT DOES (2-3 lines):
Defines all HTTP endpoints that your Next.js backend will call. Three main
endpoints — process a single contract, answer a what-if query, and compare
multiple contracts. Each endpoint validates input and returns clean JSON.
"""

import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import tempfile
import shutil

from extractor.clause_extractor import process_contract
from extractor.chain import answer_query, compare_contracts as llm_compare
from scorer.risk_scorer import calculate_score
from scorer.diff_engine import compare_contracts as diff_compare

router = APIRouter()


# ── Request / Response models ────────────────────────────────────────────────

class ProcessS3Request(BaseModel):
    s3_key: str
    bucket: str
    contract_id: Optional[str] = None


class QueryRequest(BaseModel):
    question: str
    contracts_data: list[dict]


class CompareRequest(BaseModel):
    contracts: list[dict]  # each: { "title": str, "clauses": dict }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/process/upload")
async def process_uploaded_pdf(
    file: UploadFile = File(...),
    contract_id: Optional[str] = None,
):
    """
    Upload a PDF directly and process it.
    Used during local dev — in production use the S3 endpoint instead.

    Your teammate calls this from Next.js like:
      const formData = new FormData()
      formData.append('file', pdfFile)
      fetch('/api/process/upload', { method: 'POST', body: formData })
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save upload to temp file
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = process_contract(
            source=tmp_path,
            from_s3=False,
            contract_id=contract_id or file.filename,
        )

        if result["status"] == "error":
            raise HTTPException(status_code=422, detail=result.get("error"))

        # Add risk score to result
        if result.get("clauses"):
            result["risk_score"] = calculate_score(result["clauses"])

        return result

    finally:
        # Always clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/process/s3")
def process_from_s3(body: ProcessS3Request):
    """
    Process a PDF that was already uploaded to S3.
    This is the production flow — frontend uploads to S3 directly,
    then calls this endpoint with the S3 key.

    Your teammate calls this after the presigned URL upload completes.
    """
    result = process_contract(
        source=body.s3_key,
        from_s3=True,
        bucket=body.bucket,
        contract_id=body.contract_id,
    )

    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result.get("error"))

    # Add risk score to result
    if result.get("clauses"):
        result["risk_score"] = calculate_score(result["clauses"])

    return result


@router.post("/query")
def what_if_query(body: QueryRequest):
    """
    Answer a natural language question about contracts.
    e.g. "What contracts are renewing next quarter?"

    Your teammate calls this from the what-if query bar on the dashboard.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not body.contracts_data:
        raise HTTPException(status_code=400, detail="No contract data provided")

    answer = answer_query(
        question=body.question,
        contracts_data=body.contracts_data,
    )

    return {"question": body.question, "answer": answer}


@router.post("/compare")
def compare(body: CompareRequest):
    """
    Compare two or more contracts side by side.
    Returns both a deterministic field diff AND an LLM-generated summary.

    Your teammate calls this from the comparison view on the dashboard.
    """
    if len(body.contracts) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 contracts are required for comparison",
        )

    # Deterministic field-by-field diff (fast, no API call)
    field_diff = diff_compare(body.contracts)

    # LLM-generated qualitative summary (slower, uses API)
    clauses_list = [c.get("clauses", {}) for c in body.contracts]
    llm_summary = llm_compare(clauses_list)

    return {
        "field_diff": field_diff,
        "llm_summary": llm_summary,
    }


@router.post("/score")
def score_contract(clauses: dict):
    """
    Score a single contract's extracted clauses.
    Returns numeric score, grade, and risk flags.
    Useful if you want to re-score without re-processing the PDF.
    """
    if not clauses:
        raise HTTPException(status_code=400, detail="Clauses cannot be empty")

    return calculate_score(clauses)


@router.get("/health")
def health():
    """Quick health check for your teammate to ping."""
    return {"status": "ok"}
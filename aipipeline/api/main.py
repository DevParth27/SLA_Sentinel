"""
api/main.py

WHAT IT DOES (2-3 lines):
Starts the FastAPI server and wires up all routes. This is what your teammate's
Next.js backend calls via HTTP. One file to start the entire AI pipeline as a
running web service. Run with: uvicorn api.main:app --reload --port 8000
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import router

app = FastAPI(
    title="AI Contract Pipeline",
    description="Extracts clauses, scores risks, and compares contracts from PDFs",
    version="1.0.0",
)

# ── CORS — allow your Next.js frontend to call this API ──────────────────────
# In production replace * with your actual Vercel domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def health_check():
    """Simple health check so your teammate can confirm the API is running."""
    return {"status": "ok", "message": "AI pipeline is running"}


# ── Run directly for local dev ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
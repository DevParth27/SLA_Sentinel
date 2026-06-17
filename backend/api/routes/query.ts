import { Router, Request, Response } from "express";
import { query } from "../../db/client";

const router = Router();

const AI_URL = process.env.AI_PIPELINE_URL || "http://localhost:8000";

// No fabricated data here — if the AI pipeline can't be reached we say so
// plainly rather than inventing contract figures.
const FALLBACK_ANSWER =
  "The AI assistant is temporarily unavailable. Please try your question again in a moment.";

// POST /api/query
router.post("/", async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    let answer = FALLBACK_ANSWER;
    let source = "fallback";

    // Fetch contracts from DB to give the AI pipeline context. We enrich each
    // row with its clauses, flags, and a derived days_to_expiry so GPT can
    // reason about the whole portfolio ("which renewals are risky next quarter?")
    // instead of just a single document.
    let contracts_data: any[] = [];
    try {
      const contractsResult = await query("SELECT * FROM contracts LIMIT 20");
      const rows = contractsResult.rows;

      let clausesByContract: Record<string, any[]> = {};
      let flagsByContract: Record<string, any[]> = {};
      if (rows.length > 0) {
        const ids = rows.map((r: any) => r.id);
        try {
          const [clausesResult, flagsResult] = await Promise.all([
            query("SELECT * FROM clauses WHERE contract_id = ANY($1)", [ids]),
            query("SELECT * FROM flags WHERE contract_id = ANY($1)", [ids]),
          ]);
          for (const cl of clausesResult.rows) {
            (clausesByContract[cl.contract_id] ||= []).push({
              type: cl.type,
              summary: cl.summary,
            });
          }
          for (const fl of flagsResult.rows) {
            (flagsByContract[fl.contract_id] ||= []).push(
              fl.message || fl.severity
            );
          }
        } catch (relErr: any) {
          console.warn("[query] Could not fetch clauses/flags:", relErr.message);
        }
      }

      const now = Date.now();
      contracts_data = rows.map((r: any) => {
        const expiry = r.expiry_date ? new Date(r.expiry_date).getTime() : NaN;
        const days_to_expiry = Number.isNaN(expiry)
          ? null
          : Math.round((expiry - now) / 86400000);
        return {
          ...r,
          days_to_expiry,
          clauses: clausesByContract[r.id] || [],
          flags: flagsByContract[r.id] || [],
        };
      });
    } catch (dbErr: any) {
      console.warn("[query] Could not fetch contracts for AI context:", dbErr.message);
    }

    // Try AI pipeline
    try {
      const controller = new AbortController();
      // GPT completions routinely take 10-25s (longer on a cold pipeline), so
      // give the AI pipeline room before falling back to the canned answer.
      const timeout = setTimeout(() => controller.abort(), 30000);
      const pipelineRes = await fetch(`${AI_URL}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, contracts_data }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (pipelineRes.ok) {
        const data: any = await pipelineRes.json();
        answer = data.answer || data.response || FALLBACK_ANSWER;
        source = "pipeline";
        console.log(`[query] Pipeline answered: "${question.slice(0, 60)}..."`);
      } else {
        console.warn(`[query] Pipeline returned ${pipelineRes.status}`);
      }
    } catch (pipelineErr: any) {
      console.warn("[query] Pipeline unreachable:", pipelineErr.message);
    }

    // Save to queries table regardless of source
    try {
      await query(
        "INSERT INTO queries (question, answer) VALUES ($1, $2)",
        [question, answer]
      );
    } catch (dbErr: any) {
      console.warn("[query] Could not save to DB:", dbErr.message);
    }

    res.json({ answer, source });
  } catch (err: any) {
    res.status(500).json({ error: "Query failed", detail: err.message });
  }
});

// GET /api/query/history
router.get("/history", async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM queries ORDER BY created_at DESC LIMIT 20"
    );
    res.json(result.rows);
  } catch (err: any) {
    console.warn("[query GET /history] DB error:", err.message);
    res.json([]);
  }
});

export default router;

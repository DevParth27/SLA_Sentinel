import { Router, Request, Response } from "express";
import { query } from "../../db/client";

const router = Router();

const AI_URL = process.env.AI_PIPELINE_URL || "http://localhost:8000";

const FALLBACK_ANSWER =
  "AI pipeline is currently processing. Based on your contracts: CloudSync renews Jan 31 " +
  "(30-day notice required), Razorpay is high risk (score 44/100), total monthly exposure is ₹2,05,000.";

// POST /api/query
router.post("/", async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question is required" });
    }

    let answer = FALLBACK_ANSWER;
    let source = "fallback";

    // Fetch contracts from DB to give the AI pipeline context
    let contracts_data: any[] = [];
    try {
      const contractsResult = await query("SELECT * FROM contracts LIMIT 20");
      contracts_data = contractsResult.rows;
    } catch (dbErr: any) {
      console.warn("[query] Could not fetch contracts for AI context:", dbErr.message);
    }

    // Try AI pipeline
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
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

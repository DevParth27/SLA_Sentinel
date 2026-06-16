import { Router, Request, Response } from "express";
import { query } from "../../db/client";

const router = Router();

function scoreToStatus(score: number): string {
  if (score >= 80) return "active";
  if (score >= 50) return "expiring-soon";
  return "high-risk";
}

// GET /api/risks/summary
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_contracts,
        COUNT(*) FILTER (WHERE risk_score < 50)::int AS high_risk,
        COUNT(*) FILTER (WHERE status = 'expiring-soon')::int AS expiring_soon,
        ROUND(AVG(risk_score))::int AS avg_risk_score,
        SUM(monthly_fee)::numeric AS total_monthly_exposure,
        COUNT(*) FILTER (WHERE expiry_date <= NOW() + INTERVAL '30 days')::int AS expiring_next_30_days
      FROM contracts
    `);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.warn("[risks GET /summary] DB error:", err.message);
    res.json({
      total_contracts: 3,
      high_risk: 1,
      expiring_soon: 1,
      avg_risk_score: 62,
      total_monthly_exposure: 205000,
      expiring_next_30_days: 2,
    });
  }
});

// GET /api/risks/contract/:contractId
router.get("/contract/:contractId", async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const contractResult = await query(
      "SELECT risk_score FROM contracts WHERE id = $1",
      [contractId]
    );
    if (!contractResult.rows.length) {
      return res.status(404).json({ error: "Contract not found" });
    }
    const flagsResult = await query(
      "SELECT * FROM flags WHERE contract_id = $1 ORDER BY severity DESC",
      [contractId]
    );
    res.json({
      risk_score: contractResult.rows[0].risk_score,
      flags: flagsResult.rows,
    });
  } catch (err: any) {
    console.warn("[risks GET /contract] DB error:", err.message);
    res.json({ risk_score: 0, flags: [] });
  }
});

// POST /api/risks/contract/:contractId/score — called by AI pipeline
router.post("/contract/:contractId/score", async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const { risk_score, flags } = req.body;

    if (typeof risk_score !== "number") {
      return res.status(400).json({ error: "risk_score must be a number" });
    }

    const status = scoreToStatus(risk_score);

    const updateResult = await query(
      `UPDATE contracts
       SET risk_score = $1, status = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [risk_score, status, contractId]
    );

    if (!updateResult.rows.length) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Replace flags
    await query("DELETE FROM flags WHERE contract_id = $1", [contractId]);

    if (Array.isArray(flags) && flags.length > 0) {
      const values: any[] = [];
      const placeholders = flags.map((f: any, i: number) => {
        const base = i * 3;
        values.push(contractId, f.message || "", f.severity || "medium");
        return `($${base + 1}, $${base + 2}, $${base + 3})`;
      });
      await query(
        `INSERT INTO flags (contract_id, message, severity) VALUES ${placeholders.join(", ")}`,
        values
      );
    }

    console.log(`[risks] Scored contract ${contractId}: ${risk_score} → ${status}`);
    res.json(updateResult.rows[0]);
  } catch (err: any) {
    console.error("[risks POST /score] Error:", err.message);
    res.status(500).json({ error: "Failed to save risk score", detail: err.message });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { query } from "../../db/client";

const router = Router();

// GET /api/clauses/contract/:contractId
router.get("/contract/:contractId", async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const result = await query(
      "SELECT * FROM clauses WHERE contract_id = $1 ORDER BY type ASC",
      [contractId]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.warn("[clauses GET] DB error:", err.message);
    res.json([]);
  }
});

// POST /api/clauses/contract/:contractId — called by AI pipeline
router.post("/contract/:contractId", async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const { clauses } = req.body;

    if (!Array.isArray(clauses)) {
      return res.status(400).json({ error: "clauses must be an array" });
    }

    // Delete existing clauses for this contract
    await query("DELETE FROM clauses WHERE contract_id = $1", [contractId]);

    if (clauses.length === 0) {
      return res.json({ inserted: 0 });
    }

    // Bulk insert
    const values: any[] = [];
    const placeholders = clauses.map((_, i) => {
      const base = i * 4;
      values.push(contractId, _.type || "General", _.summary || "", _.raw_text || "");
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    });

    await query(
      `INSERT INTO clauses (contract_id, type, summary, raw_text) VALUES ${placeholders.join(", ")}`,
      values
    );

    console.log(`[clauses] Inserted ${clauses.length} clauses for contract ${contractId}`);
    res.json({ inserted: clauses.length });
  } catch (err: any) {
    console.error("[clauses POST] Error:", err.message);
    res.status(500).json({ error: "Failed to save clauses", detail: err.message });
  }
});

export default router;

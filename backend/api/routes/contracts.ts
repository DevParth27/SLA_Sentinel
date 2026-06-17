import { Router, Request, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { query } from "../../db/client";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET = process.env.S3_BUCKET_NAME || "sla-sentinel-contracts";
const AI_URL = process.env.AI_PIPELINE_URL || "http://localhost:8000";

// Keep async work alive after the response is sent. On Vercel, a serverless
// function is frozen once it responds, so background promises would be killed;
// waitUntil() extends the function's lifetime until the work settles (bounded
// by maxDuration in vercel.json). On a normal long-lived server there is no
// Vercel context — the catch path runs the promise to completion as usual.
function runInBackground(work: Promise<unknown>): void {
  work.catch((e: any) => console.warn("[bg] task failed:", e?.message));
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { waitUntil } = require("@vercel/functions");
    waitUntil(work);
  } catch {
    /* not on Vercel — the persistent server will finish the work */
  }
}

// Fallback seed data if DB is down
const SEED_CONTRACTS = [
  {
    id: "seed-1",
    name: "CloudSync SaaS Agreement",
    vendor: "CloudSync Technologies Pvt. Ltd.",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effective_date: "2024-02-01",
    expiry_date: "2025-01-31",
    auto_renewal: true,
    renewal_notice_days: 30,
    monthly_fee: 120000,
    currency: "INR",
    risk_score: 62,
    status: "expiring-soon",
    original_filename: "CloudSync_SaaS_Agreement.pdf",
    flag_count: 2,
  },
  {
    id: "seed-2",
    name: "AWS Enterprise Support Agreement",
    vendor: "Amazon Web Services India",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effective_date: "2023-06-01",
    expiry_date: "2025-06-01",
    auto_renewal: false,
    renewal_notice_days: 0,
    monthly_fee: 85000,
    currency: "INR",
    risk_score: 81,
    status: "active",
    original_filename: "AWS_Enterprise_Support.pdf",
    flag_count: 0,
  },
  {
    id: "seed-3",
    name: "Razorpay Payment Gateway MSA",
    vendor: "Razorpay Software Pvt. Ltd.",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effective_date: "2024-01-01",
    expiry_date: "2024-12-31",
    auto_renewal: true,
    renewal_notice_days: 15,
    monthly_fee: 0,
    currency: "INR",
    risk_score: 44,
    status: "high-risk",
    original_filename: "Razorpay_MSA.pdf",
    flag_count: 3,
  },
];

// GET /api/contracts
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(f.id)::int AS flag_count
      FROM contracts c
      LEFT JOIN flags f ON f.contract_id = c.id
      GROUP BY c.id
      ORDER BY c.expiry_date ASC
    `);
    res.json(result.rows);
  } catch (err: any) {
    console.warn("[contracts GET /] DB error, returning seed data:", err.message);
    res.json(SEED_CONTRACTS);
  }
});

// GET /api/contracts/presigned/:key
router.get("/presigned/:key(*)", async (req: Request, res: Response) => {
  try {
    const key = String(req.params.key);
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate presigned URL", detail: err.message });
  }
});

// GET /api/contracts/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contractResult = await query("SELECT * FROM contracts WHERE id = $1", [id]);
    if (!contractResult.rows.length) {
      return res.status(404).json({ error: "Contract not found" });
    }
    const clausesResult = await query(
      "SELECT * FROM clauses WHERE contract_id = $1 ORDER BY type ASC",
      [id]
    );
    const flagsResult = await query(
      "SELECT * FROM flags WHERE contract_id = $1 ORDER BY severity DESC",
      [id]
    );
    res.json({
      ...contractResult.rows[0],
      clauses: clausesResult.rows,
      flags: flagsResult.rows,
    });
  } catch (err: any) {
    console.warn("[contracts GET /:id] DB error:", err.message);
    const seed = SEED_CONTRACTS.find((c) => c.id === req.params.id);
    if (seed) return res.json({ ...seed, clauses: [], flags: [] });
    res.status(404).json({ error: "Contract not found" });
  }
});

// Runs the AI pipeline for an uploaded contract and persists clauses + risk
// score/flags to the DB. Designed to be fired in the background after the
// upload response is sent (see runInBackground).
async function processContract(contractId: string, s3Key: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const pipelineRes = await fetch(`${AI_URL}/api/process/s3`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ s3_key: s3Key, bucket: BUCKET, contract_id: contractId }),
      signal: controller.signal,
    });

    if (!pipelineRes.ok) {
      console.warn(`[AI] Pipeline returned ${pipelineRes.status} for contract ${contractId}`);
      return;
    }

    const aiData: any = await pipelineRes.json();
    console.log(`[AI] Pipeline finished contract ${contractId}: status=${aiData.status}`);
    if (aiData.status !== "success") return;

    // Save extracted clauses — flatten the clause dict into rows
    if (aiData.clauses && typeof aiData.clauses === "object") {
      const clauseRows = Object.entries(aiData.clauses).map(([type, value]) => ({
        type,
        summary: typeof value === "object" ? JSON.stringify(value) : String(value ?? ""),
        raw_text: "",
      }));
      if (clauseRows.length > 0) {
        const vals: any[] = [];
        const placeholders = clauseRows.map((c, i) => {
          const b = i * 4;
          vals.push(contractId, c.type, c.summary, c.raw_text);
          return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
        });
        await query(
          `INSERT INTO clauses (contract_id, type, summary, raw_text) VALUES ${placeholders.join(", ")}`,
          vals
        );
        console.log(`[DB] Saved ${clauseRows.length} clauses for contract ${contractId}`);
      }
    }

    // Save risk score and flags — map AI field names to DB schema
    if (aiData.risk_score) {
      const score: number = aiData.risk_score.score ?? 0;
      const rawFlags: any[] = aiData.risk_score.flags ?? [];
      const status = score >= 80 ? "active" : score >= 50 ? "expiring-soon" : "high-risk";

      await query(
        `UPDATE contracts SET risk_score = $1, status = $2, updated_at = NOW() WHERE id = $3`,
        [score, status, contractId]
      );

      if (rawFlags.length > 0) {
        const vals: any[] = [];
        const placeholders = rawFlags.map((f: any, i: number) => {
          const b = i * 3;
          // AI pipeline uses "description"; DB schema uses "message"
          vals.push(contractId, f.description || f.message || "", (f.severity || "medium").toLowerCase());
          return `($${b + 1}, $${b + 2}, $${b + 3})`;
        });
        await query(
          `INSERT INTO flags (contract_id, message, severity) VALUES ${placeholders.join(", ")}`,
          vals
        );
      }
      console.log(`[DB] Saved risk score ${score} and ${rawFlags.length} flags for contract ${contractId}`);
    }
  } catch (bgErr: any) {
    console.warn("[AI] Background processing failed:", bgErr.message);
  } finally {
    clearTimeout(timeout);
  }
}

// POST /api/contracts/upload-url
// Issues a presigned PUT URL so the browser uploads the PDF straight to S3.
// This is the preferred path — the file never passes through the serverless
// function, so it is not subject to the platform request-body size limit.
router.post("/upload-url", async (req: Request, res: Response) => {
  try {
    const { filename } = req.body || {};
    if (!filename || typeof filename !== "string" || !filename.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "A .pdf filename is required" });
    }
    const safeName = filename.replace(/[^\w.\-]+/g, "_");
    const s3Key = `contracts/${Date.now()}-${safeName}`;
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: "application/pdf",
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ uploadUrl, s3Key });
  } catch (err: any) {
    res.status(500).json({ error: "Could not create upload URL", detail: err.message });
  }
});

// POST /api/contracts/register
// Called after the browser has PUT the file to S3 via the presigned URL.
// Creates the contract row and kicks off AI processing in the background.
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { s3Key, filename } = req.body || {};
    if (!s3Key || typeof s3Key !== "string") {
      return res.status(400).json({ error: "s3Key is required" });
    }
    const contractName = String(filename || s3Key).replace(/\.pdf$/i, "");

    let contractId: string;
    try {
      const insertResult = await query(
        `INSERT INTO contracts (name, s3_key, original_filename, status)
         VALUES ($1, $2, $3, 'processing') RETURNING id`,
        [contractName, s3Key, filename || null]
      );
      contractId = insertResult.rows[0].id;
      console.log(`[DB] Contract inserted: ${contractId}`);
    } catch (dbErr: any) {
      console.warn("[DB] Insert failed:", dbErr.message);
      contractId = `temp-${Date.now()}`;
    }

    res.status(201).json({
      contract_id: contractId,
      s3_key: s3Key,
      status: "processing",
      message: "Contract uploaded. AI analysis in progress.",
    });

    runInBackground(processContract(contractId, s3Key));
  } catch (err: any) {
    res.status(500).json({ error: "Register failed", detail: err.message });
  }
});

// POST /api/contracts/upload
// Legacy multipart upload — the file passes through the function and is subject
// to the platform request-body size limit (~4.5 MB on Vercel). Kept for
// compatibility; browsers should prefer the presigned flow above.
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are accepted" });
    }

    const s3Key = `contracts/${Date.now()}-${req.file.originalname}`;
    const contractName = req.file.originalname.replace(/\.pdf$/i, "");

    // Upload to S3
    let s3Success = false;
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          Body: req.file.buffer,
          ContentType: "application/pdf",
        })
      );
      s3Success = true;
      console.log(`[S3] Uploaded: ${s3Key}`);
    } catch (s3Err: any) {
      console.warn("[S3] Upload failed, continuing:", s3Err.message);
    }

    // Insert contract record
    let contractId: string;
    try {
      const insertResult = await query(
        `INSERT INTO contracts (name, s3_key, original_filename, status)
         VALUES ($1, $2, $3, 'processing') RETURNING id`,
        [contractName, s3Success ? s3Key : null, req.file.originalname]
      );
      contractId = insertResult.rows[0].id;
      console.log(`[DB] Contract inserted: ${contractId}`);
    } catch (dbErr: any) {
      console.warn("[DB] Insert failed:", dbErr.message);
      contractId = `temp-${Date.now()}`;
    }

    // Respond immediately — AI processing runs in background
    res.status(201).json({
      contract_id: contractId,
      s3_key: s3Key,
      status: "processing",
      message: "Contract uploaded. AI analysis in progress.",
    });

    if (s3Success) runInBackground(processContract(contractId, s3Key));
  } catch (err: any) {
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

// DELETE /api/contracts/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM contracts WHERE id = $1", [id]);
    console.log(`[DB] Contract deleted: ${id}`);
    res.json({ message: "deleted" });
  } catch (err: any) {
    console.error("[contracts DELETE] Error:", err.message);
    res.status(500).json({ error: "Delete failed", detail: err.message });
  }
});

export default router;

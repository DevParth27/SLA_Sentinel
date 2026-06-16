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

// POST /api/contracts/upload
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

    // Notify AI pipeline (non-blocking)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(`${AI_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3_key: s3Key, contract_id: contractId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      console.log(`[AI] Pipeline notified for contract ${contractId}`);
    } catch (pipelineErr: any) {
      console.warn("[AI] Pipeline unreachable:", pipelineErr.message);
    }

    res.status(201).json({
      contract_id: contractId,
      s3_key: s3Key,
      status: "processing",
      message: "Contract uploaded. AI analysis in progress.",
    });
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

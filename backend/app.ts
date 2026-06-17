import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import contractsRouter from "./api/routes/contracts";
import clausesRouter from "./api/routes/clauses";
import risksRouter from "./api/routes/risks";
import queryRouter from "./api/routes/query";
import { errorHandler } from "./middleware/errorHandler";

// Configured Express app, with no app.listen() — so it can run both as a
// long-lived server (local dev, see index.ts) and as a Vercel serverless
// function handler (see server.ts).
const app = express();

// Allow the origins listed in ALLOWED_ORIGINS (comma-separated). If the var is
// unset, fall back to `true`, which reflects whatever Origin the request sends
// (i.e. allow all) — note this must NOT be ["*"], because cors treats an array
// as an exact-match allowlist and the literal "*" would match no real origin.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for judges
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SLA Sentinel Backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

app.use("/api/contracts", contractsRouter);
app.use("/api/clauses", clausesRouter);
app.use("/api/risks", risksRouter);
app.use("/api/query", queryRouter);
app.use(errorHandler);

export default app;

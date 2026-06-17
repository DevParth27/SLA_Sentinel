// ── Live data layer ──────────────────────────────────────────────────────────
// Talks to the Express backend (see /backend/api/routes). The backend returns
// snake_case rows from Postgres; we map them to camelCase for the UI here.
// Override the base URL with NEXT_PUBLIC_API_URL at build/deploy time.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Clause {
  type: string;
  summary: string;
}

export type ContractStatus = "active" | "expiring-soon" | "high-risk" | "expired";

export interface Contract {
  id: string;
  name: string;
  vendor: string;
  client: string;
  effectiveDate: string;
  expiryDate: string;
  autoRenewal: boolean;
  renewalNoticeDays: number;
  monthlyFee: number;
  currency: string;
  riskScore: number;
  status: ContractStatus;
  flagCount: number;
  flags: string[];
  clauses: Clause[];
}

export interface RiskSummary {
  totalContracts: number;
  highRisk: number;
  expiringSoon: number;
  avgRiskScore: number;
  totalMonthlyExposure: number;
  expiringNext30Days: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const KNOWN_STATUSES: ContractStatus[] = [
  "active",
  "expiring-soon",
  "high-risk",
  "expired",
];

function normalizeStatus(
  raw: unknown,
  riskScore: number,
  expiryDate: string
): ContractStatus {
  if (typeof raw === "string" && KNOWN_STATUSES.includes(raw as ContractStatus)) {
    return raw as ContractStatus;
  }
  // Backend may emit 'pending'/'processing' before the AI pipeline finishes —
  // derive a sensible UI status from the data we do have.
  if (expiryDate) {
    const days = (new Date(expiryDate).getTime() - Date.now()) / 86400000;
    if (!Number.isNaN(days)) {
      if (days < 0) return "expired";
      if (days <= 60) return "expiring-soon";
    }
  }
  if (riskScore > 0 && riskScore < 50) return "high-risk";
  return "active";
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function mapClause(c: any): Clause {
  return { type: toStr(c?.type) || "General", summary: toStr(c?.summary) };
}

function mapFlag(f: any): string {
  if (typeof f === "string") return f;
  return toStr(f?.message ?? f?.description);
}

function mapContract(r: any): Contract {
  const riskScore = Number(r?.risk_score ?? 0) || 0;
  const expiryDate = toStr(r?.expiry_date);
  return {
    id: toStr(r?.id),
    name: toStr(r?.name) || "Untitled contract",
    vendor: toStr(r?.vendor),
    client: toStr(r?.client),
    effectiveDate: toStr(r?.effective_date),
    expiryDate,
    autoRenewal: Boolean(r?.auto_renewal),
    renewalNoticeDays: Number(r?.renewal_notice_days ?? 0) || 0,
    monthlyFee: Number(r?.monthly_fee ?? 0) || 0,
    currency: toStr(r?.currency) || "INR",
    riskScore,
    status: normalizeStatus(r?.status, riskScore, expiryDate),
    flagCount: Number(r?.flag_count ?? (Array.isArray(r?.flags) ? r.flags.length : 0)) || 0,
    flags: Array.isArray(r?.flags) ? r.flags.map(mapFlag).filter(Boolean) : [],
    clauses: Array.isArray(r?.clauses) ? r.clauses.map(mapClause) : [],
  };
}

async function getJSON(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function fetchContracts(): Promise<Contract[]> {
  const data = await getJSON("/api/contracts");
  return Array.isArray(data) ? data.map(mapContract) : [];
}

export async function fetchContractById(id: string): Promise<Contract | null> {
  const res = await fetch(`${API_BASE}/api/contracts/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return mapContract(await res.json());
}

export async function fetchRiskSummary(): Promise<RiskSummary> {
  const d = await getJSON("/api/risks/summary");
  return {
    totalContracts: Number(d?.total_contracts ?? 0) || 0,
    highRisk: Number(d?.high_risk ?? 0) || 0,
    expiringSoon: Number(d?.expiring_soon ?? 0) || 0,
    avgRiskScore: Number(d?.avg_risk_score ?? 0) || 0,
    totalMonthlyExposure: Number(d?.total_monthly_exposure ?? 0) || 0,
    expiringNext30Days: Number(d?.expiring_next_30_days ?? 0) || 0,
  };
}

export async function askQuery(question: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Query failed (${res.status})`);
  const data = await res.json();
  return toStr(data?.answer ?? data?.response);
}

async function postJSON(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const e = await res.json();
      detail = e?.error || e?.detail || detail;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(detail);
  }
  return res.json();
}

// Direct-to-S3 upload: the file is PUT straight to S3 via a presigned URL, so
// it never passes through the serverless function (no request-body size cap).
// 1) ask the backend for a presigned PUT URL, 2) upload the file to S3,
// 3) register the contract so the backend can run the AI pipeline.
export async function uploadContract(
  file: File
): Promise<{ contractId: string; status: string }> {
  const { uploadUrl, s3Key } = await postJSON("/api/contracts/upload-url", {
    filename: file.name,
  });

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Could not upload file to storage (${putRes.status})`);
  }

  const data = await postJSON("/api/contracts/register", {
    s3Key,
    filename: file.name,
  });
  return { contractId: toStr(data?.contract_id), status: toStr(data?.status) };
}

export function isHighRisk(c: Contract): boolean {
  return c.riskScore > 0 && c.riskScore < 50;
}

export interface Clause {
  type: string;
  summary: string;
}

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
  uptime: string;
  liabilityCap: string;
  latePenalty: string;
  status: "active" | "expiring-soon" | "high-risk" | "expired";
  flags: string[];
  clauses: Clause[];
}

export const CONTRACTS: Contract[] = [
  {
    id: "1",
    name: "CloudSync SaaS Agreement",
    vendor: "CloudSync Technologies Pvt. Ltd.",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effectiveDate: "2024-02-01",
    expiryDate: "2025-01-31",
    autoRenewal: true,
    renewalNoticeDays: 30,
    monthlyFee: 120000,
    currency: "INR",
    riskScore: 62,
    uptime: "99.5%",
    liabilityCap: "3 months fees",
    latePenalty: "2% per month",
    status: "expiring-soon",
    flags: [
      "Auto-renewal deadline in 18 days",
      "Liability cap very low (₹3,60,000)",
      "SLA credits capped at 30% max",
    ],
    clauses: [
      { type: "Payment", summary: "₹1,20,000/month, 15-day grace period" },
      { type: "SLA", summary: "99.5% uptime, P1 response in 30 mins" },
      { type: "Auto-renewal", summary: "Renews Jan 31 2025, 30-day notice" },
      { type: "Liability", summary: "Capped at 3 months of fees" },
      { type: "Termination", summary: "60 days notice, no refund" },
      { type: "Confidentiality", summary: "3 years post-termination" },
    ],
  },
  {
    id: "2",
    name: "AWS Enterprise Support Agreement",
    vendor: "Amazon Web Services India",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effectiveDate: "2023-06-01",
    expiryDate: "2025-06-01",
    autoRenewal: false,
    renewalNoticeDays: 0,
    monthlyFee: 85000,
    currency: "INR",
    riskScore: 81,
    uptime: "99.99%",
    liabilityCap: "12 months fees",
    latePenalty: "1.5% per month",
    status: "active",
    flags: ["No auto-renewal — manual renewal required"],
    clauses: [
      { type: "Payment", summary: "₹85,000/month, net 30" },
      { type: "SLA", summary: "99.99% uptime guaranteed" },
      { type: "Auto-renewal", summary: "No auto-renewal clause" },
      { type: "Liability", summary: "Capped at 12 months of fees" },
      { type: "Termination", summary: "30 days notice" },
      { type: "Confidentiality", summary: "5 years post-termination" },
    ],
  },
  {
    id: "3",
    name: "Razorpay Payment Gateway MSA",
    vendor: "Razorpay Software Pvt. Ltd.",
    client: "Meridian Retail Solutions Pvt. Ltd.",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    autoRenewal: true,
    renewalNoticeDays: 15,
    monthlyFee: 0,
    currency: "INR",
    riskScore: 44,
    uptime: "99.9%",
    liabilityCap: "1 month fees",
    latePenalty: "3% per month",
    status: "high-risk",
    flags: [
      "Expires Dec 31 — only 16 days left",
      "Auto-renewal notice only 15 days",
      "Liability cap extremely low",
      "High late penalty at 3%/month",
    ],
    clauses: [
      { type: "Payment", summary: "Transaction fee based, no fixed monthly" },
      { type: "SLA", summary: "99.9% uptime, 2hr P1 response" },
      { type: "Auto-renewal", summary: "Renews Dec 31, only 15-day notice" },
      { type: "Liability", summary: "Capped at 1 month equivalent" },
      { type: "Termination", summary: "30 days notice" },
      { type: "Confidentiality", summary: "2 years post-termination" },
    ],
  },
];

export const QUERY_ANSWERS: Record<string, string> = {
  "What renews next quarter?":
    "2 contracts renew next quarter. CloudSync SaaS Agreement renews Jan 31 2025 — action required by Jan 1 (30-day notice). Razorpay MSA expired Dec 31 2024 and is now overdue for renewal.",
  "Which contracts have low liability caps?":
    "Razorpay MSA has the lowest cap at 1 month equivalent. CloudSync is capped at ₹3,60,000 (3 months). AWS Enterprise is safest at 12 months of fees.",
  "Show high risk contracts":
    "1 high-risk contract: Razorpay Payment Gateway MSA — risk score 44/100. Issues: expired, 15-day auto-renewal notice, extremely low liability cap, 3% late penalty.",
  "What are my payment obligations this month?":
    "Total monthly obligations: ₹2,05,000. CloudSync: ₹1,20,000 due Feb 1. AWS Enterprise: ₹85,000 due monthly. Razorpay: transaction-based, no fixed fee.",
};

export function getContractById(id: string): Contract | undefined {
  return CONTRACTS.find((c) => c.id === id);
}

export function getHighRiskContracts(): Contract[] {
  return CONTRACTS.filter((c) => c.riskScore < 50);
}

export function getExpiringSoon(): Contract[] {
  const now = new Date();
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  return CONTRACTS.filter((c) => {
    const expiry = new Date(c.expiryDate);
    return expiry <= in60Days && expiry >= now;
  });
}

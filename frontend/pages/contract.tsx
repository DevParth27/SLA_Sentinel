import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import { fetchContractById, Contract } from "../lib/api";
import RiskBadge from "../components/RiskBadge";
import ClauseTable from "../components/ClauseTable";

function RiskGauge({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const gap = circ - dash;
  const color = score >= 80 ? "#3DDC97" : score >= 50 ? "#F5B544" : "#FF6B6B";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1C212A" strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${gap + circ * 0.25}` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-faint font-mono">/ 100</span>
      </div>
    </div>
  );
}

const METRIC_ICONS: Record<string, string> = {
  "Monthly Fee": "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "Renewal Notice": "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  "Effective Date": "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  "Auto-Renewal": "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99",
  "Expires": "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
};

function Nav({ onBack }: { onBack: () => void }) {
  return (
    <nav className="bg-base/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 bg-accent-grad rounded-md flex items-center justify-center shadow-glow-sm">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-display font-bold text-ink text-[14px] tracking-tight">ContractIQ</span>
      </div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-faint hover:text-ink transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </button>
    </nav>
  );
}

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const contractId = Array.isArray(id) ? id[0] : id;
    if (!contractId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchContractById(contractId)
      .then((c) => {
        if (!cancelled) setContract(c);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Failed to load contract");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <motion.span
            className="w-8 h-8 rounded-full border-[3px] border-line border-t-accent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-faint font-mono">Loading contract…</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    const notFound = !error;
    return (
      <div className="min-h-screen bg-base flex items-center justify-center font-sans">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${notFound ? "bg-raised" : "bg-bad/10"}`}>
            <svg className={`w-7 h-7 ${notFound ? "text-faint" : "text-bad"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={notFound ? "M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" : "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"} />
            </svg>
          </div>
          <p className="text-lg font-display font-bold text-ink mb-1.5">{notFound ? "Contract not found" : "Couldn’t load this contract"}</p>
          <p className="text-sm text-faint mb-6">{notFound ? "This contract may have been removed." : error}</p>
          <button onClick={() => router.push("/dashboard")} className="text-sm font-semibold text-accent hover:text-accent-bright transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const METRICS = [
    {
      label: "Monthly Fee",
      value: contract.monthlyFee > 0 ? `₹${contract.monthlyFee.toLocaleString("en-IN")}` : "Transaction-based",
    },
    {
      label: "Auto-Renewal",
      value: contract.autoRenewal ? `Yes · ${contract.renewalNoticeDays}-day notice` : "No",
    },
    {
      label: "Renewal Notice",
      value: contract.renewalNoticeDays > 0 ? `${contract.renewalNoticeDays} days` : "—",
    },
    { label: "Effective Date", value: fmtDate(contract.effectiveDate) },
    { label: "Expires", value: fmtDate(contract.expiryDate) },
  ];

  const statusColor = {
    active: "text-ok bg-ok/10 border border-ok/25",
    "expiring-soon": "text-warn bg-warn/10 border border-warn/25",
    "high-risk": "text-bad bg-bad/10 border border-bad/25",
    expired: "text-faint bg-white/5 border border-line",
  }[contract.status];

  const statusLabel = {
    active: "Active",
    "expiring-soon": "Expiring Soon",
    "high-risk": "High Risk",
    expired: "Expired",
  }[contract.status];

  return (
    <>
      <Head>
        <title>{contract.name} — ContractIQ</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans relative">
        <div className="fixed inset-0 pointer-events-none bg-grid opacity-40" />
        <div className="relative">
          <Nav onBack={() => router.push("/dashboard")} />

          <div className="max-w-6xl mx-auto px-6 py-10">
            {/* Header card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-surface rounded-2xl border border-line p-6 mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <RiskGauge score={contract.riskScore} />
                  <RiskBadge score={contract.riskScore} size="sm" />
                </div>

                <div className="flex-1 min-w-0 md:border-l md:border-line md:pl-6">
                  <div className="flex items-start gap-3 mb-3">
                    <h1 className="font-display text-xl md:text-2xl font-bold text-ink leading-tight flex-1">
                      {contract.name}
                    </h1>
                    <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-md flex-shrink-0 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
                    <span className="font-medium text-sub">{contract.vendor || "—"}</span>
                    <svg className="w-4 h-4 text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="font-medium text-sub">{contract.client || "—"}</span>
                  </div>

                  <p className="text-xs text-faint font-mono">
                    Effective {fmtDate(contract.effectiveDate)}
                    {" · "}
                    Expires {fmtDate(contract.expiryDate)}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Risk flags */}
            {contract.flags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-3 font-mono">
                  Risk Flags · {contract.flags.length}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contract.flags.map((flag, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 + 0.2 }}
                      className="flex items-start gap-2.5 bg-warn/8 border border-warn/20 rounded-xl px-4 py-3"
                    >
                      <svg className="w-3.5 h-3.5 text-warn flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      <p className="text-warn/90 text-[12.5px] leading-tight">{flag}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Two-column: Clauses + Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.38 }}
                className="lg:col-span-3 bg-surface rounded-2xl border border-line p-5"
              >
                <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-4 font-mono">
                  Extracted Clauses · {contract.clauses.length}
                </p>
                {contract.clauses.length > 0 ? (
                  <ClauseTable clauses={contract.clauses} />
                ) : (
                  <p className="text-[13px] text-faint py-6 text-center">No clauses extracted yet.</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.38 }}
                className="lg:col-span-2 flex flex-col gap-3"
              >
                <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] font-mono">
                  Key Terms
                </p>

                {METRICS.map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.3 }}
                    className="bg-surface rounded-xl border border-line px-4 py-3.5 flex items-center gap-3 hover:border-line/70 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center text-faint flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={METRIC_ICONS[m.label]} />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-faint uppercase tracking-[0.15em] font-mono">
                        {m.label}
                      </p>
                      <p className="text-[13px] font-semibold text-ink mt-0.5 truncate">
                        {m.value}
                      </p>
                    </div>
                  </motion.div>
                ))}

                <button
                  onClick={() => router.push(`/compare?a=${encodeURIComponent(contract.id)}`)}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright py-3 rounded-xl transition-colors mt-1 shadow-glow-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Compare Contracts
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

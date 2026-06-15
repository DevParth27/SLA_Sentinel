import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import { getContractById } from "../lib/api";
import RiskBadge from "../components/RiskBadge";
import ClauseTable from "../components/ClauseTable";

function RiskGauge({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  const gap = circ - dash;
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8"
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
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  "Monthly Fee": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "Uptime SLA": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  "Liability Cap": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  "Late Penalty": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  "Auto-Renewal": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  "Expires": (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
};

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const contract = id ? getContractById(id as string) : undefined;

  if (router.isReady && !contract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-900 mb-1.5">Contract not found</p>
          <p className="text-sm text-slate-400 mb-6">This contract may have been removed.</p>
          <button onClick={() => router.push("/dashboard")} className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const METRICS = [
    {
      label: "Monthly Fee",
      value: contract.monthlyFee > 0 ? `₹${contract.monthlyFee.toLocaleString("en-IN")}` : "Transaction-based",
    },
    { label: "Uptime SLA", value: contract.uptime },
    { label: "Liability Cap", value: contract.liabilityCap },
    { label: "Late Penalty", value: contract.latePenalty },
    {
      label: "Auto-Renewal",
      value: contract.autoRenewal ? `Yes · ${contract.renewalNoticeDays}-day notice` : "No",
    },
    {
      label: "Expires",
      value: new Date(contract.expiryDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      }),
    },
  ];

  const statusColor = {
    active: "text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200",
    "expiring-soon": "text-amber-600 bg-amber-50 ring-1 ring-amber-200",
    "high-risk": "text-red-600 bg-red-50 ring-1 ring-red-200",
    expired: "text-slate-500 bg-slate-50 ring-1 ring-slate-200",
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

      <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Nav */}
        <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#7C3AED] rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-[14px] tracking-tight">ContractIQ</span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Risk gauge */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <RiskGauge score={contract.riskScore} />
                <RiskBadge score={contract.riskScore} size="sm" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 md:border-l md:border-slate-100 md:pl-6">
                <div className="flex items-start gap-3 mb-3">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight flex-1">
                    {contract.name}
                  </h1>
                  <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Parties */}
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="font-medium text-slate-700">{contract.vendor}</span>
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-medium text-slate-700">{contract.client}</span>
                </div>

                <p className="text-xs text-slate-400">
                  Effective {new Date(contract.effectiveDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  {" · "}
                  Expires {new Date(contract.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
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
              <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Risk Flags · {contract.flags.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contract.flags.map((flag, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 + 0.2 }}
                    className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-amber-800 text-[12.5px] leading-tight">{flag}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Two-column: Clauses + Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Clause table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.38 }}
              className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Extracted Clauses · {contract.clauses.length}
              </p>
              <ClauseTable clauses={contract.clauses} />
            </motion.div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.38 }}
              className="lg:col-span-2 flex flex-col gap-3"
            >
              <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-widest">
                Key Terms
              </p>

              {METRICS.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                    {METRIC_ICONS[m.label]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      {m.label}
                    </p>
                    <p className="text-[13px] font-semibold text-slate-800 mt-0.5 truncate">
                      {m.value}
                    </p>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-white py-3 rounded-xl transition-colors mt-1"
                style={{ background: "linear-gradient(135deg, #0F172A, #1e293b)" }}
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
    </>
  );
}

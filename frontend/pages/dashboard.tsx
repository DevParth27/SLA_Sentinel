import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  fetchContracts,
  fetchRiskSummary,
  isHighRisk,
  Contract,
  RiskSummary,
} from "../lib/api";
import ContractCard from "../components/ContractCard";
import RiskBadge from "../components/RiskBadge";
import QueryBar from "../components/QueryBar";
import ThemeToggle from "../components/ThemeToggle";

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Upload",
    href: "/upload",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: "Compare",
    href: "/compare",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function daysFromNow(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// An actionable reminder: the date by which the team must decide. For
// auto-renewing contracts this is the notice deadline (expiry minus the notice
// period) — miss it and you're locked in another term. Otherwise it's expiry.
interface Reminder {
  id: string;
  name: string;
  vendor: string;
  actBy: number; // epoch ms
  daysLeft: number;
  isAutoRenewal: boolean;
  noticeDays: number;
}

function reminderFor(c: Contract): Reminder | null {
  const expiry = new Date(c.expiryDate).getTime();
  if (Number.isNaN(expiry)) return null;
  const isAutoRenewal = c.autoRenewal && c.renewalNoticeDays > 0;
  const actBy = isAutoRenewal ? expiry - c.renewalNoticeDays * 86400000 : expiry;
  return {
    id: c.id,
    name: c.name,
    vendor: c.vendor,
    actBy,
    daysLeft: Math.round((actBy - Date.now()) / 86400000),
    isAutoRenewal,
    noticeDays: c.renewalNoticeDays,
  };
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`rounded shimmer ${className}`} />;
}

function SkeletonStat() {
  return (
    <div className="bg-surface rounded-xl border border-line px-4 py-4 space-y-2">
      <SkeletonBlock className="h-7 w-7 rounded-lg" />
      <SkeletonBlock className="h-6 w-16" />
      <SkeletonBlock className="h-2.5 w-14" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-line p-5 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-1.5 flex-1">
          <SkeletonBlock className="h-3.5 w-3/5" />
          <SkeletonBlock className="h-3 w-2/5" />
        </div>
        <SkeletonBlock className="h-5 w-20 rounded-md ml-3" />
      </div>
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-line-soft">
        <SkeletonBlock className="h-9" />
        <SkeletonBlock className="h-9" />
      </div>
      <div className="flex justify-between">
        <SkeletonBlock className="h-5 w-24" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
    </div>
  );
}

function RenewalRow({ contract }: { contract: Contract }) {
  const days = daysFromNow(contract.expiryDate);
  const valid = !Number.isNaN(days);
  const isOverdue = valid && days < 0;
  const isUrgent = valid && days >= 0 && days <= 30;

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-raised transition-colors cursor-pointer group">
      <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${isOverdue ? "bg-bad" : isUrgent ? "bg-warn" : "bg-ok"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink truncate group-hover:text-accent-bright transition-colors">
          {contract.name}
        </p>
        <p className="text-[11px] text-faint truncate">{contract.vendor || "—"}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-[12px] font-bold tabular-nums font-mono ${isOverdue ? "text-bad" : isUrgent ? "text-warn" : "text-sub"}`}>
          {!valid ? "—" : isOverdue ? `${Math.abs(days)}d over` : `${days}d left`}
        </p>
        <p className="text-[10px] text-dim mt-0.5 font-mono">{formatDate(contract.expiryDate)}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contractList, riskSummary] = await Promise.all([
        fetchContracts(),
        fetchRiskSummary().catch(() => null),
      ]);
      setContracts(contractList);
      setSummary(riskSummary);
    } catch (err: any) {
      setError(err?.message || "Could not load contracts. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ready = !loading && !error;
  const isEmpty = ready && contracts.length === 0;

  const totalMonthly =
    summary?.totalMonthlyExposure ?? contracts.reduce((s, c) => s + c.monthlyFee, 0);
  const avgRisk =
    summary?.avgRiskScore ??
    (contracts.length
      ? Math.round(contracts.reduce((s, c) => s + c.riskScore, 0) / contracts.length)
      : 0);
  const highRiskList = contracts.filter(isHighRisk);
  const activeCount = contracts.filter((c) => c.status === "active").length;
  const expiring30 =
    summary?.expiringNext30Days ??
    contracts.filter((c) => {
      const d = daysFromNow(c.expiryDate);
      return !Number.isNaN(d) && d >= 0 && d <= 30;
    }).length;
  const totalContracts = summary?.totalContracts ?? contracts.length;
  const sortedByExpiry = [...contracts].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );
  const reminders = contracts
    .map(reminderFor)
    .filter((r): r is Reminder => r !== null && r.daysLeft <= 90)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const iconCls = "w-4 h-4";
  const STATS = [
    {
      label: "Total Contracts",
      display: String(totalContracts),
      sub: "under management",
      color: "text-ink",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    },
    {
      label: "Avg Risk Score",
      display: `${avgRisk}`,
      sub: avgRisk >= 70 ? "portfolio healthy" : avgRisk >= 50 ? "moderate exposure" : "needs attention",
      color: avgRisk >= 70 ? "text-ok" : avgRisk >= 50 ? "text-warn" : "text-bad",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    },
    {
      label: "Monthly Exposure",
      display: `₹${totalMonthly.toLocaleString("en-IN")}`,
      sub: "fixed obligations",
      color: "text-ink",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      label: "High Risk",
      display: String(summary?.highRisk ?? highRiskList.length),
      sub: "contracts flagged",
      color: (summary?.highRisk ?? highRiskList.length) > 0 ? "text-bad" : "text-faint",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
    },
    {
      label: "Active",
      display: String(activeCount),
      sub: "no immediate risk",
      color: "text-ok",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
    {
      label: "Expiring (30d)",
      display: String(expiring30),
      sub: "deadline near",
      color: expiring30 > 0 ? "text-warn" : "text-faint",
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard — ContractIQ</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans flex">
        {/* ── SIDEBAR ── */}
        <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-line fixed inset-y-0 left-0 z-20">
          <div className="px-5 py-[18px] border-b border-line flex items-center gap-2.5">
            <div className="w-6 h-6 bg-accent-grad rounded-md flex items-center justify-center shadow-glow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-display font-bold text-ink text-[14px] tracking-tight">ContractIQ</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map((item) => {
              const active = router.pathname === item.href;
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left transition-all duration-150 ${
                    active ? "bg-accent/12 text-accent-bright" : "text-sub hover:bg-raised hover:text-ink"
                  }`}
                >
                  <span className={active ? "text-accent" : "text-faint"}>{item.icon}</span>
                  {item.label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </nav>

          {highRiskList.length > 0 && (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-bad/8 border border-bad/20">
              <p className="text-[10.5px] font-semibold text-bad mb-1 font-mono uppercase tracking-wider">Portfolio Alert</p>
              <p className="text-[11px] text-bad/80 leading-relaxed">
                {highRiskList.length} high-risk contract{highRiskList.length !== 1 ? "s" : ""} need immediate review.
              </p>
              <button
                onClick={() => router.push(`/contract?id=${highRiskList[0]?.id}`)}
                className="text-[10.5px] font-semibold text-bad mt-1.5 hover:underline"
              >
                Review now →
              </button>
            </div>
          )}

          <div className="px-4 py-4 border-t border-line">
            <p className="text-[11px] text-dim font-mono">ContractIQ · v1.0</p>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
          {/* Critical alert banner */}
          {highRiskList.length > 0 && ready && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bad/15 border-b border-bad/30 px-6 py-2.5 flex items-center gap-3"
            >
              <motion.span
                className="w-2 h-2 rounded-full bg-bad flex-shrink-0"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-[12.5px] text-ink font-medium flex-1">
                <span className="font-bold text-bad">{highRiskList.length} contract{highRiskList.length !== 1 ? "s" : ""} at high risk</span>
                {" — "}
                {highRiskList.map((c) => c.name).join(", ")}.
                {" "}Immediate review recommended.
              </p>
              <button
                onClick={() => router.push(`/contract?id=${highRiskList[0]?.id}`)}
                className="flex-shrink-0 text-[11.5px] font-semibold text-bad bg-bad/15 hover:bg-bad/25 px-3 py-1.5 rounded-lg transition-colors"
              >
                Review →
              </button>
            </motion.div>
          )}

          {/* Topbar */}
          <header className="bg-base/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-[14px] font-display font-semibold text-ink">Contract Dashboard</h1>
              <p className="text-[11.5px] text-faint mt-0.5 font-mono">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[12px] text-sub bg-surface border border-line px-3 py-1.5 rounded-lg font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-bad" : "bg-ok"}`} />
                {error ? "Backend unreachable" : "All systems operational"}
              </div>
              <ThemeToggle />
              <button
                onClick={() => router.push("/upload")}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright px-4 py-2 rounded-lg transition-colors shadow-glow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload
              </button>
            </div>
          </header>

          <div className="flex-1 p-6 max-w-7xl w-full space-y-6">
            {/* ── ERROR STATE ── */}
            {error && (
              <div className="bg-surface rounded-2xl border border-bad/20 p-10 text-center">
                <div className="w-14 h-14 bg-bad/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-bad" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-[15px] font-display font-bold text-ink mb-1">Couldn’t load your contracts</p>
                <p className="text-[12.5px] text-faint mb-6">{error}</p>
                <button
                  onClick={load}
                  className="text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright px-5 py-2.5 rounded-lg transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* ── STATS ── */}
            {!error && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <AnimatePresence mode="wait">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <motion.div key={`sk-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                          <SkeletonStat />
                        </motion.div>
                      ))
                    : STATS.map((s, i) => (
                        <motion.div
                          key={s.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.35 }}
                          className="bg-surface rounded-xl border border-line hover:border-line/80 px-4 py-4 transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-raised flex items-center justify-center text-faint group-hover:text-accent transition-colors mb-3">
                            <svg className={iconCls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              {s.icon}
                            </svg>
                          </div>
                          <p className={`font-display text-[22px] font-bold tabular-nums leading-none mb-1 ${s.color}`}>
                            {s.display}
                          </p>
                          <p className="text-[10px] text-faint leading-tight">{s.sub}</p>
                        </motion.div>
                      ))}
                </AnimatePresence>
              </div>
            )}

            {/* ── EMPTY STATE ── */}
            {isEmpty && (
              <div className="bg-surface rounded-2xl border border-line p-12 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m1.06-4.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <p className="text-lg font-display font-bold text-ink mb-1.5">No contracts yet</p>
                <p className="text-sm text-faint mb-6">Upload your first contract to start tracking risk and renewals.</p>
                <button
                  onClick={() => router.push("/upload")}
                  className="text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright px-5 py-2.5 rounded-lg transition-colors"
                >
                  Upload a contract
                </button>
              </div>
            )}

            {/* ── REMINDERS ── */}
            {ready && reminders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-surface rounded-2xl border border-line p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-warn/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-warn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                    </span>
                    <p className="text-[11px] font-semibold text-sub uppercase tracking-[0.15em] font-mono">
                      Action Required
                    </p>
                  </div>
                  <span className="text-[11px] text-faint font-mono">
                    {reminders.length} deadline{reminders.length !== 1 ? "s" : ""} within 90 days
                  </span>
                </div>

                <div className="space-y-2">
                  {reminders.map((r) => {
                    const overdue = r.daysLeft < 0;
                    const urgent = r.daysLeft >= 0 && r.daysLeft <= 30;
                    const tone = overdue
                      ? { bar: "bg-bad", chip: "bg-bad/10 text-bad border-bad/25" }
                      : urgent
                      ? { bar: "bg-warn", chip: "bg-warn/10 text-warn border-warn/25" }
                      : { bar: "bg-faint", chip: "bg-white/5 text-sub border-line" };

                    const actByLabel = formatDate(new Date(r.actBy).toISOString());
                    let message: string;
                    if (r.isAutoRenewal) {
                      message = overdue
                        ? `Notice window passed — likely auto-renewed (${r.noticeDays}-day notice)`
                        : `Give notice by ${actByLabel} or it auto-renews (${r.noticeDays}-day notice)`;
                    } else {
                      message = overdue
                        ? `Expired ${actByLabel} — renew or archive`
                        : `Expires ${actByLabel} — decide on renewal`;
                    }

                    return (
                      <div
                        key={r.id}
                        onClick={() => router.push(`/contract?id=${r.id}`)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg border border-line hover:border-accent/40 hover:bg-raised transition-colors cursor-pointer group"
                      >
                        <div className={`w-1.5 h-9 rounded-full flex-shrink-0 ${tone.bar}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-ink truncate group-hover:text-accent-bright transition-colors">
                              {r.name}
                            </p>
                            {r.isAutoRenewal && (
                              <span className="text-[9px] font-semibold text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded-full flex-shrink-0 font-mono tracking-wide">
                                AUTO-RENEW
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-faint truncate mt-0.5">{message}</p>
                        </div>
                        <span className={`text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-md border flex-shrink-0 font-mono ${tone.chip}`}>
                          {overdue ? `${Math.abs(r.daysLeft)}d over` : `${r.daysLeft}d left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── MIDDLE ROW: Portfolio Health + Renewal Timeline ── */}
            {ready && contracts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-5"
              >
                {/* Portfolio Health */}
                <div className="lg:col-span-3 bg-surface rounded-2xl border border-line p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-0.5 font-mono">
                        Portfolio Health
                      </p>
                      <p className="text-[13px] font-display font-semibold text-ink">Risk score by contract</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-faint">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-ok" />Low</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warn" />Med</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-bad" />High</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {contracts.map((c, i) => {
                      const barColor = c.riskScore >= 80 ? "bg-ok" : c.riskScore >= 50 ? "bg-warn" : "bg-bad";
                      return (
                        <div
                          key={c.id}
                          onClick={() => router.push(`/contract?id=${c.id}`)}
                          className="cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] font-medium text-sub group-hover:text-accent-bright transition-colors truncate flex-1 pr-4">
                              {c.name}
                            </p>
                            <RiskBadge score={c.riskScore} size="sm" />
                          </div>
                          <div className="w-full h-2 bg-raised rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${barColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${c.riskScore}%` }}
                              transition={{ delay: i * 0.12 + 0.2, duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Exposure breakdown */}
                  <div className="mt-6 pt-5 border-t border-line">
                    <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-3 font-mono">
                      Monthly Exposure Breakdown
                    </p>
                    <div className="space-y-2">
                      {contracts.filter((c) => c.monthlyFee > 0).map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <p className="text-[12px] text-sub truncate flex-1">{c.vendor || c.name}</p>
                          <p className="text-[12px] font-semibold text-ink tabular-nums font-mono">
                            ₹{c.monthlyFee.toLocaleString("en-IN")}/mo
                          </p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-line mt-2">
                        <p className="text-[12px] font-semibold text-sub">Total fixed</p>
                        <p className="text-[13px] font-bold text-accent-bright tabular-nums font-mono">
                          ₹{totalMonthly.toLocaleString("en-IN")}/mo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Renewal Timeline */}
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-line p-6 flex flex-col">
                  <div className="mb-5">
                    <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-0.5 font-mono">
                      Renewal Timeline
                    </p>
                    <p className="text-[13px] font-display font-semibold text-ink">Contract expiry status</p>
                  </div>

                  <div className="flex-1 space-y-1">
                    {sortedByExpiry.map((c) => (
                      <div key={c.id} onClick={() => router.push(`/contract?id=${c.id}`)}>
                        <RenewalRow contract={c} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-line grid grid-cols-3 text-center">
                    {[
                      { label: "Overdue", value: contracts.filter(c => { const d = daysFromNow(c.expiryDate); return !Number.isNaN(d) && d < 0; }).length, color: "text-bad" },
                      { label: "Due soon", value: contracts.filter(c => { const d = daysFromNow(c.expiryDate); return !Number.isNaN(d) && d >= 0 && d <= 90; }).length, color: "text-warn" },
                      { label: "Safe", value: contracts.filter(c => { const d = daysFromNow(c.expiryDate); return !Number.isNaN(d) && d > 90; }).length, color: "text-ok" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10.5px] text-faint mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-warn/8 border border-warn/20 rounded-xl p-3">
                    <p className="text-[11.5px] font-semibold text-warn mb-1">Auto-renewal watch</p>
                    <p className="text-[11px] text-warn/80 leading-relaxed">
                      {contracts.filter(c => c.autoRenewal).length} of {contracts.length} contracts have auto-renewal clauses.
                      Review notice deadlines to avoid unwanted renewals.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── QUERY ── */}
            {!error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-surface rounded-2xl border border-line p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-sub uppercase tracking-[0.15em] font-mono">
                    Ask your contracts
                  </p>
                  <span className="ml-auto text-[11px] text-faint bg-raised border border-line px-2 py-0.5 rounded-md font-mono">
                    AI · GPT
                  </span>
                </div>
                <QueryBar />
              </motion.div>
            )}

            {/* ── CONTRACT GRID ── */}
            {!error && !isEmpty && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-display font-semibold text-ink">All Contracts</h2>
                  <div className="flex items-center gap-3">
                    {!loading && <span className="text-[11.5px] text-faint font-mono">{contracts.length} contracts</span>}
                    <button
                      onClick={() => router.push("/upload")}
                      className="text-[11.5px] font-semibold text-accent hover:text-accent-bright transition-colors"
                    >
                      + Add new
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence mode="wait">
                    {loading
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <motion.div key={`sc-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
                            <SkeletonCard />
                          </motion.div>
                        ))
                      : contracts.map((c, i) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 + 0.1, duration: 0.38 }}
                          >
                            <ContractCard
                              contract={c}
                              onClick={() => router.push(`/contract?id=${c.id}`)}
                            />
                          </motion.div>
                        ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── FOOTER ── */}
            <div className="border-t border-line pt-5 pb-2 flex items-center justify-between text-[11.5px] text-dim font-mono">
              <span>ContractIQ</span>
              <span>Updated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

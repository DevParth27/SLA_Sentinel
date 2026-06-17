import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";

function useCounter(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(current));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Upload any PDF contract",
    desc: "Drag and drop your SLA, MSA, or vendor agreement. Any length, any structure. Processed securely.",
    tag: "< 5 seconds",
    tagColor: "text-violet-700 bg-violet-50 border-violet-100",
  },
  {
    num: "02",
    title: "AI reads every clause",
    desc: "Claude extracts payment terms, SLA thresholds, renewal windows, penalty rates, liability caps, and indemnification clauses into structured JSON.",
    tag: "< 30 seconds",
    tagColor: "text-violet-700 bg-violet-50 border-violet-100",
  },
  {
    num: "03",
    title: "Get risk intelligence",
    desc: "0–100 risk score, letter grade, flagged clauses with severity, renewal alerts, and natural language Q&A across your entire portfolio.",
    tag: "Instant",
    tagColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
];

const RISK_CATS = [
  { name: "Renewal & Expiry Risk", weight: 40, color: "bg-violet-500", desc: "Date proximity + notice adequacy" },
  { name: "Penalty Exposure", weight: 25, color: "bg-red-500", desc: "Penalty rate + high-rate threshold" },
  { name: "Termination & Notice", weight: 20, color: "bg-amber-400", desc: "Exit conditions + short notice period" },
  { name: "SLA Consequences", weight: 10, color: "bg-blue-500", desc: "Breach = financial consequence" },
  { name: "Liability & Indemnity", weight: 15, color: "bg-emerald-500", desc: "Uncapped liability + indemnification scope" },
];

const FEATURES_DEEP = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Clause Extraction",
    desc: "AI parses every PDF and outputs structured data — payment terms, SLAs, penalties, renewal dates, liability caps — in under 30 seconds.",
    detail: "Supports multi-page, scanned, and complex PDFs",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Risk Scoring Engine",
    desc: "Deterministic 0–100 score with A–F grade. Weighted across 5 risk categories — renewal, penalty, termination, SLA, and liability.",
    detail: "No black box — every deduction is explained",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: "Natural Language Q&A",
    desc: 'Ask "What contracts renew next quarter?" or "Which have uncapped liability?" and get direct answers — no SQL, no filters.',
    detail: "Powered by Claude across your full contract portfolio",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: "Renewal Alerts",
    desc: "Know exactly when renewals are due and how much notice you have. Get flagged 90, 60, and 30 days in advance with severity grading.",
    detail: "Never miss an auto-renewal deadline again",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
    title: "Contract Comparison",
    desc: "Compare two contracts side by side. Clause-by-clause diffing highlights where terms diverge — useful for renewals and vendor evaluations.",
    detail: "Highlights changed and missing clauses automatically",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: "Portfolio Dashboard",
    desc: "See all your contracts in one place. Sort by risk, filter by status, track total monthly exposure, and drill down into any clause.",
    detail: "Designed for procurement leads and legal ops",
  },
];

// Mini product mockup component
function ProductPreview() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-8 rounded-3xl opacity-20"
        style={{ background: "radial-gradient(ellipse, #7C3AED, transparent 70%)" }}
      />
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/10">
        {/* Browser chrome */}
        <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-1 text-[10px] text-slate-400 border border-slate-200/80 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            contractiq.app/dashboard
          </div>
        </div>
        {/* App shell */}
        <div className="flex" style={{ height: 300 }}>
          {/* Mini sidebar */}
          <div className="w-32 bg-white border-r border-slate-100 p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-violet-50 mb-2">
              <div className="w-3 h-3 bg-violet-400 rounded" />
              <div className="h-2 w-14 bg-violet-200 rounded-full" />
            </div>
            {[14, 12, 10].map((w) => (
              <div key={w} className="flex items-center gap-2 px-2 py-2 rounded-lg">
                <div className="w-3 h-3 bg-slate-200 rounded" />
                <div className={`h-2 w-${w} bg-slate-100 rounded-full`} />
              </div>
            ))}
            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex-shrink-0" />
              <div>
                <div className="h-2 w-12 bg-slate-200 rounded mb-1" />
                <div className="h-1.5 w-10 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
          {/* Main */}
          <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { v: "3", c: "text-slate-900" },
                { v: "62", c: "text-amber-600" },
                { v: "₹2.05L", c: "text-slate-900" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 p-2">
                  <div className="h-1.5 w-10 bg-slate-100 rounded mb-2" />
                  <p className={`text-[11px] font-bold ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            {/* Alert */}
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <div className="h-2 w-40 bg-red-200 rounded" />
            </div>
            {/* Contracts */}
            {[
              { color: "bg-amber-400", score: 62, scoreC: "text-amber-600" },
              { color: "bg-emerald-500", score: 81, scoreC: "text-emerald-600" },
              { color: "bg-red-500", score: 44, scoreC: "text-red-600" },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-100 px-3 py-2.5 mb-2 flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full ${c.color} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="h-2 w-24 bg-slate-200 rounded mb-1.5" />
                  <div className="h-1.5 w-16 bg-slate-100 rounded" />
                </div>
                <span className={`text-[10px] font-bold ${c.scoreC}`}>{c.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const router = useRouter();

  // Landing-page hero stats — illustrative marketing figures, not live data.
  const contractCount = useCounter(3, 600);
  const monthlyK = useCounter(205, 900);
  const clauseCount = useCounter(18, 1100);
  const renewals = useCounter(2, 500);

  return (
    <>
      <Head>
        <title>ContractIQ — AI Contract Risk Intelligence</title>
      </Head>

      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Dot grid */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #e2e8f0 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white via-white/70 to-white" />

        <div className="relative">
          {/* Nav */}
          <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#7C3AED] rounded-lg flex items-center justify-center shadow-md shadow-violet-200">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-[15px]">ContractIQ</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => router.push("/upload")} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                Upload
              </button>
              <button onClick={() => router.push("/dashboard")} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                Dashboard
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors"
              >
                Get started →
              </button>
            </div>
          </nav>

          {/* ── HERO — 2-column ── */}
          <section className="max-w-6xl mx-auto px-6 pt-14 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="inline-flex items-center gap-2 mb-7 px-3 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[11px] font-medium text-slate-500">
                    AI-powered · Used by procurement teams
                  </span>
                </div>

                <h1 className="text-[52px] md:text-[60px] font-bold text-slate-900 leading-[1.04] tracking-[-2px] mb-5">
                  Contract risk,
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: "linear-gradient(135deg, #7C3AED 0%, #a78bfa 100%)" }}
                  >
                    before it hits.
                  </span>
                </h1>

                <p className="text-[17px] text-slate-500 leading-relaxed mb-8 max-w-lg">
                  Upload SLA contracts. AI extracts every clause, scores every risk, and
                  answers questions in plain English — in under 30 seconds.
                </p>

                <div className="flex items-center gap-3 mb-10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/dashboard")}
                    className="text-sm font-semibold text-white px-6 py-3 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED 0%, #6d28d9 100%)",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                    }}
                  >
                    View Demo Dashboard
                  </motion.button>
                  <button
                    onClick={() => router.push("/upload")}
                    className="group text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-3 flex items-center gap-1.5 transition-colors"
                  >
                    Upload a contract
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Trust signals */}
                <div className="flex items-center gap-5 pt-6 border-t border-slate-100">
                  {[
                    { icon: "🔒", text: "Encrypted in transit" },
                    { icon: "⚡", text: "Results in 30s" },
                    { icon: "🎯", text: "5 risk categories" },
                  ].map((t) => (
                    <div key={t.text} className="flex items-center gap-1.5">
                      <span className="text-sm">{t.icon}</span>
                      <span className="text-[11.5px] text-slate-400 font-medium">{t.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: product mockup */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:block"
              >
                <ProductPreview />
              </motion.div>
            </div>
          </section>

          {/* ── STATS STRIP ── */}
          <div className="border-y border-slate-100 bg-slate-50/60">
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
              {[
                { value: contractCount, suffix: "", label: "Contracts managed" },
                { value: clauseCount, suffix: "+", label: "Clauses extracted" },
                { value: monthlyK, suffix: "K", prefix: "₹", label: "Monthly exposure tracked" },
                { value: renewals, suffix: "", label: "Renewals action-needed" },
              ].map((s) => (
                <div key={s.label} className="px-6 first:pl-0 last:pr-0 py-2">
                  <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none mb-1.5">
                    {s.prefix ?? ""}{s.value}{s.suffix}
                  </p>
                  <p className="text-sm text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ── */}
          <section className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  How it works
                </p>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  From PDF to intelligence
                  <br />in three steps.
                </h2>
              </div>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                No setup, no integrations required. Just upload a PDF and get a complete risk report.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className="relative bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
                >
                  {/* Step connector */}
                  {i < 2 && (
                    <div className="hidden md:flex absolute right-0 top-10 translate-x-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-300 tracking-widest block mb-5">
                    {step.num}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-base mb-2.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{step.desc}</p>
                  <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${step.tagColor}`}>
                    {step.tag}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── WHAT GETS SCORED ── */}
          <section className="border-t border-slate-100 bg-slate-50">
            <div className="max-w-6xl mx-auto px-6 py-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Left: explanation */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    The scoring model
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
                    5 risk categories.
                    <br />Every deduction explained.
                  </h2>
                  <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
                    ContractIQ scores contracts using a deterministic model — no black box.
                    Every point deducted is traced to a specific clause, with a plain-English explanation.
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-slate-900">A</span>
                      <span className="text-xs text-emerald-600 font-medium">80–100</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-slate-700">B</span>
                      <span className="text-xs text-blue-600 font-medium">65–79</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-slate-600">C</span>
                      <span className="text-xs text-amber-600 font-medium">50–64</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-slate-500">D</span>
                      <span className="text-xs text-orange-600 font-medium">35–49</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-red-600">F</span>
                      <span className="text-xs text-red-600 font-medium">0–34</span>
                    </div>
                  </div>
                </div>

                {/* Right: bar chart */}
                <div className="space-y-5">
                  {RISK_CATS.map((cat, i) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-slate-700">{cat.name}</span>
                        <span className="text-[11px] text-slate-400">{cat.desc}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${cat.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.weight}%` }}
                            transition={{ delay: i * 0.1 + 0.4, duration: 0.9, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-8 text-right tabular-nums">
                          {cat.weight}pt
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11.5px] text-slate-400 pt-2 border-t border-slate-200">
                    Score = 100 minus deductions. Multiple flags can apply per contract.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES GRID ── */}
          <section className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-14">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Full feature set
              </p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Everything procurement teams need.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES_DEEP.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.2 }}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-violet-50 flex items-center justify-center text-slate-500 group-hover:text-violet-600 mb-4 transition-colors duration-200">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-[14px] mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                  <p className="text-[11px] text-slate-400 border-t border-slate-50 pt-3">{f.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── DARK CTA ── */}
          <div className="bg-slate-900 mx-6 rounded-2xl mb-8 overflow-hidden">
            <div className="relative px-10 py-16">
              {/* subtle bg pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative max-w-2xl mx-auto text-center">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
                  Get started today
                </p>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  Stop missing contract renewals.
                  <br />Start knowing your risk.
                </h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Upload your first contract in seconds. No signup required, no integrations.
                  Just drag, drop, and get intelligence.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/upload")}
                    className="text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 px-7 py-3 rounded-xl transition-colors shadow-lg"
                  >
                    Upload your first contract
                  </motion.button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm font-semibold text-slate-400 hover:text-white px-5 py-3 transition-colors"
                  >
                    View demo →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="px-6 pb-8 pt-4 flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#7C3AED] rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-400">ContractIQ</span>
            </div>
            <p className="text-xs text-slate-300">© 2025 · Built for legal and procurement teams</p>
          </footer>
        </div>
      </div>
    </>
  );
}

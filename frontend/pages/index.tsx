import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import ThemeToggle from "../components/ThemeToggle";

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
  },
  {
    num: "02",
    title: "AI reads every clause",
    desc: "The model extracts payment terms, SLA thresholds, renewal windows, penalty rates, liability caps, and indemnification clauses into structured data.",
    tag: "< 30 seconds",
  },
  {
    num: "03",
    title: "Get risk intelligence",
    desc: "0–100 risk score, letter grade, flagged clauses with severity, renewal alerts, and natural-language Q&A across your entire portfolio.",
    tag: "Instant",
  },
];

const RISK_CATS = [
  { name: "Renewal & Expiry Risk", weight: 40, color: "bg-accent", desc: "Date proximity + notice adequacy" },
  { name: "Penalty Exposure", weight: 25, color: "bg-bad", desc: "Penalty rate + high-rate threshold" },
  { name: "Termination & Notice", weight: 20, color: "bg-warn", desc: "Exit conditions + short notice period" },
  { name: "SLA Consequences", weight: 10, color: "bg-info", desc: "Breach = financial consequence" },
  { name: "Liability & Indemnity", weight: 15, color: "bg-ok", desc: "Uncapped liability + indemnification scope" },
];

const FEATURES_DEEP = [
  {
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    title: "Clause Extraction",
    desc: "Parses every PDF and outputs structured data — payment terms, SLAs, penalties, renewal dates, liability caps — in under 30 seconds.",
    detail: "Multi-page, scanned, and complex PDFs",
  },
  {
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    title: "Risk Scoring Engine",
    desc: "Deterministic 0–100 score with A–F grade. Weighted across 5 risk categories — renewal, penalty, termination, SLA, and liability.",
    detail: "No black box — every deduction explained",
  },
  {
    icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z",
    title: "Natural Language Q&A",
    desc: 'Ask "What contracts renew next quarter?" or "Which have uncapped liability?" and get direct answers — no SQL, no filters.',
    detail: "Reasons across your full portfolio",
  },
  {
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    title: "Renewal Alerts",
    desc: "Know exactly when renewals are due and how much notice you have. Flagged 90, 60, and 30 days in advance with severity grading.",
    detail: "Never miss an auto-renewal deadline",
  },
  {
    icon: "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5",
    title: "Contract Comparison",
    desc: "Compare two contracts side by side. Clause-by-clause diffing highlights where terms diverge — built for renewals and vendor evaluations.",
    detail: "Highlights changed & missing clauses",
  },
  {
    icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
    title: "Portfolio Dashboard",
    desc: "See all contracts in one place. Sort by risk, filter by status, track total monthly exposure, and drill into any clause.",
    detail: "For procurement leads & legal ops",
  },
];

function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={`${className} bg-accent-grad rounded-lg flex items-center justify-center shadow-glow-sm`}>
      <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

// Mini product mockup — dark
function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-10 rounded-[2rem] opacity-40 glow-drift"
        style={{ background: "radial-gradient(ellipse, rgba(91,141,239,0.4), transparent 65%)" }} />
      <div className="relative rounded-2xl overflow-hidden border border-line shadow-panel bg-surface">
        {/* Browser chrome */}
        <div className="bg-raised px-4 py-3 flex items-center gap-3 border-b border-line">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bad/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-warn/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-ok/60" />
          </div>
          <div className="flex-1 bg-base rounded-md px-3 py-1 text-[10px] text-faint border border-line flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
            contractiq.app/dashboard
          </div>
        </div>
        {/* App shell */}
        <div className="flex" style={{ height: 300 }}>
          {/* Mini sidebar */}
          <div className="w-32 bg-surface border-r border-line p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-accent/10 mb-2">
              <div className="w-3 h-3 bg-accent rounded" />
              <div className="h-2 w-14 bg-accent/40 rounded-full" />
            </div>
            {[14, 12, 10].map((w) => (
              <div key={w} className="flex items-center gap-2 px-2 py-2 rounded-lg">
                <div className="w-3 h-3 bg-line rounded" />
                <div className="h-2 bg-line-soft rounded-full" style={{ width: w * 4 }} />
              </div>
            ))}
            <div className="mt-auto pt-3 border-t border-line flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-grad flex-shrink-0" />
              <div>
                <div className="h-2 w-12 bg-line rounded mb-1" />
                <div className="h-1.5 w-10 bg-line-soft rounded" />
              </div>
            </div>
          </div>
          {/* Main */}
          <div className="flex-1 bg-base p-4 overflow-hidden">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { v: "3", c: "text-ink" },
                { v: "62", c: "text-warn" },
                { v: "₹2.05L", c: "text-ink" },
              ].map((s, i) => (
                <div key={i} className="bg-surface rounded-lg border border-line p-2">
                  <div className="h-1.5 w-10 bg-line-soft rounded mb-2" />
                  <p className={`text-[11px] font-bold font-mono ${s.c}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-bad/10 border border-bad/25 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-bad flex-shrink-0" />
              <div className="h-2 w-40 bg-bad/30 rounded" />
            </div>
            {[
              { color: "bg-warn", score: 62, scoreC: "text-warn" },
              { color: "bg-ok", score: 81, scoreC: "text-ok" },
              { color: "bg-bad", score: 44, scoreC: "text-bad" },
            ].map((c, i) => (
              <div key={i} className="bg-surface rounded-lg border border-line px-3 py-2.5 mb-2 flex items-center gap-3">
                <div className={`w-1 h-8 rounded-full ${c.color} flex-shrink-0`} />
                <div className="flex-1">
                  <div className="h-2 w-24 bg-line rounded mb-1.5" />
                  <div className="h-1.5 w-16 bg-line-soft rounded" />
                </div>
                <span className={`text-[10px] font-bold font-mono ${c.scoreC}`}>{c.score}</span>
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
  const contractCount = useCounter(3, 600);
  const monthlyK = useCounter(205, 900);
  const clauseCount = useCounter(18, 1100);
  const renewals = useCounter(2, 500);

  return (
    <>
      <Head>
        <title>ContractIQ — AI Contract Risk Intelligence</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans relative overflow-hidden">
        {/* Ambient backgrounds */}
        <div className="fixed inset-0 pointer-events-none bg-grid opacity-60" />
        <div className="fixed top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full pointer-events-none glow-drift"
          style={{ background: "radial-gradient(circle, rgba(91,141,239,0.12), transparent 70%)" }} />
        <div className="fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="relative">
          {/* Nav */}
          <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo className="w-7 h-7" />
              <span className="font-display font-bold text-ink tracking-tight text-[16px]">ContractIQ</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => router.push("/upload")} className="hidden sm:block text-[13.5px] text-sub hover:text-ink transition-colors">
                Upload
              </button>
              <button onClick={() => router.push("/dashboard")} className="hidden sm:block text-[13.5px] text-sub hover:text-ink transition-colors">
                Dashboard
              </button>
              <ThemeToggle />
              <button
                onClick={() => router.push("/dashboard")}
                className="text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright px-4 py-2 rounded-lg transition-colors shadow-glow-sm"
              >
                Launch app →
              </button>
            </div>
          </nav>

          {/* ── HERO ── */}
          <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="font-display text-[50px] md:text-[62px] font-bold text-ink leading-[1.02] tracking-[-0.03em] mb-5 mt-2">
                  Contract risk,
                  <br />
                  <span className="bg-clip-text text-transparent bg-accent-grad">
                    before it hits.
                  </span>
                </h1>

                <p className="text-[16.5px] text-sub leading-relaxed mb-8 max-w-lg">
                  Upload an SLA contract. AI extracts every clause, scores every risk, and
                  answers questions in plain English — in under 30 seconds.
                </p>

                <div className="flex items-center gap-3 mb-10">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/dashboard")}
                    className="text-[13.5px] font-semibold text-base bg-accent hover:bg-accent-bright px-6 py-3 rounded-xl shadow-glow transition-colors"
                  >
                    Open dashboard
                  </motion.button>
                  <button
                    onClick={() => router.push("/upload")}
                    className="group text-[13.5px] font-medium text-sub hover:text-ink px-4 py-3 flex items-center gap-1.5 transition-colors"
                  >
                    Upload a contract
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-line">
                  {[
                    { label: "Encrypted in transit" },
                    { label: "Results in 30s" },
                    { label: "5 risk categories" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[11.5px] text-faint font-medium">{t.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

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
          <div className="border-y border-line bg-surface/40 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
              {[
                { value: contractCount, suffix: "", label: "Contracts managed" },
                { value: clauseCount, suffix: "+", label: "Clauses extracted" },
                { value: monthlyK, suffix: "K", prefix: "₹", label: "Monthly exposure tracked" },
                { value: renewals, suffix: "", label: "Renewals action-needed" },
              ].map((s) => (
                <div key={s.label} className="px-6 first:pl-0 last:pr-0 py-2">
                  <p className="font-display text-3xl font-bold text-ink tabular-nums leading-none mb-1.5">
                    {s.prefix ?? ""}{s.value}{s.suffix}
                  </p>
                  <p className="text-[13px] text-faint">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ── */}
          <section className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium text-accent uppercase tracking-[0.2em] mb-3 font-mono">
                  How it works
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight">
                  From PDF to intelligence
                  <br />in three steps.
                </h2>
              </div>
              <p className="text-[13.5px] text-faint max-w-xs leading-relaxed">
                No setup, no integrations required. Just upload a PDF and get a complete risk report.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative bg-surface border border-line rounded-2xl p-7 hover:border-accent/40 transition-colors duration-200 group overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "radial-gradient(100% 60% at 50% 0%, rgba(91,141,239,0.07), transparent)" }} />
                  <span className="relative font-mono text-xs font-bold text-accent/60 tracking-[0.3em] block mb-5">
                    {step.num}
                  </span>
                  <h3 className="relative font-display font-semibold text-ink text-[17px] mb-2.5">{step.title}</h3>
                  <p className="relative text-[13.5px] text-sub leading-relaxed mb-5">{step.desc}</p>
                  <span className="relative inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-md border border-accent/25 bg-accent/10 text-accent-bright font-mono">
                    {step.tag}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── WHAT GETS SCORED ── */}
          <section className="border-y border-line bg-surface/30">
            <div className="max-w-6xl mx-auto px-6 py-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                <div>
                  <p className="text-[11px] font-medium text-accent uppercase tracking-[0.2em] mb-3 font-mono">
                    The scoring model
                  </p>
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight mb-4">
                    5 risk categories.
                    <br />Every deduction explained.
                  </h2>
                  <p className="text-sub text-[15px] leading-relaxed mb-8">
                    ContractIQ scores contracts using a deterministic model — no black box.
                    Every point deducted is traced to a specific clause, with a plain-English explanation.
                  </p>

                  <div className="flex items-center gap-3">
                    {[
                      { g: "A", r: "80–100", c: "text-ok" },
                      { g: "B", r: "65–79", c: "text-info" },
                      { g: "C", r: "50–64", c: "text-warn" },
                      { g: "D", r: "35–49", c: "text-warn" },
                      { g: "F", r: "0–34", c: "text-bad" },
                    ].map((x) => (
                      <div key={x.g} className="flex flex-col items-center px-2.5 py-2 rounded-lg border border-line bg-surface">
                        <span className={`font-display text-2xl font-bold ${x.c}`}>{x.g}</span>
                        <span className="text-[10px] text-faint font-mono mt-0.5">{x.r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  {RISK_CATS.map((cat, i) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-ink">{cat.name}</span>
                        <span className="text-[11px] text-faint">{cat.desc}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-raised rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${cat.color}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${cat.weight}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 + 0.2, duration: 0.9, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-sub w-9 text-right tabular-nums font-mono">
                          {cat.weight}pt
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11.5px] text-faint pt-3 border-t border-line">
                    Score = 100 minus deductions. Multiple flags can apply per contract.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── FEATURES GRID ── */}
          <section className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-14">
              <p className="text-[11px] font-medium text-accent uppercase tracking-[0.2em] mb-3 font-mono">
                Full feature set
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink tracking-tight">
                Everything procurement teams need.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES_DEEP.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-surface border border-line rounded-2xl p-6 hover:border-accent/40 transition-colors duration-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-raised group-hover:bg-accent/15 flex items-center justify-center text-faint group-hover:text-accent mb-4 transition-colors duration-200">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="font-display font-semibold text-ink text-[15px] mb-2">{f.title}</h3>
                  <p className="text-[13.5px] text-sub leading-relaxed mb-4">{f.desc}</p>
                  <p className="text-[11px] text-faint border-t border-line-soft pt-3 font-mono">{f.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <div className="relative mx-6 rounded-3xl mb-8 overflow-hidden border border-line bg-surface">
            <div className="absolute inset-0 bg-grid opacity-50" />
            <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full glow-drift"
              style={{ background: "radial-gradient(circle, rgba(91,141,239,0.18), transparent 70%)" }} />
            <div className="relative px-10 py-20">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-[11px] font-medium text-accent uppercase tracking-[0.2em] mb-4 font-mono">
                  Get started today
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 tracking-tight">
                  Stop missing contract renewals.
                  <br />Start knowing your risk.
                </h2>
                <p className="text-sub text-[14.5px] mb-8 leading-relaxed">
                  Upload your first contract in seconds. No signup required, no integrations.
                  Just drag, drop, and get intelligence.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/upload")}
                    className="text-[13.5px] font-semibold text-base bg-accent hover:bg-accent-bright px-7 py-3 rounded-xl transition-colors shadow-glow"
                  >
                    Upload your first contract
                  </motion.button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-[13.5px] font-semibold text-sub hover:text-ink px-5 py-3 transition-colors"
                  >
                    View demo →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <footer className="px-6 pb-8 pt-4 flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="text-xs font-semibold text-faint font-display">ContractIQ</span>
            </div>
            <p className="text-xs text-dim">© 2026 · Built for legal and procurement teams</p>
          </footer>
        </div>
      </div>
    </>
  );
}

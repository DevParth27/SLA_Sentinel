import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import { API_BASE, fetchContracts } from "../lib/api";
import { Settings, DEFAULTS, loadSettings, saveSettings, clearSettings } from "../lib/settings";
import ThemeToggle from "../components/ThemeToggle";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> },
  { label: "Upload", href: "/upload", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /> },
  { label: "Compare", href: "/compare", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /> },
  { label: "Settings", href: "/settings", icon: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
];

// ── Small UI primitives ──
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${on ? "bg-accent" : "bg-elevated"}`}
      aria-pressed={on}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow ${on ? "left-[20px]" : "left-[2px]"}`}
      />
    </button>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex bg-base border border-line rounded-lg p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
              active ? "bg-accent text-base" : "text-sub hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-line-soft last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="text-[12px] text-faint mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Section({
  label,
  iconPath,
  children,
}: {
  label: string;
  iconPath: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl border border-line p-6"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 rounded-lg bg-raised flex items-center justify-center text-accent">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            {iconPath}
          </svg>
        </span>
        <h2 className="text-[13px] font-display font-semibold text-ink uppercase tracking-wide">{label}</h2>
      </div>
      <div>{children}</div>
    </motion.section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [conn, setConn] = useState<"checking" | "ok" | "down">("checking");
  const [contractCount, setContractCount] = useState<number | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Live backend connection check.
  const pingBackend = useCallback(() => {
    setConn("checking");
    fetchContracts()
      .then((list) => {
        setConn("ok");
        setContractCount(list.length);
      })
      .catch(() => {
        setConn("down");
        setContractCount(null);
      });
  }, []);

  useEffect(() => {
    pingBackend();
  }, [pingBackend]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
    setSaved(true);
    window.clearTimeout((update as any)._t);
    (update as any)._t = window.setTimeout(() => setSaved(false), 1600);
  }, []);

  const reset = () => {
    clearSettings();
    setSettings(DEFAULTS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <>
      <Head>
        <title>Settings — ContractIQ</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans flex">
        {/* Sidebar */}
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
                  <span className={active ? "text-accent" : "text-faint"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {item.icon}
                    </svg>
                  </span>
                  {item.label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-line">
            <p className="text-[11px] text-dim font-mono">ContractIQ · v1.0</p>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 md:ml-56 flex flex-col min-h-screen">
          <header className="bg-base/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-[14px] font-display font-semibold text-ink">Settings</h1>
              <p className="text-[11.5px] text-faint mt-0.5 font-mono">Preferences are stored on this device</p>
            </div>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-[12px] text-ok font-mono"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Saved
                  </motion.span>
                )}
              </AnimatePresence>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 p-6 max-w-3xl w-full space-y-5">
            {/* Appearance */}
            <Section
              label="Appearance"
              iconPath={<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
            >
              <Row title="Theme" desc="Switch between dark and light across the whole app.">
                <ThemeToggle />
              </Row>
            </Section>

            {/* Notifications */}
            <Section
              label="Reminders & Alerts"
              iconPath={<path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />}
            >
              <Row title="Reminder lead time" desc="How far ahead a renewal deadline appears in Action Required.">
                <Segmented
                  value={settings.reminderLeadDays}
                  onChange={(v) => update("reminderLeadDays", v)}
                  options={[
                    { label: "30 days", value: 30 },
                    { label: "60 days", value: 60 },
                    { label: "90 days", value: 90 },
                  ]}
                />
              </Row>
              <Row title="Auto-renewal alerts" desc="Highlight contracts that renew automatically before the notice window closes.">
                <Toggle on={settings.autoRenewalAlerts} onChange={(v) => update("autoRenewalAlerts", v)} />
              </Row>
              <Row title="Weekly summary" desc="Show a portfolio summary banner once a week when you open the dashboard.">
                <Toggle on={settings.weeklyDigest} onChange={(v) => update("weeklyDigest", v)} />
              </Row>
            </Section>

            {/* Risk */}
            <Section
              label="Risk & Scoring"
              iconPath={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />}
            >
              <div className="py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13.5px] font-medium text-ink">High-risk threshold</p>
                  <span className="font-mono text-[13px] font-bold text-accent-bright tabular-nums">
                    &lt; {settings.highRiskThreshold}
                  </span>
                </div>
                <p className="text-[12px] text-faint mb-4 leading-relaxed">
                  Contracts scoring below this value are treated as high risk and surfaced in the alert banner.
                </p>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={settings.highRiskThreshold}
                  onChange={(e) => update("highRiskThreshold", Number(e.target.value))}
                  className="w-full accent-[#5B8DEF] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-dim font-mono mt-1.5">
                  <span>20 · lenient</span>
                  <span>80 · strict</span>
                </div>
              </div>
            </Section>

            {/* Display */}
            <Section
              label="Display"
              iconPath={<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />}
            >
              <Row title="Currency" desc="Used when displaying contract fees and exposure.">
                <Segmented
                  value={settings.currency}
                  onChange={(v) => update("currency", v)}
                  options={[
                    { label: "₹ INR", value: "INR" },
                    { label: "$ USD", value: "USD" },
                    { label: "€ EUR", value: "EUR" },
                  ]}
                />
              </Row>
              <Row title="Date format" desc="How dates render across the dashboard and contract pages.">
                <Segmented
                  value={settings.dateFormat}
                  onChange={(v) => update("dateFormat", v)}
                  options={[
                    { label: "12 Jun 2026", value: "DD MMM YYYY" },
                    { label: "06/12/2026", value: "MM/DD/YYYY" },
                    { label: "2026-06-12", value: "YYYY-MM-DD" },
                  ]}
                />
              </Row>
            </Section>

            {/* Connection */}
            <Section
              label="Connection"
              iconPath={<path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />}
            >
              <Row title="API endpoint" desc="The backend this app talks to for live contract data.">
                <code className="text-[11.5px] text-sub bg-base border border-line rounded-md px-2.5 py-1.5 font-mono max-w-[260px] truncate inline-block">
                  {API_BASE}
                </code>
              </Row>
              <Row
                title="Backend status"
                desc={
                  conn === "ok" && contractCount !== null
                    ? `Connected · ${contractCount} contract${contractCount !== 1 ? "s" : ""} loaded`
                    : conn === "down"
                    ? "Could not reach the backend"
                    : "Checking connection…"
                }
              >
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1 rounded-md border ${
                    conn === "ok" ? "text-ok bg-ok/10 border-ok/25"
                    : conn === "down" ? "text-bad bg-bad/10 border-bad/25"
                    : "text-faint bg-white/5 border-line"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${conn === "ok" ? "bg-ok" : conn === "down" ? "bg-bad" : "bg-faint"}`} />
                    {conn === "ok" ? "Operational" : conn === "down" ? "Offline" : "…"}
                  </span>
                  <button
                    onClick={pingBackend}
                    className="text-[12px] font-medium text-sub hover:text-ink transition-colors"
                  >
                    Re-test
                  </button>
                </div>
              </Row>
            </Section>

            {/* Danger zone */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-bad/25 p-6"
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">Reset preferences</p>
                  <p className="text-[12px] text-faint mt-0.5">Restore all settings on this device to their defaults.</p>
                </div>
                <button
                  onClick={reset}
                  className="text-[12.5px] font-semibold text-bad bg-bad/10 hover:bg-bad/20 border border-bad/25 px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  Reset to defaults
                </button>
              </div>
            </motion.section>

            <div className="border-t border-line pt-5 pb-2 flex items-center justify-between text-[11.5px] text-dim font-mono">
              <span>ContractIQ · Settings</span>
              <span>Stored locally</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

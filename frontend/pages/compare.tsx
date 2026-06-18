import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  fetchContracts,
  fetchContractById,
  Contract,
} from "../lib/api";
import RiskBadge from "../components/RiskBadge";
import ClauseTable from "../components/ClauseTable";

function fmtDate(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtFee(c: Contract): string {
  return c.monthlyFee > 0 ? `₹${c.monthlyFee.toLocaleString("en-IN")}/mo` : "Transaction-based";
}

// One row of the side-by-side key-terms comparison. Highlights when the two
// contracts disagree so renewals / vendor evaluations are easy to eyeball.
function MetricRow({
  label,
  a,
  b,
  differ,
}: {
  label: string;
  a: React.ReactNode;
  b: React.ReactNode;
  differ: boolean;
}) {
  return (
    <tr className={`border-b border-line-soft last:border-0 ${differ ? "bg-warn/8" : ""}`}>
      <td className="px-4 py-3 text-[11px] font-medium text-faint uppercase tracking-[0.12em] w-[26%] font-mono">
        {label}
      </td>
      <td className="px-4 py-3 text-[13px] text-ink font-medium">{a}</td>
      <td className="px-4 py-3 text-[13px] text-ink font-medium">{b}</td>
    </tr>
  );
}

function Selector({
  label,
  contracts,
  value,
  onChange,
  exclude,
}: {
  label: string;
  contracts: Contract[];
  value: string;
  onChange: (id: string) => void;
  exclude?: string;
}) {
  return (
    <div className="flex-1">
      <label className="block text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-1.5 font-mono">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-base border border-line rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-ink focus:outline-none focus:border-accent/60 focus:shadow-glow-sm transition appearance-none"
      >
        <option value="">Select a contract…</option>
        {contracts
          .filter((c) => c.id !== exclude)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>
    </div>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [a, setA] = useState<Contract | null>(null);
  const [b, setB] = useState<Contract | null>(null);
  const [pairLoading, setPairLoading] = useState(false);

  // Load the contract list for the two dropdowns.
  useEffect(() => {
    let cancelled = false;
    fetchContracts()
      .then((list) => {
        if (cancelled) return;
        setContracts(list);
        // Preselect the first two if the URL didn't specify any.
        const qa = typeof router.query.a === "string" ? router.query.a : "";
        const qb = typeof router.query.b === "string" ? router.query.b : "";
        setIdA(qa || list[0]?.id || "");
        setIdB(qb || list[1]?.id || "");
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // router.query is read once on mount; selectors drive subsequent changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Fetch full detail (with clauses) for whichever two are selected.
  useEffect(() => {
    if (!idA || !idB) {
      setA(null);
      setB(null);
      return;
    }
    let cancelled = false;
    setPairLoading(true);
    Promise.all([fetchContractById(idA), fetchContractById(idB)])
      .then(([ca, cb]) => {
        if (cancelled) return;
        setA(ca);
        setB(cb);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPairLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idA, idB]);

  const bothSelected = Boolean(a && b);
  const notEnough = !listLoading && contracts.length < 2;

  return (
    <>
      <Head>
        <title>Compare Contracts — ContractIQ</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans relative">
        <div className="fixed inset-0 pointer-events-none bg-grid opacity-40" />
        <div className="relative">
          {/* Nav */}
          <nav className="bg-base/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-accent-grad rounded-md flex items-center justify-center shadow-glow-sm">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-display font-bold text-ink text-[14px] tracking-tight">ContractIQ</span>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-faint hover:text-ink transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </button>
          </nav>

          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="mb-6">
              <h1 className="font-display text-xl md:text-2xl font-bold text-ink">Compare Contracts</h1>
              <p className="text-sm text-faint mt-1">
                Side-by-side key terms and a clause-by-clause diff. Differences are highlighted.
              </p>
            </div>

            {notEnough ? (
              <div className="bg-surface rounded-2xl border border-line p-12 text-center">
                <p className="text-lg font-display font-bold text-ink mb-1.5">Need at least 2 contracts</p>
                <p className="text-sm text-faint mb-6">
                  Upload another contract to use side-by-side comparison.
                </p>
                <button
                  onClick={() => router.push("/upload")}
                  className="text-[13px] font-semibold text-base bg-accent hover:bg-accent-bright px-5 py-2.5 rounded-xl transition-colors shadow-glow-sm"
                >
                  Upload a contract
                </button>
              </div>
            ) : (
              <>
                {/* Selectors */}
                <div className="bg-surface rounded-2xl border border-line p-5 mb-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                    <Selector label="Contract A" contracts={contracts} value={idA} onChange={setIdA} exclude={idB} />
                    <div className="hidden sm:flex items-center justify-center pb-2.5 text-accent/50">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <Selector label="Contract B" contracts={contracts} value={idB} onChange={setIdB} exclude={idA} />
                  </div>
                </div>

                {pairLoading && (
                  <div className="flex items-center justify-center py-16">
                    <motion.span
                      className="w-8 h-8 rounded-full border-[3px] border-line border-t-accent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}

                {!pairLoading && bothSelected && a && b && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-6"
                  >
                    {/* Headers + risk */}
                    <div className="grid grid-cols-2 gap-4">
                      {[a, b].map((c, i) => (
                        <div key={i} className="bg-surface rounded-2xl border border-line p-5">
                          <p className="text-[10px] font-medium text-faint uppercase tracking-[0.15em] mb-1 font-mono">
                            Contract {i === 0 ? "A" : "B"}
                          </p>
                          <p className="text-[15px] font-display font-bold text-ink leading-tight mb-2 truncate">
                            {c.name}
                          </p>
                          <p className="text-[12px] text-faint mb-3 truncate">{c.vendor || "—"}</p>
                          <RiskBadge score={c.riskScore} size="sm" />
                        </div>
                      ))}
                    </div>

                    {/* Key terms comparison */}
                    <div className="bg-surface rounded-2xl border border-line p-5">
                      <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] mb-4 font-mono">
                        Key Terms
                      </p>
                      <div className="rounded-xl overflow-hidden border border-line">
                        <table className="w-full border-collapse">
                          <tbody>
                            <MetricRow label="Risk Score" a={`${a.riskScore} / 100`} b={`${b.riskScore} / 100`} differ={a.riskScore !== b.riskScore} />
                            <MetricRow label="Monthly Fee" a={fmtFee(a)} b={fmtFee(b)} differ={a.monthlyFee !== b.monthlyFee} />
                            <MetricRow label="Auto-Renewal" a={a.autoRenewal ? "Yes" : "No"} b={b.autoRenewal ? "Yes" : "No"} differ={a.autoRenewal !== b.autoRenewal} />
                            <MetricRow label="Notice Period" a={a.renewalNoticeDays > 0 ? `${a.renewalNoticeDays} days` : "—"} b={b.renewalNoticeDays > 0 ? `${b.renewalNoticeDays} days` : "—"} differ={a.renewalNoticeDays !== b.renewalNoticeDays} />
                            <MetricRow label="Effective" a={fmtDate(a.effectiveDate)} b={fmtDate(b.effectiveDate)} differ={a.effectiveDate !== b.effectiveDate} />
                            <MetricRow label="Expires" a={fmtDate(a.expiryDate)} b={fmtDate(b.expiryDate)} differ={a.expiryDate !== b.expiryDate} />
                            <MetricRow label="Flags" a={`${a.flags.length}`} b={`${b.flags.length}`} differ={a.flags.length !== b.flags.length} />
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Clause-by-clause diff */}
                    <div className="bg-surface rounded-2xl border border-line p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10.5px] font-medium text-faint uppercase tracking-[0.15em] font-mono">
                          Clause-by-Clause · {a.name} vs {b.name}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-warn font-mono">
                          <span className="w-2 h-2 rounded-full bg-warn" /> highlighted = differs
                        </span>
                      </div>
                      {a.clauses.length === 0 && b.clauses.length === 0 ? (
                        <p className="text-[13px] text-faint py-4 text-center">
                          No extracted clauses to compare yet.
                        </p>
                      ) : (
                        <ClauseTable clauses={a.clauses} compareWith={b.clauses} />
                      )}
                    </div>
                  </motion.div>
                )}

                {!pairLoading && !bothSelected && !listLoading && (
                  <p className="text-center text-sm text-faint py-12">
                    Select two contracts above to compare them.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

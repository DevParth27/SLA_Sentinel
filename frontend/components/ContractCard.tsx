import React from "react";
import { motion } from "framer-motion";
import { Contract } from "../lib/api";
import { useSettings, formatMoney, formatDate } from "../lib/settings";
import RiskBadge from "./RiskBadge";

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

const ACCENT: Record<Contract["status"], string> = {
  active: "bg-ok",
  "expiring-soon": "bg-warn",
  "high-risk": "bg-bad",
  expired: "bg-dim",
};

const PILL: Record<Contract["status"], string> = {
  active: "text-ok bg-ok/10 border border-ok/25",
  "expiring-soon": "text-warn bg-warn/10 border border-warn/25",
  "high-risk": "text-bad bg-bad/10 border border-bad/25",
  expired: "text-faint bg-white/5 border border-line",
};

const PILL_LABEL: Record<Contract["status"], string> = {
  active: "Active",
  "expiring-soon": "Expiring Soon",
  "high-risk": "High Risk",
  expired: "Expired",
};

export default function ContractCard({ contract, onClick }: ContractCardProps) {
  const settings = useSettings();
  const fee =
    contract.monthlyFee > 0 ? formatMoney(contract.monthlyFee, settings.currency) : "Transaction";
  const expiryStr = formatDate(contract.expiryDate, settings.dateFormat);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group relative bg-surface rounded-xl border border-line hover:border-accent/40 cursor-pointer overflow-hidden select-none transition-colors duration-200"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "radial-gradient(120% 80% at 50% -20%, rgba(91,141,239,0.10), transparent 60%)" }} />

      {/* Status accent bar */}
      <div className={`h-[2px] w-full ${ACCENT[contract.status]}`} />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-ink text-[14px] leading-snug mb-1 group-hover:text-accent-bright transition-colors duration-200 truncate">
              {contract.name}
            </h3>
            <p className="text-faint text-[11.5px] truncate">{contract.vendor || "Unknown vendor"}</p>
          </div>
          <RiskBadge score={contract.riskScore} size="sm" />
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-line-soft mb-4">
          <div>
            <p className="text-[9.5px] font-medium text-faint uppercase tracking-[0.15em] mb-1">
              Expires
            </p>
            <p className="text-[12px] font-medium text-sub font-mono tabular-nums">{expiryStr}</p>
          </div>
          <div>
            <p className="text-[9.5px] font-medium text-faint uppercase tracking-[0.15em] mb-1">
              Monthly
            </p>
            <p className="text-[12px] font-medium text-sub font-mono">{fee}</p>
          </div>
        </div>

        {/* Top flag */}
        {contract.flags[0] && (
          <div className="flex items-start gap-2 bg-warn/8 border border-warn/20 rounded-lg px-2.5 py-2 mb-4">
            <svg className="w-3.5 h-3.5 text-warn flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p className="text-[11.5px] text-warn/90 leading-tight line-clamp-2">{contract.flags[0]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md ${PILL[contract.status]}`}>
            {PILL_LABEL[contract.status]}
          </span>
          <span className="text-[11px] text-faint font-mono inline-flex items-center gap-1.5">
            {contract.flagCount} flag{contract.flagCount !== 1 ? "s" : ""}
            <svg className="w-3.5 h-3.5 text-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

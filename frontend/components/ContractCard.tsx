import React from "react";
import { motion } from "framer-motion";
import { Contract } from "../lib/api";
import RiskBadge from "./RiskBadge";

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

const ACCENT: Record<Contract["status"], string> = {
  active: "bg-emerald-500",
  "expiring-soon": "bg-amber-400",
  "high-risk": "bg-red-500",
  expired: "bg-gray-300",
};

const PILL: Record<Contract["status"], string> = {
  active: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/70",
  "expiring-soon": "text-amber-700 bg-amber-50 ring-1 ring-amber-200/70",
  "high-risk": "text-red-700 bg-red-50 ring-1 ring-red-200/70",
  expired: "text-gray-500 bg-gray-50 ring-1 ring-gray-200/70",
};

const PILL_LABEL: Record<Contract["status"], string> = {
  active: "Active",
  "expiring-soon": "Expiring Soon",
  "high-risk": "High Risk",
  expired: "Expired",
};

export default function ContractCard({ contract, onClick }: ContractCardProps) {
  const fee =
    contract.monthlyFee > 0
      ? `₹${contract.monthlyFee.toLocaleString("en-IN")}`
      : "Transaction-based";

  const expiry = new Date(contract.expiryDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: "0 12px 36px -8px rgba(15,23,42,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer overflow-hidden select-none group"
    >
      {/* Status accent bar */}
      <div className={`h-[3px] w-full ${ACCENT[contract.status]}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-[13.5px] leading-snug mb-0.5 group-hover:text-[#7C3AED] transition-colors duration-200">
              {contract.name}
            </h3>
            <p className="text-slate-400 text-[11.5px] truncate">{contract.vendor}</p>
          </div>
          <RiskBadge score={contract.riskScore} size="sm" />
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-50 mb-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              Expires
            </p>
            <p className="text-[12px] font-medium text-slate-700 tabular-nums">{expiry}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
              Monthly
            </p>
            <p className="text-[12px] font-medium text-slate-700">{fee}</p>
          </div>
        </div>

        {/* Top flag */}
        {contract.flags[0] && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mb-4">
            <svg
              className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-[11.5px] text-amber-700 leading-tight">{contract.flags[0]}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${PILL[contract.status]}`}>
            {PILL_LABEL[contract.status]}
          </span>
          <span className="text-[11px] text-slate-300">
            {contract.clauses.length} clauses
          </span>
        </div>
      </div>
    </motion.div>
  );
}

import React from "react";
import { motion } from "framer-motion";

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function config(score: number) {
  if (score >= 80)
    return {
      label: "Low Risk",
      dot: "bg-emerald-400",
      ring: "bg-emerald-400/20",
      wrap: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      pulse: false,
    };
  if (score >= 50)
    return {
      label: "Medium Risk",
      dot: "bg-amber-400",
      ring: "bg-amber-400/20",
      wrap: "bg-amber-50 text-amber-800 border-amber-200/80",
      pulse: false,
    };
  return {
    label: "High Risk",
    dot: "bg-red-500",
    ring: "bg-red-400/25",
    wrap: "bg-red-50 text-red-800 border-red-200/80",
    pulse: true,
  };
}

const SIZE = {
  sm: { outer: "gap-1.5 px-2.5 py-1", score: "text-xs font-bold", label: "text-xs", dot: "w-1.5 h-1.5", ring: "w-3 h-3" },
  md: { outer: "gap-2 px-3 py-1.5", score: "text-sm font-bold", label: "text-sm", dot: "w-2 h-2", ring: "w-3.5 h-3.5" },
  lg: { outer: "gap-2.5 px-4 py-2", score: "text-base font-bold", label: "text-sm", dot: "w-2.5 h-2.5", ring: "w-4 h-4" },
};

export default function RiskBadge({ score, size = "md" }: RiskBadgeProps) {
  const c = config(score);
  const s = SIZE[size];

  return (
    <span className={`inline-flex items-center rounded-full border whitespace-nowrap ${c.wrap} ${s.outer}`}>
      <span className={`relative flex items-center justify-center flex-shrink-0 ${s.ring}`}>
        <span className={`rounded-full ${c.dot} ${s.dot}`} />
        {c.pulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${c.ring}`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </span>
      <span className={`tabular-nums ${s.score}`}>{score}</span>
      <span className="text-current opacity-30 font-light">|</span>
      <span className={`font-medium ${s.label}`}>{c.label}</span>
    </span>
  );
}

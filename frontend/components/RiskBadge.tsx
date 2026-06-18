import React from "react";
import { motion } from "framer-motion";

interface RiskBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

function config(score: number) {
  if (score >= 80)
    return {
      label: "Low",
      dot: "bg-ok",
      ring: "bg-ok/25",
      wrap: "bg-ok/10 text-ok border-ok/25",
      pulse: false,
    };
  if (score >= 50)
    return {
      label: "Medium",
      dot: "bg-warn",
      ring: "bg-warn/25",
      wrap: "bg-warn/10 text-warn border-warn/25",
      pulse: false,
    };
  return {
    label: "High",
    dot: "bg-bad",
    ring: "bg-bad/30",
    wrap: "bg-bad/10 text-bad border-bad/30",
    pulse: true,
  };
}

const SIZE = {
  sm: { outer: "gap-1.5 px-2 py-0.5", score: "text-[11px] font-semibold", label: "text-[11px]", dot: "w-1.5 h-1.5", ring: "w-3 h-3" },
  md: { outer: "gap-2 px-2.5 py-1", score: "text-[13px] font-semibold", label: "text-[12px]", dot: "w-2 h-2", ring: "w-3.5 h-3.5" },
  lg: { outer: "gap-2.5 px-3 py-1.5", score: "text-[15px] font-semibold", label: "text-[13px]", dot: "w-2.5 h-2.5", ring: "w-4 h-4" },
};

export default function RiskBadge({ score, size = "md" }: RiskBadgeProps) {
  const c = config(score);
  const s = SIZE[size];

  return (
    <span className={`inline-flex items-center rounded-md border whitespace-nowrap font-mono ${c.wrap} ${s.outer}`}>
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
      <span className="text-current opacity-25">·</span>
      <span className={`font-medium ${s.label}`}>{c.label}</span>
    </span>
  );
}

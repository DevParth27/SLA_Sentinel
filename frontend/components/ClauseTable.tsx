import React from "react";
import { Clause } from "../lib/api";

interface ClauseTableProps {
  clauses: Clause[];
  compareWith?: Clause[];
}

const TYPE_DOT: Record<string, string> = {
  Payment: "bg-blue-400",
  SLA: "bg-violet-400",
  "Auto-renewal": "bg-amber-400",
  Liability: "bg-red-400",
  Termination: "bg-slate-400",
  Confidentiality: "bg-emerald-400",
};

export default function ClauseTable({ clauses, compareWith }: ClauseTableProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-100">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest w-[30%]">
              Type
            </th>
            <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Summary
            </th>
            {compareWith && (
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                vs. Other
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {clauses.map((clause, i) => {
            const other = compareWith?.find((c) => c.type === clause.type);
            const isDiff =
              compareWith !== undefined &&
              other !== undefined &&
              other.summary !== clause.summary;
            const isEven = i % 2 === 0;

            return (
              <tr
                key={i}
                className={`border-b border-slate-50 last:border-0 transition-colors ${
                  isDiff
                    ? "bg-amber-50/70"
                    : isEven
                    ? "bg-white"
                    : "bg-slate-50/40"
                }`}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        TYPE_DOT[clause.type] ?? "bg-slate-300"
                      }`}
                    />
                    <span className="font-semibold text-slate-800 text-xs">
                      {clause.type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs leading-relaxed">
                  {clause.summary}
                </td>
                {compareWith && (
                  <td className="px-4 py-3.5 text-xs">
                    {other ? (
                      isDiff ? (
                        <span className="text-amber-700 font-medium">
                          {other.summary}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[10px] font-semibold uppercase tracking-wide">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          Identical
                        </span>
                      )
                    ) : (
                      <span className="text-slate-300 text-[10px] italic">Not found</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

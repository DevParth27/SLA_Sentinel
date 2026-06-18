import React from "react";
import { Clause } from "../lib/api";

interface ClauseTableProps {
  clauses: Clause[];
  compareWith?: Clause[];
}

const TYPE_DOT: Record<string, string> = {
  Payment: "bg-info",
  SLA: "bg-accent",
  "Auto-renewal": "bg-warn",
  Liability: "bg-bad",
  Termination: "bg-faint",
  Confidentiality: "bg-ok",
};

// The AI pipeline stores some clause values as JSON (arrays of strings, arrays
// of {description, amount_or_rate} objects, or key/value objects). Turn snake_case
// field keys into readable labels.
function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// If a stored summary is a JSON array/object, parse it; otherwise return as-is.
function tryParse(value: string): any {
  if (typeof value !== "string") return value;
  const t = value.trim();
  if (!t.startsWith("[") && !t.startsWith("{")) return value;
  try {
    return JSON.parse(t);
  } catch {
    return value;
  }
}

// Renders a clause value: plain text stays text; arrays become bullet lists;
// objects (and objects inside arrays) become readable "Label: value" lines.
function FormattedValue({ value }: { value: string }) {
  const parsed = tryParse(value);

  if (parsed === null || typeof parsed !== "object") {
    return <span>{String(parsed ?? value)}</span>;
  }

  if (Array.isArray(parsed)) {
    return (
      <ul className="space-y-1.5">
        {parsed.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-accent/60" />
            <span>
              {item && typeof item === "object" ? (
                <span className="space-x-1.5">
                  {Object.entries(item).map(([k, v]) => (
                    <span key={k}>
                      <span className="font-medium text-sub">{prettifyKey(k)}:</span>{" "}
                      {String(v)}
                    </span>
                  ))}
                </span>
              ) : (
                String(item)
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-1">
      {Object.entries(parsed).map(([k, v]) => (
        <div key={k}>
          <span className="font-medium text-sub">{prettifyKey(k)}:</span>{" "}
          {String(v)}
        </div>
      ))}
    </div>
  );
}

export default function ClauseTable({ clauses, compareWith }: ClauseTableProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-line">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-raised border-b border-line">
            <th className="text-left px-4 py-3 text-[10px] font-medium text-faint uppercase tracking-[0.15em] w-[30%] font-mono">
              Type
            </th>
            <th className="text-left px-4 py-3 text-[10px] font-medium text-faint uppercase tracking-[0.15em] font-mono">
              Summary
            </th>
            {compareWith && (
              <th className="text-left px-4 py-3 text-[10px] font-medium text-faint uppercase tracking-[0.15em] font-mono">
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
                className={`border-b border-line-soft last:border-0 transition-colors ${
                  isDiff ? "bg-warn/8" : isEven ? "bg-surface" : "bg-raised/40"
                }`}
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        TYPE_DOT[clause.type] ?? "bg-dim"
                      }`}
                    />
                    <span className="font-medium text-ink text-xs">
                      {prettifyKey(clause.type)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sub text-xs leading-relaxed align-top">
                  <FormattedValue value={clause.summary} />
                </td>
                {compareWith && (
                  <td className="px-4 py-3.5 text-xs align-top">
                    {other ? (
                      isDiff ? (
                        <span className="text-warn">
                          <FormattedValue value={other.summary} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-ok text-[10px] font-semibold uppercase tracking-wide font-mono">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Identical
                        </span>
                      )
                    ) : (
                      <span className="text-dim text-[10px] italic">Not found</span>
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

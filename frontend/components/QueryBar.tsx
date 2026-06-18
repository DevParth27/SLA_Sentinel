import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { askQuery } from "../lib/api";

const CHIPS = [
  "What renews next quarter?",
  "Which contracts have low liability caps?",
  "Show high risk contracts",
  "What are my payment obligations this month?",
];

export default function QueryBar() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [display, setDisplay] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestId = useRef(0);

  const search = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (timer.current) clearInterval(timer.current);
    const reqId = ++requestId.current;
    setLoading(true);
    setAnswer("");
    setDisplay("");
    setTyping(false);

    try {
      const result = await askQuery(trimmed);
      if (reqId !== requestId.current) return; // a newer query superseded this one
      setAnswer(result || "No answer was returned for this query.");
    } catch {
      if (reqId !== requestId.current) return;
      setAnswer("Couldn’t reach the AI service. Make sure the backend is running and try again.");
    } finally {
      if (reqId === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!answer) return;
    if (timer.current) clearInterval(timer.current);
    setDisplay("");
    setTyping(true);
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      setDisplay(answer.slice(0, i));
      if (i >= answer.length) {
        setTyping(false);
        clearInterval(timer.current!);
      }
    }, 12);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [answer]);

  return (
    <div>
      {/* Input */}
      <div className={`relative flex items-center rounded-xl border transition-all duration-200 bg-base ${isFocused ? "border-accent/60 shadow-glow-sm" : "border-line"}`}>
        <div className="pl-3.5 flex-shrink-0">
          <svg
            className={`w-4 h-4 transition-colors ${isFocused ? "text-accent" : "text-faint"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") search(query);
          }}
          placeholder='Ask anything — "What renews next quarter?"'
          className="flex-1 pl-2.5 pr-3 py-3.5 bg-transparent text-[13.5px] text-ink placeholder:text-faint focus:outline-none"
        />
        <AnimatePresence>
          {query.trim() && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => search(query)}
              className="mr-2 px-3.5 py-1.5 bg-accent hover:bg-accent-bright text-base text-[12px] font-semibold rounded-lg transition-colors"
            >
              Ask
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              search(chip);
            }}
            className="text-[11.5px] px-3 py-1.5 rounded-md border border-line text-sub hover:border-accent/40 hover:text-accent-bright hover:bg-accent/5 transition-all duration-150"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Answer panel */}
      <AnimatePresence>
        {(loading || display) && (
          <motion.div
            key={loading ? "loading" : "answer"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-xl border border-accent/25 overflow-hidden bg-base"
          >
            <div className="bg-accent/10 border-b border-accent/20 px-4 py-2.5 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-[12px] font-semibold text-accent-bright font-mono tracking-tight">ContractIQ AI</span>
            </div>
            <div className="px-4 py-3.5">
              {loading ? (
                <div className="flex items-center gap-2">
                  {[0, 0.2, 0.4].map((d) => (
                    <motion.span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[13.5px] text-sub leading-relaxed whitespace-pre-wrap">
                  {display}
                  {typing && (
                    <motion.span
                      className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 align-middle"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                  )}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

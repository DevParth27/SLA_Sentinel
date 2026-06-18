import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import { uploadContract } from "../lib/api";

type Stage = "idle" | "uploading" | "done" | "error";

const STEPS = ["Reading PDF", "Extracting clauses", "Scoring risks", "Finalizing"];

export default function Upload() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (stage !== "uploading") return;
    setStepIndex(0);
    const t = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 500);
    return () => clearInterval(t);
  }, [stage]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("Only PDF files are accepted.");
        setStage("error");
        return;
      }
      setFileName(file.name);
      setErrorMsg("");
      setStage("uploading");
      try {
        await uploadContract(file);
        setStage("done");
        setTimeout(() => router.push("/dashboard"), 1600);
      } catch (err: any) {
        setErrorMsg(err?.message || "Upload failed. Please try again.");
        setStage("error");
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <>
      <Head>
        <title>Upload Contract — ContractIQ</title>
      </Head>

      <div className="min-h-screen bg-base text-ink font-sans flex flex-col relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none bg-grid opacity-50" />
        <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full pointer-events-none glow-drift"
          style={{ background: "radial-gradient(circle, rgba(91,141,239,0.10), transparent 70%)" }} />

        {/* Nav */}
        <nav className="relative bg-base/80 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 bg-accent-grad rounded-md flex items-center justify-center shadow-glow-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-display font-bold text-ink text-[15px] tracking-tight">ContractIQ</span>
          </button>
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

        <div className="relative flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-[480px]">
            <div className="mb-10">
              <h1 className="font-display text-3xl font-bold text-ink tracking-tight mb-2">
                Upload a contract
              </h1>
              <p className="text-faint text-sm font-mono">
                PDF · Max 20 MB · Results in under 30 seconds
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* IDLE */}
              {stage === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <div
                    className={`relative rounded-2xl p-14 text-center transition-all duration-200 ${
                      dragging ? "bg-accent/8 scale-[1.01]" : "bg-surface hover:bg-raised"
                    }`}
                    style={{
                      border: dragging ? "2px solid #5B8DEF" : "2px dashed #23282F",
                      boxShadow: dragging ? "0 0 30px -6px rgba(91,141,239,0.4)" : "none",
                    }}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors ${dragging ? "bg-accent/20" : "bg-raised"}`}>
                      <svg className={`w-6 h-6 transition-colors ${dragging ? "text-accent" : "text-faint"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>

                    <p className="font-display font-semibold text-ink mb-1.5">
                      {dragging ? "Drop to upload" : "Drop your PDF here"}
                    </p>
                    <p className="text-sm text-faint mb-7">or click to browse</p>

                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-base bg-accent hover:bg-accent-bright px-5 py-2.5 rounded-xl transition-colors shadow-glow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Browse Files
                      </span>
                      <input type="file" accept=".pdf" onChange={handleInputChange} className="sr-only" />
                    </label>
                  </div>

                  <p className="text-center text-xs text-dim mt-5 font-mono">
                    Files are processed securely and never stored permanently
                  </p>
                </motion.div>
              )}

              {/* UPLOADING */}
              {stage === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-surface rounded-2xl border border-line p-8"
                >
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-line">
                    <div className="w-10 h-10 bg-bad/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-bad" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{fileName}</p>
                      <p className="text-xs text-faint font-mono">PDF document</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          i < stepIndex ? "bg-ok" : i === stepIndex ? "bg-accent" : "bg-raised"
                        }`}>
                          {i < stepIndex ? (
                            <svg className="w-3 h-3 text-base" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : i === stepIndex ? (
                            <motion.span className="w-2 h-2 rounded-full bg-base" animate={{ scale: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
                          ) : null}
                        </div>
                        <span className={`text-sm transition-colors ${
                          i < stepIndex ? "text-ok font-medium" : i === stepIndex ? "text-ink font-semibold" : "text-dim"
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full h-1.5 bg-raised rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent-grad"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
              )}

              {/* DONE */}
              {stage === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="bg-surface rounded-2xl border border-ok/25 p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 bg-ok/10 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  >
                    <svg className="w-8 h-8 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <p className="font-display font-bold text-ink text-lg mb-1">Contract uploaded</p>
                  <p className="text-sm text-faint">
                    AI analysis is running — redirecting to dashboard...
                  </p>
                </motion.div>
              )}

              {/* ERROR */}
              {stage === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="bg-surface rounded-2xl border border-bad/25 p-10 text-center"
                >
                  <div className="w-16 h-16 bg-bad/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-bad" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="font-display font-bold text-ink text-lg mb-1">Upload failed</p>
                  <p className="text-sm text-faint mb-6">{errorMsg}</p>
                  <button
                    onClick={() => {
                      setErrorMsg("");
                      setStage("idle");
                    }}
                    className="text-sm font-semibold text-base bg-accent hover:bg-accent-bright px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import Head from "next/head";
import { uploadToS3 } from "../lib/s3upload";

type Stage = "idle" | "uploading" | "done";

const STEPS = ["Reading PDF", "Extracting clauses", "Scoring risks", "Finalizing"];

export default function Upload() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

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
        alert("Only PDF files are accepted.");
        return;
      }
      setFileName(file.name);
      setStage("uploading");
      await uploadToS3(file);
      setStage("done");
      setTimeout(() => router.push("/dashboard"), 1600);
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
        <style>{`
          @keyframes dash-move {
            to { stroke-dashoffset: -20; }
          }
          .dash-animated {
            stroke-dasharray: 8 6;
            animation: dash-move 0.6s linear infinite;
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Nav */}
        <nav className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-6 h-6 bg-[#7C3AED] rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-[15px] tracking-tight">ContractIQ</span>
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-[480px]">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Upload a contract
              </h1>
              <p className="text-slate-400 text-sm">
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
                      dragging
                        ? "bg-violet-50 scale-[1.01]"
                        : "bg-white hover:bg-slate-50/60"
                    }`}
                    style={{
                      border: dragging
                        ? "2px solid #7C3AED"
                        : "2px dashed #e2e8f0",
                      boxShadow: dragging
                        ? "0 0 0 4px rgba(124,58,237,0.08)"
                        : "none",
                    }}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors ${
                        dragging ? "bg-violet-100" : "bg-slate-100"
                      }`}
                    >
                      <svg
                        className={`w-6 h-6 transition-colors ${dragging ? "text-violet-600" : "text-slate-500"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>

                    <p className="font-semibold text-slate-800 mb-1.5">
                      {dragging ? "Drop to upload" : "Drop your PDF here"}
                    </p>
                    <p className="text-sm text-slate-400 mb-7">or click to browse</p>

                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #6d28d9)", boxShadow: "0 2px 12px rgba(124,58,237,0.3)" }}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Browse Files
                      </span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <p className="text-center text-xs text-slate-300 mt-5">
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
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
                >
                  {/* File info */}
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{fileName}</p>
                      <p className="text-xs text-slate-400">PDF document</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-3 mb-8">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          i < stepIndex ? "bg-emerald-500" : i === stepIndex ? "bg-violet-600" : "bg-slate-100"
                        }`}>
                          {i < stepIndex ? (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          ) : i === stepIndex ? (
                            <motion.span
                              className="w-2 h-2 rounded-full bg-white"
                              animate={{ scale: [0.6, 1, 0.6] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          ) : null}
                        </div>
                        <span className={`text-sm transition-colors ${
                          i < stepIndex ? "text-emerald-600 font-medium" : i === stepIndex ? "text-slate-800 font-semibold" : "text-slate-300"
                        }`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #7C3AED, #a78bfa)" }}
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
                  className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  >
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </motion.div>
                  <p className="font-bold text-slate-900 text-lg mb-1">Contract processed</p>
                  <p className="text-sm text-slate-400">
                    Redirecting to dashboard...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

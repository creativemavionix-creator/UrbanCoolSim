"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { FileText, Download, Printer, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function ReportsPage() {
  const [reportMd, setReportMd] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const res = await api.generateReport();
      setReportMd(res.markdown_content);
      setReportId(res.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Executive Decision Reports" 
        subtitle="Automated Infrastructure Recommendations & PDF Export" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-8"
      >
        {/* Header & Generation Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-normal tracking-tight text-white">
              Technical Decision-Support Reports
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl">
              Synthesizes baseline thermodynamics, NSGA-II Pareto portfolio selections, capital expenditure budgets, 
              water demand quotas, and satellite ground-truth validation into a publication-ready PDF document.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-obsidian-base font-semibold text-xs rounded-lg hover:bg-sand-100 transition-colors flex items-center gap-2 shadow-subtle shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Generating Report..." : "Generate Technical Report"}</span>
          </motion.button>
        </div>

        {/* Generated Report Viewer */}
        {reportMd ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
            className="bg-obsidian-subtle border border-obsidian-border rounded-xl p-8 space-y-6"
          >
            <div className="flex flex-wrap justify-between items-center border-b border-obsidian-border pb-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-botanical-light animate-pulse" />
                <span className="text-xs font-mono text-white">
                  UrbanCoolSim Executive Report #{reportId?.slice(0, 8) || "CP2026"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {reportId && (
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    href={`/api/v1/reports/${reportId}/pdf`}
                    download={`UrbanCoolSim_Executive_Report_${reportId.slice(0, 8)}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-botanical hover:bg-botanical-dark text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-subtle"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Executive PDF</span>
                  </motion.a>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-obsidian-surface hover:bg-obsidian-hover border border-obsidian-border text-obsidian-textSecondary hover:text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Formatted Markdown Content Container */}
            <div className="bg-obsidian-base p-6 rounded-lg border border-obsidian-border text-xs text-obsidian-textSecondary font-mono leading-relaxed whitespace-pre-wrap max-h-[580px] overflow-y-auto">
              {reportMd}
            </div>
          </motion.div>
        ) : (
          <div className="p-16 text-center border border-dashed border-obsidian-border rounded-xl space-y-3">
            <FileText className="w-8 h-8 text-obsidian-textMuted mx-auto" />
            <h3 className="text-sm font-medium text-white">No Report Generated Yet</h3>
            <p className="text-xs text-obsidian-textMuted max-w-sm mx-auto">
              Click &ldquo;Generate Technical Report&rdquo; to build an executive decision-support synthesis with full mathematical derivations and downloadable PDF export.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

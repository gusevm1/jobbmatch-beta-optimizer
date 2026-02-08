"use client";

import { motion } from "framer-motion";
import { GlassButton } from "@/components/ui/glass-button";
import type { JobListing } from "@/types";

interface JobDetailViewProps {
  job: JobListing;
  keywords: string[];
  onOptimize: (job: JobListing) => void;
  onBack: () => void;
}

function MatchScore({ job, keywords }: { job: JobListing; keywords: string[] }) {
  const score = 85;
  const label = "Great match";

  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-foreground/8"
          />
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${score * 0.975} 100`}
            className="text-foreground/70"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-foreground">
          {score}%
        </span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function JobDetailView({ job, keywords, onOptimize, onBack }: JobDetailViewProps) {
  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to jobs
      </button>

      {/* Main card */}
      <div className="glass-workspace-panel">
        {/* Header */}
        <div className="px-7 py-7 md:px-9 md:py-8">
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-tight">
                {job.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h.01"/><path d="M16 6h.01"/>
                    <path d="M12 6h.01"/><path d="M12 10h.01"/>
                    <path d="M12 14h.01"/><path d="M16 10h.01"/>
                    <path d="M16 14h.01"/><path d="M8 10h.01"/>
                    <path d="M8 14h.01"/>
                  </svg>
                  {job.company}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {job.type}
                </span>
              </div>
            </div>

            {/* Match score */}
            <div className="hidden sm:block">
              <MatchScore job={job} keywords={keywords} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3">
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-btn-view-posting">
                View Posting
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
            <GlassButton
              size="default"
              className="glass-button-signin"
              onClick={() => onOptimize(job)}
            >
              Optimize CV
            </GlassButton>
          </div>
        </div>

        {/* Full description */}
        <div className="border-t border-foreground/6 px-7 py-7 md:px-9 md:py-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full bg-foreground/70" />
            <h3 className="text-base font-semibold text-foreground">About the position</h3>
          </div>

          <div className="text-sm leading-relaxed text-muted-foreground space-y-4">
            <p>{job.description}</p>

            {job.fullDescription?.map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold text-foreground mt-6 mb-2">{section.heading}</h4>
                {section.bullets ? (
                  <ul className="list-disc list-inside space-y-1.5 ml-1">
                    {section.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{section.text}</p>
                )}
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div className="mt-8 flex flex-wrap gap-1.5">
            {job.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="mt-8 flex items-center gap-3 pt-5 border-t border-foreground/6">
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-btn-view-posting">
                View Posting
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
            <GlassButton
              size="default"
              className="glass-button-signin"
              onClick={() => onOptimize(job)}
            >
              Optimize CV
            </GlassButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

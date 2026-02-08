"use client";

import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import type { JobListing } from "@/types";

interface JobCardProps {
  job: JobListing;
  onOptimize: (job: JobListing) => void;
}

export function JobCard({ job, onOptimize }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-foreground/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company}
          </p>
        </div>
        {job.isDemo && (
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Demo
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          {job.location}
        </span>
        <span>&middot;</span>
        <span>{job.type}</span>
      </div>

      {/* Keywords */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.keywords.slice(0, expanded ? undefined : 5).map((kw) => (
          <span
            key={kw}
            className="rounded-full bg-foreground/5 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
          >
            {kw}
          </span>
        ))}
        {!expanded && job.keywords.length > 5 && (
          <span className="rounded-full px-2.5 py-1 font-mono text-[11px] text-muted-foreground/50">
            +{job.keywords.length - 5} more
          </span>
        )}
      </div>

      {/* Expandable description */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <span
          className={`inline-block transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
        {expanded ? "Hide details" : "Read more"}
      </button>

      {expanded && (
        <div className="mt-3 text-sm leading-relaxed text-muted-foreground animate-fade-in">
          {job.description}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border/50">
        <GlassButton size="sm" onClick={() => onOptimize(job)}>
          Optimize CV
        </GlassButton>
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            <GlassButton size="sm">
              View Posting
            </GlassButton>
          </a>
        )}
      </div>
    </div>
  );
}

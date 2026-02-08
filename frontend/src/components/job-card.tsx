"use client";

import { GlassButton } from "@/components/ui/glass-button";
import type { JobListing } from "@/types";

interface JobCardProps {
  job: JobListing;
  keywords: string[];
  onOptimize: (job: JobListing) => void;
  onSelect: (job: JobListing) => void;
}

function MatchScore({ job, keywords }: { job: JobListing; keywords: string[] }) {
  const score = 85;
  const label = "Great match";

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="relative w-16 h-16">
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
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
          {score}%
        </span>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function JobCard({ job, keywords, onOptimize, onSelect }: JobCardProps) {
  return (
    <div
      className="glass-workspace-panel w-full cursor-pointer transition-all duration-300 hover:border-foreground/12"
      onClick={() => onSelect(job)}
    >
      <div className="px-7 py-6 md:px-9 md:py-7">
        <div className="flex gap-6">
          {/* Left: content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-lg md:text-xl font-semibold text-foreground leading-tight">
              {job.title}
            </h3>

            {/* Meta row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
            </div>

            {/* Description preview */}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {job.description}
            </p>

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-3">
              {job.url && (
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="job-btn-view-posting"
                >
                  View Posting
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              )}
              <div onClick={(e) => e.stopPropagation()}>
                <GlassButton
                  size="sm"
                  className="glass-button-signin"
                  onClick={() => onOptimize(job)}
                >
                  Optimize CV
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Right: match score */}
          <div className="hidden sm:flex items-center">
            <MatchScore job={job} keywords={keywords} />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGroup, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { JobGrid } from "@/components/job-grid";
import { JobDetailView } from "@/components/job-detail-view";
import { useAppState } from "@/lib/app-state";
import type { JobListing } from "@/types";

export default function BetaDashboardPage() {
  const router = useRouter();
  const { keywords, cvId, setSelectedJob } = useAppState();
  const [detailJob, setDetailJob] = useState<JobListing | null>(null);

  const handleOptimize = (job: JobListing) => {
    setSelectedJob(job);
    router.push("/beta-optimize");
  };

  return (
    <AppShell
      heading={detailJob ? null : "Jobs for you"}
      subtext={detailJob ? null : "Pick a job to optimize your CV for"}
      maxWidth={detailJob ? "max-w-3xl" : "max-w-2xl"}
    >
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {detailJob ? (
            <JobDetailView
              key="detail"
              job={detailJob}
              keywords={keywords}
              onOptimize={handleOptimize}
              onBack={() => setDetailJob(null)}
            />
          ) : (
            <JobGrid
              key="grid"
              keywords={keywords}
              onOptimize={handleOptimize}
              onSelectJob={(job) => {
                setDetailJob(job);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </AppShell>
  );
}

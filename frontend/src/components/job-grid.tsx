"use client";

import { JobCard } from "@/components/job-card";
import type { JobListing } from "@/types";

interface JobGridProps {
  keywords: string;
  onOptimize: (job: JobListing) => void;
}

const JOBS: JobListing[] = [
  {
    id: "hm-data-engineering",
    title: "Summer Internship - Data Engineering",
    company: "H&M Group",
    location: "Stockholm, Sweden",
    type: "Full-time internship (11 weeks)",
    description:
      "As a Data Engineering Intern at H&M, you will get the opportunity to spend 11 weeks learning about our business and different functions while getting real-life experience working on current projects. You will work next to the AI, Analytics, & Data Tech Center who will play a key role in developing your skills. This is your chance to launch a stellar career and help us transform the fashion world.",
    keywords: ["data engineering", "Python", "GCP", "SQL", "CI/CD", "Java", "agile", "cloud"],
    url: "https://career.hmgroup.com",
  },
  {
    id: "demo-spotify-ml",
    title: "Machine Learning Engineer Intern",
    company: "Spotify",
    location: "Stockholm, Sweden",
    type: "Summer internship (10 weeks)",
    description:
      "Join Spotify's ML team to work on recommendation systems and audio features. You'll build and deploy models that impact millions of users, working with large-scale data pipelines and modern ML infrastructure.",
    keywords: ["machine learning", "Python", "TensorFlow", "data pipelines", "recommendations", "cloud"],
    isDemo: true,
  },
  {
    id: "demo-klarna-backend",
    title: "Backend Developer Intern",
    company: "Klarna",
    location: "Stockholm, Sweden",
    type: "Summer internship (12 weeks)",
    description:
      "Work on Klarna's core payment platform, building high-throughput microservices that process millions of transactions. You'll gain experience with event-driven architecture, distributed systems, and fintech engineering.",
    keywords: ["Java", "microservices", "cloud", "API design", "event-driven", "fintech"],
    isDemo: true,
  },
  {
    id: "demo-ericsson-cloud",
    title: "Cloud Infrastructure Intern",
    company: "Ericsson",
    location: "Kista, Sweden",
    type: "Full-time internship (10 weeks)",
    description:
      "Join Ericsson's cloud team to work on Kubernetes-based 5G infrastructure. You'll help automate deployment pipelines, monitor system performance, and contribute to next-generation telecom cloud platforms.",
    keywords: ["Kubernetes", "cloud", "CI/CD", "Python", "5G", "infrastructure", "DevOps"],
    isDemo: true,
  },
  {
    id: "demo-king-data",
    title: "Data Analyst Intern",
    company: "King (Activision Blizzard)",
    location: "Stockholm, Sweden",
    type: "Summer internship (8 weeks)",
    description:
      "Analyze player behavior and game metrics for Candy Crush and other top titles. You'll build dashboards, run A/B test analyses, and present insights to product teams that shape the gaming experience for millions.",
    keywords: ["SQL", "Python", "data analysis", "A/B testing", "dashboards", "gaming"],
    isDemo: true,
  },
  {
    id: "demo-volvo-ai",
    title: "AI Research Intern - Autonomous Driving",
    company: "Volvo Cars",
    location: "Gothenburg, Sweden",
    type: "Full-time internship (12 weeks)",
    description:
      "Work on perception and planning models for Volvo's autonomous driving platform. You'll research and implement computer vision algorithms, test in simulation environments, and contribute to safety-critical AI systems.",
    keywords: ["computer vision", "Python", "deep learning", "autonomous driving", "PyTorch", "simulation"],
    isDemo: true,
  },
];

export function JobGrid({ keywords, onOptimize }: JobGridProps) {
  // Simple keyword matching for demo — real job always first
  const lowerKeywords = keywords.toLowerCase();
  const scored = JOBS.map((job) => {
    const matchCount = job.keywords.filter((kw) =>
      lowerKeywords.includes(kw.toLowerCase())
    ).length;
    return { job, score: job.isDemo ? matchCount : matchCount + 100 };
  });
  scored.sort((a, b) => b.score - a.score);

  return (
    <div className="w-full">
      <p className="mb-6 font-mono text-xs text-muted-foreground">
        {scored.length} jobs found for &ldquo;{keywords}&rdquo;
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scored.map(({ job }) => (
          <JobCard key={job.id} job={job} onOptimize={onOptimize} />
        ))}
      </div>
    </div>
  );
}

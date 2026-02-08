"use client";

import { JobCard } from "@/components/job-card";
import type { JobListing } from "@/types";

interface JobGridProps {
  keywords: string[];
  onOptimize: (job: JobListing) => void;
  onSelectJob: (job: JobListing) => void;
}

const JOBS: JobListing[] = [
  {
    id: "hm-data-engineering",
    title: "H&M Summer Internship - Data Engineering",
    company: "H & M Hennes & Mauritz Gbc AB",
    location: "Stockholm, Sweden",
    type: "Full-time internship (11 weeks)",
    description:
      "Curious about what it's like to see the world of Data Engineering at H&M? Are you eager to get hands-on experience and turn your theoretical knowledge into practical skills. If you are intrigued by how the world's largest fashion brand operates, then this opportunity is for you! Level up your learning journey and gain those essential skills that will benefit your future career.",
    fullDescription: [
      {
        heading: "What you'll be doing",
        bullets: [
          "Work on real data engineering projects within H&M's AI, Analytics, & Data Tech Center",
          "Build and maintain data pipelines using Python, SQL, and cloud technologies (GCP)",
          "Collaborate with cross-functional teams on current business challenges",
          "Participate in agile development processes and CI/CD workflows",
          "Connect with interns from other programs to explore the versatility of the business",
        ],
      },
      {
        heading: "What we're looking for",
        bullets: [
          "Currently pursuing a degree in Computer Science, Data Engineering, or a related field",
          "Experience with Python and SQL",
          "Interest in cloud platforms (GCP preferred) and data infrastructure",
          "Familiarity with version control (Git) and CI/CD practices",
          "Strong problem-solving skills and a collaborative mindset",
        ],
      },
      {
        heading: "Benefits",
        text: "This is a paid internship program, meaning you will work full-time and receive a market-based salary. Other H&M Group benefits will be shared later in the process. You don't have to live in Sweden already, we welcome applications from all parts of the world and offer relocation support if needed.",
      },
      {
        heading: "Application & Timeline",
        text: "The last day to apply is 31st January. Send us your application in English including a resume and proof of education. If successful, you will be invited to a one-day assessment center including a behavioral interview and a case & competence interview.",
      },
    ],
    keywords: ["data engineering", "Python", "GCP", "SQL", "CI/CD", "Java", "agile", "cloud"],
    url: "https://jobs.smartrecruiters.com/HMGroup/744000101569691-h-m-summer-internship-data-engineering-",
  },
];

export { JOBS };

export function JobGrid({ keywords, onOptimize, onSelectJob }: JobGridProps) {
  const keywordsDisplay = keywords.map((kw) => `"${kw}"`).join(", ");

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="mb-6 font-mono text-xs text-muted-foreground">
        {JOBS.length} job found for {keywordsDisplay}
      </p>
      <div className="flex flex-col gap-4">
        {JOBS.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            keywords={keywords}
            onOptimize={onOptimize}
            onSelect={onSelectJob}
          />
        ))}
      </div>
    </div>
  );
}

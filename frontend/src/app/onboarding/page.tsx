"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UploadKeywordsView } from "@/components/upload-keywords-view";
import { GlassButton } from "@/components/ui/glass-button";
import { useAppState } from "@/lib/app-state";

export default function OnboardingPage() {
  const router = useRouter();
  const { cvId, setCvId, setKeywords, setError } = useAppState();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);

  return (
    <AppShell
      heading="Get started"
      subtext="Upload your CV and find matching positions"
    >
      {error ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-sm text-destructive">{error}</p>
          <GlassButton size="default" onClick={() => setLocalError(null)}>
            Try Again
          </GlassButton>
        </div>
      ) : (
        <UploadKeywordsView
          cvId={cvId}
          isUploading={isUploading}
          onUploadStart={() => {
            setLocalError(null);
            setIsUploading(true);
          }}
          onUploaded={(id) => {
            setCvId(id);
            setIsUploading(false);
          }}
          onSearch={(kws) => {
            setKeywords(kws);
            router.push("/beta-dashboard");
          }}
          onError={(err) => {
            setLocalError(err);
            setError(err);
            setIsUploading(false);
          }}
          onResetUpload={() => {
            setCvId(null);
          }}
        />
      )}
    </AppShell>
  );
}

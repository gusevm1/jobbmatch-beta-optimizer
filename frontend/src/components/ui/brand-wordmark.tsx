import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  className?: string;
}

export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "brand-wordmark",
        className
      )}
    >
      <span className="brand-jobb">Jobb</span>
      <span className="brand-match">Match</span>
    </span>
  );
}

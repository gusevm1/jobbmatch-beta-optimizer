import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  className?: string;
  variant?: "default" | "hero";
}

export function BrandWordmark({ className, variant = "default" }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        "brand-wordmark",
        variant === "hero" && "brand-wordmark-hero",
        className
      )}
    >
      <span className="brand-jobb">Jobb</span>
      <span className="brand-match">Match</span>
    </span>
  );
}

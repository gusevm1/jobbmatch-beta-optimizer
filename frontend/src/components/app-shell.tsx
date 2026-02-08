"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FloatingPaths } from "@/components/ui/background-paths";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppState } from "@/lib/app-state";

interface AppShellProps {
  children: React.ReactNode;
  maxWidth?: string;
  heading?: string | null;
  subtext?: string | null;
}

export function AppShell({ children, maxWidth = "max-w-2xl", heading, subtext }: AppShellProps) {
  const router = useRouter();
  const { reset } = useAppState();

  const [linesVisible, setLinesVisible] = useState(false);

  useEffect(() => {
    // Small delay so the transition is visible after mount
    const t = requestAnimationFrame(() => setLinesVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleBackToHero = () => {
    reset();
    router.push("/login");
  };

  return (
    <div>
      {/* Floating lines background — fades in on page load */}
      <div
        className={`fixed inset-0 z-[1] pointer-events-none transition-opacity duration-[5000ms] ease-in ${
          linesVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute -inset-x-0 top-[-10%] bottom-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border/40">
        <nav className="flex items-center justify-between px-5 md:px-10 h-16">
          <button onClick={handleBackToHero} className="cursor-pointer">
            <BrandWordmark />
          </button>
          <ThemeToggle />
        </nav>
      </header>

      {/* Page content */}
      <section className="relative z-10 min-h-screen px-5 md:px-10 pt-24 pb-16">
        <div className={`mx-auto transition-all duration-500 ${maxWidth}`}>
          {heading && (
            <div className="mb-12 text-center">
              <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
                {heading}
              </h2>
              {subtext && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {subtext}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </section>
    </div>
  );
}

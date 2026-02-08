"use client";

import { useRouter } from "next/navigation";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { GlassButton } from "@/components/ui/glass-button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();

  const handleDiscover = () => {
    router.push("/onboarding");
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border/40">
        <nav className="flex items-center justify-between px-5 md:px-10 h-16">
          <BrandWordmark />
          <ThemeToggle />
        </nav>
      </header>

      <BackgroundPaths>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 w-full items-center">
          {/* Left column — heading */}
          <div className="opacity-0 animate-fade-in-up">
            <h1 className="hero-heading-split text-foreground">
              Find your{" "}
              <span className="font-bold">dream job</span>{" "}
              faster with AI
            </h1>
            <p className="mt-5 max-w-md text-muted-foreground text-base md:text-lg leading-relaxed opacity-0 animate-fade-in-up animate-delay-200">
              Upload your CV, match with relevant positions, and let AI tailor your application to stand out.
            </p>
          </div>

          {/* Right column — mock sign-in panel */}
          <div className="flex justify-center md:justify-end opacity-0 animate-fade-in-up animate-delay-400">
            <div className="hero-glass-panel w-full max-w-sm p-8 flex flex-col">
              <h2 className="text-xl font-semibold text-foreground text-center">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                Sign in to your account
              </p>

              {/* Google button */}
              <button
                type="button"
                onClick={handleDiscover}
                className="mt-6 hero-auth-button flex items-center justify-center gap-3"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-foreground/90">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-foreground/10" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-foreground/10" />
              </div>

              {/* Email input */}
              <div className="hero-auth-input flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                />
              </div>

              {/* Password input */}
              <div className="hero-auth-input flex items-center gap-3 mt-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground shrink-0">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type="password"
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
                />
              </div>

              {/* Forgot password */}
              <div className="mt-2 text-right">
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <div className="mt-4">
                <GlassButton
                  size="lg"
                  className="glass-button-signin w-full"
                  onClick={handleDiscover}
                >
                  Sign in
                </GlassButton>
              </div>

              {/* Create account link */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={handleDiscover} className="text-foreground font-medium hover:underline">
                  Create account
                </button>
              </p>
            </div>
          </div>
        </div>
      </BackgroundPaths>
    </div>
  );
}

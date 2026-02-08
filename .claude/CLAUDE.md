# JobbMatch Beta Optimizer

## INSTANCE PROTOCOL — READ THIS FIRST

You are a Claude Code instance working on the JobbMatch Beta Optimizer project.
Follow these steps EVERY time you start:

1. **Read this entire file** to understand the project and current state
2. **Find the next uncompleted task** in the TODO section (first `[ ]` item)
3. **Mark it `[→]`** by editing this file before starting work
4. **Complete the task** following its detailed instructions
5. **Mark it `[x]`** when done, adding completion notes if relevant
6. **Update the LESSONS LEARNED section** if you discovered anything important
7. **Use `/commit`** to commit your changes with a structured message
8. **Push to remote** after committing

IMPORTANT: Do NOT skip tasks or work on tasks out of order unless a task explicitly says it can be parallelized. Each task builds on the previous one.

---

## PROJECT OVERVIEW

**What:** A demo application where a user uploads their CV (PDF), the system converts it to LaTeX internally, optimizes the content for a predefined job description using Claude AI, compiles the optimized LaTeX back to PDF, and presents the original and optimized versions side-by-side.

**Key constraint:** LaTeX is NEVER exposed to the user. It is an internal intermediate representation only. The user sees only PDFs.

**Demo flow:**
1. User uploads CV as PDF
2. Backend converts PDF → LaTeX (via Claude vision)
3. Backend loads predefined job description (JSON file in repo)
4. Backend sends LaTeX + job description to Claude → gets optimized LaTeX back
5. Backend compiles optimized LaTeX → PDF
6. Frontend shows original PDF and optimized PDF side-by-side with diff highlights
7. User can download the optimized PDF

---

## ARCHITECTURE DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | FastAPI (Python) | Async, auto OpenAPI docs, great for AI workloads |
| Frontend framework | Next.js 14+ (App Router) | Modern React, good DX |
| UI components | shadcn/ui + TailwindCSS | Beautiful defaults, customizable |
| AI model (vision) | Claude Opus 4.6 (`claude-opus-4-6`) | Best vision + LaTeX generation quality |
| AI model (optimization) | Claude Sonnet 4 (`claude-sonnet-4-20250514`) | Cost-effective for text rewriting |
| PDF → LaTeX | Claude vision API | Send PDF pages as images, get LaTeX back |
| LaTeX → PDF | TexLive (xelatex) in Docker | Full Unicode support, reliable |
| Job description | JSON file in repo (`examples/sample-job.json`) | Simple, easy to swap for demo |
| Storage | File-based (`data/` directory, gitignored) | No database needed for demo |
| API communication | Frontend calls backend directly | Simple, no proxy layer needed |
| Optimization scope | Minimal content rewrites only | Keep layout/structure unchanged, just tailor language |

---

## REPOSITORY STRUCTURE

```
jobbmatch-beta-optimizer/
├── .claude/
│   ├── CLAUDE.md                         # This file
│   └── skills/
│       └── commit.md                     # /commit skill
│
├── backend/
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py                       # FastAPI app entry point
│   │   ├── config.py                     # Settings (env vars, paths)
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── cv.py                 # POST /api/cv/upload + /api/cv/process
│   │   │       └── health.py             # GET /api/health
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── anthropic_client.py       # Anthropic SDK wrapper
│   │   │   ├── pdf_parser.py             # PDF → images (for Claude vision)
│   │   │   ├── latex_generator.py        # Images → LaTeX (via Claude)
│   │   │   ├── cv_optimizer.py           # LaTeX + job → optimized LaTeX (via Claude)
│   │   │   └── latex_compiler.py         # LaTeX → PDF (xelatex subprocess)
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── cv.py                     # Pydantic models for CV operations
│   │       └── job.py                    # Pydantic models for job descriptions
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   └── test_services.py
│   │
│   ├── pyproject.toml
│   ├── requirements.txt
│   └── Dockerfile                        # Python + TexLive
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                # Root layout
│   │   │   ├── page.tsx                  # Main page: upload + results
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn components
│   │   │   ├── cv-upload.tsx             # Drag-and-drop PDF upload
│   │   │   ├── pdf-viewer.tsx            # PDF renderer component
│   │   │   ├── comparison-view.tsx       # Side-by-side PDF comparison
│   │   │   └── processing-status.tsx     # Loading/progress indicator
│   │   ├── lib/
│   │   │   ├── api-client.ts             # Backend API client
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts                  # Shared TypeScript types
│   │
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── next.config.js
│   └── components.json                   # shadcn config
│
├── examples/
│   └── sample-job.json                   # Predefined job description for demo
│
├── data/                                 # Runtime storage (gitignored)
│   ├── uploads/                          # Uploaded original PDFs
│   └── generated/                        # Generated LaTeX files and compiled PDFs
│
├── docker-compose.yml                    # Backend service
├── .gitignore
├── .env.example                          # ANTHROPIC_API_KEY=your-key-here
└── README.md
```

---

## API ENDPOINTS

| Method | Endpoint | Request | Response | Description |
|--------|----------|---------|----------|-------------|
| GET | `/api/health` | — | `{ status: "ok" }` | Health check |
| POST | `/api/cv/upload` | `multipart/form-data` (file) | `{ id: uuid, filename: str }` | Upload PDF, store it |
| POST | `/api/cv/process` | `{ id: uuid }` | `{ id, original_pdf_url, optimized_pdf_url, changes_summary }` | Full pipeline: PDF→LaTeX→optimize→compile |
| GET | `/api/cv/{id}/original` | — | PDF file | Download original PDF |
| GET | `/api/cv/{id}/optimized` | — | PDF file | Download optimized PDF |

Note: The `/api/cv/process` endpoint runs the entire pipeline in one call (convert to LaTeX, optimize against predefined job, compile back to PDF). This keeps the frontend simple — just upload and wait for results.

---

## DEVELOPMENT COMMANDS

| Command | Description |
|---------|-------------|
| `cd backend && uvicorn src.main:app --reload --port 8000` | Run backend locally |
| `cd frontend && npm run dev` | Run frontend (port 3000) |
| `docker-compose up` | Run full stack via Docker |
| `docker-compose up backend` | Run just the backend in Docker |
| `cd backend && pytest` | Run backend tests |
| `cd frontend && npm test` | Run frontend tests |

---

## CONVENTIONS

- **Backend:** Pydantic models for all request/response types. Type hints everywhere. Async endpoints.
- **Frontend:** TypeScript strict mode. All API calls through `lib/api-client.ts`. No `any` types.
- **API:** All endpoints prefixed with `/api/`. CORS enabled for `localhost:3000`.
- **Commits:** Use `/commit` skill. Conventional commit format. Always push after commit.
- **Environment:** Secrets in `.env` (never committed). Copy `.env.example` to `.env` for setup.
- **Errors:** Return proper HTTP status codes. Frontend shows user-friendly error messages.

---

## TODO — PHASE 1 (COMPLETE)

Steps 1-8 are done. See git log for full history. Phase 1 delivered:
- Backend: FastAPI + Docker/TexLive, PDF upload, Claude vision LaTeX generation, optimization, compilation
- Frontend: Next.js 16, drag-drop upload, processing states, side-by-side PDF comparison
- Bug fixes: model IDs, error logging, font sanitization, frontend error handling, fetch timeouts

---

## TODO — PHASE 2: PROMPT ENGINEERING, DIFF HIGHLIGHTING, FRONTEND REWORK

Phase 2 focuses on three areas: (A) better LaTeX generation using example source code, (B) green diff highlighting in the optimized PDF, and (C) a polished frontend experience.

### STEP 10: Improve LaTeX Generation Prompt with Example Template `[x]`
**Scope:** Instead of letting Claude invent LaTeX from scratch, provide the actual CV LaTeX template as a reference so the output matches the original formatting perfectly.

**Context:** The user has actual LaTeX source code for the CV at `/Users/maximgusev/workspace/CV-stuff/IntroCV.Mall.Overleaf.tex`. This is a well-structured template using custom commands (`\resumeSubheading`, `\resumeItem`, etc.) that compiles cleanly with pdflatex. We should use this as the basis.

**Key insight:** Instead of vision-to-LaTeX (which often produces broken/different LaTeX), we should:
1. Send the CV images to Claude along with the **reference LaTeX template**
2. Ask Claude to fill in the template structure with the content it sees in the images
3. This ensures the output LaTeX compiles reliably and matches the original layout

**Actions:**
1. Copy the template to `examples/cv-template.tex` (sanitized, with placeholder content)
2. Update `backend/src/services/anthropic_client.py` — `generate_latex_from_images()`:
   - Load the template from `examples/cv-template.tex`
   - New prompt strategy: "Here is a LaTeX CV template. Here are images of a CV. Reproduce the CV content using this exact LaTeX template structure. Keep all the custom commands and preamble identical. Only change the content within \\begin{document}...\\end{document}."
   - This drastically improves compilation reliability
3. Update `latex_compiler.py` — switch from `xelatex` to `pdflatex` since the template uses standard LaTeX (no fontspec needed). Remove the font sanitizer if no longer needed.
4. Test: upload the test CV PDF, verify the generated LaTeX matches the template structure
5. Commit and push

**Reference LaTeX template preamble (from IntroCV.Mall.Overleaf.tex):**
```latex
\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}
% ... custom commands: \resumeSubheading, \resumeItem, etc.
```

**Important:** The template uses `pdflatex`-compatible packages (no fontspec/xelatex needed). This simplifies compilation.

**Verification:** Generated LaTeX compiles on first try. Output PDF closely matches the original CV layout.

---

### STEP 11: Add Diff Highlighting (Green Text) in Optimized PDF `[x]`
**Scope:** When the optimizer changes text, mark the changes with green bold text in a "highlighted" version of the PDF. The downloadable version should be clean (no highlighting).

**Approach:** The backend compiles THREE versions of the LaTeX:
1. `{id}_original.pdf` — original CV faithfully reproduced
2. `{id}_optimized.pdf` — clean optimized version (for download)
3. `{id}_highlighted.pdf` — optimized version with changes marked in **green bold** (for side-by-side comparison)

**Actions:**
1. Update `backend/src/services/anthropic_client.py` — `optimize_latex()`:
   - Change the prompt to ask Claude to return TWO versions:
     - A clean optimized LaTeX (for the downloadable PDF)
     - A highlighted LaTeX where changed/added text is wrapped in `\textcolor{green}{\textbf{...}}`
   - Use format: `---CLEAN_LATEX---`, `---HIGHLIGHTED_LATEX---`, `---SUMMARY---`
   - Requires adding `\usepackage{xcolor}` to the highlighted version's preamble
2. Update `backend/src/services/cv_optimizer.py` — return 3 values: `(clean_latex, highlighted_latex, summary)`
3. Update `backend/src/models/cv.py` — `CVProcessResponse` now includes `highlighted_pdf_url`
4. Update `backend/src/api/routes/cv.py`:
   - Compile all three PDFs: original, clean optimized, highlighted optimized
   - Add `GET /api/cv/{id}/highlighted` endpoint
   - Return `highlighted_pdf_url` in the process response
5. Commit and push

**Verification:** The highlighted PDF shows green bold text where changes were made. The clean optimized PDF has no color markup. Both compile successfully.

---

### STEP 12: Quick Frontend Wiring `[x]`
**Completed:** Added `highlighted_pdf_url` to types, API client, and comparison view. Right panel now shows highlighted PDF, download gives clean PDF. Original PDF now serves the actual uploaded file.

---

## TODO — PHASE 3: FRONTEND REDESIGN (Digilab-inspired)

Phase 3 is a complete frontend redesign inspired by [digilab.co](https://digilab.co/). The goal is a polished, professional landing page that flows into the CV optimization demo.

**Design reference:** `examples/digilab-reference-styles.css` contains the full CSS tokens, color palette, typography, and grid system extracted from digilab.co.

**Key design language from digilab.co:**
- Warm cream background (`#f2eee5`), dark purple text (`#160e20`)
- Clean sans-serif typography (we'll use Inter) with tight letter-spacing (`-0.03em`) on headings
- Large hero text (5rem+ on desktop), scaling down on mobile
- Accent colors: orange (`#fe4f32`), green (`#29a176`), light purple (`#cda6ff`)
- Generous whitespace, minimal UI chrome
- Smooth scroll animations (GSAP-style)
- Monospace accents for secondary text (JetBrains Mono or similar)
- Fluid responsive grid with viewport-relative sizing

### STEP 20: Landing Page / Hero Section `[x]`
**Scope:** Rebuild the entire page layout from scratch with a digilab-inspired hero section. This is the foundation — all other steps build on it.

**NOT parallelizable — must be completed first.**

**Actions:**
1. **Install fonts:** Add Inter (sans-serif) and JetBrains Mono (monospace) via `next/font/google`
2. **Update `globals.css`:**
   - Replace the current Tailwind theme with digilab-inspired design tokens
   - Set CSS variables: `--color-dark-purple`, `--color-dark-cream-bg`, `--color-orange`, `--color-green`, `--color-light-purple`, etc.
   - Base styles: cream background, dark purple text, `-webkit-font-smoothing: antialiased`
   - Typography scale: hero headings at `5.3rem` desktop / `2.2rem` mobile, tight line-height (`1.1`), negative letter-spacing
3. **Rebuild `layout.tsx`:**
   - Apply the new fonts (Inter as `font-sans`, JetBrains Mono as `font-mono`)
   - Minimal header/nav bar with "JobbMatch" logo text (monospace, small)
4. **Rebuild `page.tsx` — Hero section:**
   - Large centered headline: "AI-Optimized CVs" or similar (styled like digilab's `md:text-85`)
   - Subtitle in smaller text explaining the service
   - Single prominent CTA button: "Upload Your CV" (orange accent `#fe4f32`, rounded, hover animation)
   - Clicking the CTA transitions to the upload flow (Step 21)
   - Smooth fade/scale entrance animation (CSS transitions or framer-motion)
   - Generous vertical padding, centered layout
5. **Remove old shadcn card-based layout** — replace with the new clean aesthetic
6. Commit and push

**Key styling patterns:**
```css
/* Hero heading */
font-size: 2.2rem;  /* mobile */
font-size: 5.3rem;  /* desktop (md:) */
line-height: 1.1;
letter-spacing: -0.03em;
font-weight: 500;

/* CTA button */
background: #fe4f32;
color: white;
border-radius: 9999px;  /* pill shape */
padding: 1rem 2.5rem;
font-weight: 500;
transition: transform 0.2s, background 0.2s;

/* Page background */
background: #f2eee5;
color: #160e20;
```

**Verification:** Page loads with cream background, large hero text, and orange CTA button. Responsive on mobile. Clicking CTA triggers upload flow.

---

### STEP 21: Upload Flow `[ ]`
**Scope:** After clicking the hero CTA, transition into the CV upload experience. Replaces the current `cv-upload.tsx`.

**Can be developed in parallel with Steps 22 and 23** (they share the same page flow but are independent UI sections).

**Actions:**
1. **Redesign `cv-upload.tsx`:**
   - Full-width section that appears below or replaces the hero
   - Large drag-and-drop zone with dashed border (using `--color-grey-stroke: #cbcbcb`)
   - Upload icon (simple SVG, no heavy icon library)
   - Text: "Drag & drop your CV here" + "or click to browse" in small/muted text (`--color-small-txt: #605a67`)
   - File name display after selection
   - "Optimize" button (orange, pill-shaped) appears after file is selected
   - Smooth transition/animation when entering this section
2. **Redesign `processing-status.tsx`:**
   - Minimal, elegant loading state
   - Pulsing dot or thin progress bar (not a spinner)
   - Status text in monospace font: "Analyzing CV..." → "Optimizing for role..." → "Compiling PDF..."
   - Appears in the same section, replacing the upload zone
3. Commit and push

**Verification:** Upload zone looks clean, matches digilab aesthetic. Processing shows elegant animation. Smooth transitions between states.

---

### STEP 22: Job Description Display `[ ]`
**Scope:** Show the target job description so the user knows what they're optimizing for. Currently the job is hardcoded — display it prominently.

**Can be developed in parallel with Steps 21 and 23.**

**Actions:**
1. **Create `frontend/src/components/job-card.tsx`:**
   - Reads from the process response or displays known job info
   - Card with light cream background (`--color-light-cream-bg: #f8f8f0`), subtle border
   - Shows: Job title, company name, key requirements (extracted from `examples/sample-job.json`)
   - Small label: "Optimizing for this role" in monospace, muted text
   - Positioned between the upload zone and the results section
2. **Load job data:**
   - Either hardcode the display info for the demo, or add a lightweight `/api/job` endpoint that returns the sample job metadata (title, company, key skills)
   - Keep it simple — this is a display-only component for now
3. Commit and push

**Verification:** Job card appears after upload, clearly shows what job the CV is being optimized for.

---

### STEP 23: Results Showcase `[ ]`
**Scope:** Redesign the comparison/results view to match the new aesthetic. This is the final output section.

**Can be developed in parallel with Steps 21 and 22.**

**Actions:**
1. **Redesign `comparison-view.tsx`:**
   - Section heading: "Your Optimized CV" in large text
   - Two PDF panels side-by-side on desktop, stacked on mobile
   - Left: "Original" label (monospace, small) + PDF viewer
   - Right: "Optimized" label + "(changes highlighted in green)" subtext + PDF viewer
   - Clean card-style containers with subtle shadow or border
   - Changes summary in a collapsible section or below the PDFs
2. **Download section:**
   - Prominent download button (orange pill): "Download Clean CV"
   - Secondary button (outline, dark purple): "Start Over"
   - Small text explaining: "The downloaded version has no highlighting"
3. **Polish:**
   - Smooth scroll-into-view animation when results appear
   - Consistent spacing with the rest of the page
4. Commit and push

**Verification:** Results look polished, PDFs render correctly, download works, responsive layout.

---

### STEP 24: End-to-End Testing + Polish `[ ]`
**Scope:** Full integration test of the redesigned frontend with the backend.

**Actions:**
1. Full flow test: landing → upload → processing → results → download
2. Test responsive behavior (mobile, tablet, desktop)
3. Verify all animations/transitions are smooth
4. Docker rebuild: `docker-compose down && docker-compose up --build`
5. Cross-browser check (Chrome, Safari, Firefox)
6. Commit and push

**Test CV:** `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf`
**Job description:** `examples/sample-job.json`

**Verification:** Full demo flows smoothly with the new design. Professional enough for a portfolio piece.

---

## REFERENCE FILES

These files are available for development/testing:

| File | Path | Purpose |
|------|------|---------|
| Test CV (PDF) | `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf` | Real CV for end-to-end testing |
| LaTeX template source | `/Users/maximgusev/workspace/CV-stuff/IntroCV.Mall.Overleaf.tex` | Reference LaTeX template — use as basis for prompt engineering |
| Job description | `examples/sample-job.json` | H&M Data Engineering Summer Internship |
| Digilab CSS reference | `examples/digilab-reference-styles.css` | Design tokens, colors, typography from digilab.co |

---

## LESSONS LEARNED

_This section is updated by Claude instances as they complete tasks._

### 2026-02-08 — Phase 1
- PyMuPDF installs as `PyMuPDF` but imports as `fitz`
- TexLive Docker install uses `--no-install-recommends` to keep image size reasonable
- xelatex needs to run twice for proper cross-references
- Claude vision API needs base64-encoded PNG images
- Correct model IDs: `claude-opus-4-6` (no date suffix), `claude-sonnet-4-20250514`
- Use structured response format (---LATEX--- / ---SUMMARY---) for reliable parsing
- fontspec in Docker only has DejaVu fonts — add a font sanitizer or avoid fontspec entirely
- The reference LaTeX template uses pdflatex (no fontspec) which is much more reliable in Docker
- `examples/` dir must be mounted as a Docker volume (it's outside the backend build context)
- Backend error logging middleware is essential for debugging in Docker
- Frontend needs to parse JSON error body from backend, not just use `res.statusText`
- Add generous fetch timeout (5 min) for the process endpoint — it calls Claude twice + compiles LaTeX

### 2026-02-08 — Phase 3 (Step 20)
- Tailwind v4 `@theme inline`: custom color vars must be defined in `:root` as `--brand-*`, then referenced in `@theme inline` as `--color-*: var(--brand-*)`. Defining values directly in `@theme inline` doesn't expose them as CSS custom properties for use in regular CSS rules.
- shadcn semantic tokens (--background, --foreground, etc.) set in `:root` get picked up by `@apply bg-background` in `@layer base`
- Hero transition: CSS opacity/scale/translate with 700ms duration + setTimeout for scroll. No need for framer-motion.

### 2026-02-08 — Phase 3 (Design Overhaul)
- **Color palette:** Switched from digilab cream/purple to full B&W. Light mode: white bg `#ffffff`, near-black text `#0a0a0a`. Dark mode: `#0a0a0a` bg, `#fafafa` text. Neutral gray scale for muted/border/card.
- **Dark mode:** `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem`. Tailwind v4 already has `@custom-variant dark (&:is(.dark *))` — just add `.dark` selector with overridden CSS vars. Add `suppressHydrationWarning` to `<html>`.
- **Glass button (easemize/glass-button):** Installed via `npx shadcn@latest add https://21st.dev/r/easemize/glass-button`. The registry only ships the TSX component — CSS must be added manually to `globals.css`. The official CSS uses `oklch(from var(--foreground/--background) l c h / N%)` relative color syntax (CSS Color Level 5), `@property` for animatable conic gradient angles, `mask-composite: exclude` for borders, `mix-blend-mode: screen` for shine overlay, `transform-style: preserve-3d` + `rotateX(25deg)` for 3D press. Full CSS sourced from GitHub repos using the same component.
- **Animated background paths (framer-motion):** `Math.random()` in render causes path despawning on re-render — wrap path data in `useMemo` with deterministic durations. Original `strokeOpacity` range `0.1 + i*0.03` goes up to 1.15 (fully opaque) — reduce to `0.1 + i*0.01` (max 0.45) so lines don't overpower text.
- **Sticky hero:** Use `h-screen overflow-hidden` on outer wrapper when hero is active. When hero exits, hero div becomes `absolute inset-0` to leave document flow. Outer wrapper constraint removed so app section scrolls normally.
- **Navbar always visible:** Fixed at top with `bg-background/80 backdrop-blur-sm border-b border-border/40`. Contains GlassButton nav items + GlassButton icon theme toggle.

---

## CURRENT STATE

**Last completed step:** Landing page redesign with B&W palette, animated background paths, glass buttons, dark/light mode, sticky hero, persistent navbar.
**Currently working on:** Steps 21-23 (Upload flow, Job card, Results showcase — still need redesign to match new B&W glass aesthetic)
**Last instance notes:** Full design overhaul complete. Palette switched to B&W with light/dark mode (next-themes). Animated SVG background paths via framer-motion (memoized, reduced opacity). Glass button component from 21st.dev/easemize with official CSS (3D press, conic gradient borders, shine overlay, oklch relative colors). Always-visible navbar with GlassButton items ("Find jobs", "Upload CV", "Create account") + GlassButton icon theme toggle. Hero is h-screen sticky (no scroll). Footer uses bg-foreground/text-background for inverted contrast. CVUpload, ProcessingStatus, ComparisonView still use old shadcn Card/Button — need restyling in Steps 21-23.
**Known blockers:** None

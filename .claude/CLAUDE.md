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

**What:** A demo application where a user uploads their CV (PDF), searches for jobs by keyword, picks a job to optimize for, and the system converts the CV to LaTeX internally, optimizes it for the chosen job using Claude AI, compiles back to PDF, and presents original and optimized versions side-by-side with green diff highlighting.

**Key constraint:** LaTeX is NEVER exposed to the user. It is an internal intermediate representation only. The user sees only PDFs.

**Current demo flow:**
1. User lands on hero page → clicks "Discover JobbMatch"
2. Uploads CV as PDF
3. Enters keywords → clicks "Find Jobs"
4. Sees a grid of job listings (1 real + 5 demo)
5. Clicks "Optimize CV" on a job card
6. Three-step wizard:
   - Step 1 "See Your Difference": Score ring + issues/strengths analysis
   - Step 2 "Align Your Resume": View all suggested per-bullet changes grouped by section
   - Step 3 "Review Your Resume": Accept/reject individual changes with toggles
7. Click "Finalize" → backend applies accepted changes, compiles PDFs
8. Side-by-side PDF comparison (original vs highlighted) + download clean PDF

---

## ARCHITECTURE

| Layer | Choice |
|-------|--------|
| Backend | FastAPI (Python 3.12), PyMuPDF, Anthropic SDK, pdflatex via TexLive |
| Frontend | Next.js 16, TailwindCSS v4, shadcn/ui, react-pdf, framer-motion, next-themes |
| Docker | python:3.12-slim + TexLive for backend |
| AI models | Opus 4.6 (`claude-opus-4-6`) for both vision and optimization |
| Storage | File-based (`data/` directory, gitignored) |
| Fonts | Inter (body), JetBrains Mono (mono), Space Grotesk (brand) |

---

## DEVELOPMENT COMMANDS

| Command | Description |
|---------|-------------|
| `cd frontend && npm run dev` | Frontend dev server (port 3000) |
| `docker-compose up --build` | Full backend in Docker (port 8000) |
| `docker-compose down && docker-compose up --build` | Rebuild backend |

---

## DESIGN SYSTEM (B&W + Glass)

- **Palette:** Pure B&W. Light: `#ffffff` bg, `#0a0a0a` text. Dark: `#0a0a0a` bg, `#fafafa` text.
- **Theme:** next-themes, `attribute="class"`, `defaultTheme="light"`, `enableSystem`
- **Brand font:** Space Grotesk. "Jobb" (300 weight) + "Match" (700 weight). Hero: 4rem mobile / 8rem desktop.
- **Glass button:** easemize/glass-button. oklch relative colors, `@property` conic gradient borders, 3D press, shine overlay. CSS manually in `globals.css`.
- **Background:** Two-phase animation. Phase 1: GSAP canvas spiral (plays once, 15s). Lines start fading in 1s before spiral ends. Phase 2: framer-motion SVG FloatingPaths (36 paths/layer, 2 mirrored layers, individual speeds).
- **Hero:** h-screen sticky, content at mt-[22vh], navbar always visible (fixed, glass blur).

---

## COMPLETED PHASES

### Phase 1 (Steps 1-8) `[x]`
Backend: FastAPI + Docker/TexLive, PDF upload, Claude vision LaTeX generation, optimization, compilation. Frontend: Next.js 16, drag-drop upload, processing states, side-by-side PDF comparison. Bug fixes: model IDs, error logging, font sanitization, frontend error handling, fetch timeouts.

### Phase 2 (Steps 10-12) `[x]`
Template LaTeX (`examples/cv-template.tex`), pdflatex compiler, green diff highlighting (3 PDF outputs: original, clean optimized, highlighted), frontend wiring for highlighted PDF.

### Phase 3 — Landing Page (Step 20) `[x]`
Complete frontend redesign: B&W palette with light/dark mode, Space Grotesk brand font (large hero wordmark), animated background (GSAP spiral → SVG floating lines with crossfade), glass button component, persistent navbar with glass blur, theme toggle (resolvedTheme fix), fade-in animations, new user flow (upload → keywords → job grid → optimize → results), job grid with 6 listings (1 real H&M + 5 demo), expandable job cards, processing screen with glass ring + orbiting dots, comparison view with react-markdown changes summary.

---

## TODO — PHASE 4: CV UPLOAD PAGE REHAUL

The landing page is done and looking good. Now we need to polish the CV upload experience — the page users see after clicking "Discover JobbMatch". This covers everything from the upload drop zone through the keyword search to the job grid.

### STEP 30: Upload Page Layout & Visual Polish `[x]` (merged with Step 31)
**Scope:** The upload page currently has a functional but plain drop zone. Rework the layout, spacing, and visual treatment to match the landing page's quality level.

**Actions:**
1. Review the current `cv-upload.tsx` — the drop zone, file-selected state, and "Upload CV" button
2. Improve the visual design:
   - Consider adding a subtle glass/frosted effect to the drop zone (consistent with glass button aesthetic)
   - Better visual hierarchy: the upload zone should feel inviting, not clinical
   - Animate the transition from hero → upload section (currently just opacity fade)
   - The section heading "Upload your CV" could be more engaging
3. Add subtle micro-interactions:
   - Drag-over state should feel more responsive
   - File-selected state transition should be smooth
   - Consider a subtle success animation when file is selected
4. Ensure the page feels cohesive with the landing page above it
5. Commit and push

**Verification:** Upload page feels polished and matches the landing page quality. Smooth transitions, good visual hierarchy.

---

### STEP 31: Keyword Search Polish `[x]` (merged into Step 30)
**Scope:** The keyword input is functional but basic. Make it feel premium.

**Actions:**
1. Review `keyword-search.tsx` — currently a plain `<input>` with a GlassButton
2. Improvements to consider:
   - Glass/frosted input field styling (matching the overall aesthetic)
   - Suggested keyword chips/tags (pulled from the job listings' keywords)
   - Smooth transition from upload → keyword search
   - Better placeholder text or animated placeholder
   - Visual feedback when typing (subtle border glow or similar)
3. Make the "Find Jobs" button feel like a natural next step
4. Commit and push

**Verification:** Keyword search feels premium, has good visual feedback, smooth transition from upload state.

---

### STEP 32: Job Grid & Card Polish `[ ]`
**Scope:** The job grid and cards work but need visual refinement to match the design system.

**Actions:**
1. Review `job-grid.tsx` and `job-card.tsx`
2. Improvements:
   - Cards should have glass/frosted treatment or subtle depth
   - Hover effects on cards (lift, glow, or border change)
   - Better visual distinction between the real job and demo jobs
   - Keyword chips should look more refined
   - "Optimize CV" and "View Posting" buttons should have clear visual hierarchy
   - Expand/collapse animation should be smooth (consider framer-motion)
   - Grid should have a nice entrance animation (staggered card appearance)
3. Responsive: ensure cards stack nicely on mobile
4. Commit and push

**Verification:** Job grid looks polished, cards have good hover states, smooth animations, responsive.

---

### STEP 33: Processing & Results Flow Polish `[ ]`
**Scope:** Review the full flow from clicking "Optimize CV" through to seeing results. Ensure transitions are smooth and the processing/results screens match the new quality bar.

**Actions:**
1. Review `processing-status.tsx` — glass ring, orbiting dots, timer
2. Review `comparison-view.tsx` — PDF panels, changes summary, download
3. Ensure smooth transitions between stages (jobs → processing → results)
4. Check that the container width transition (max-w-2xl → max-w-6xl) feels smooth
5. Verify PDF viewers load correctly
6. Test the full flow end-to-end with the backend running
7. Commit and push

**Verification:** Full flow from job selection to results is smooth and polished.

---

### STEP 34: End-to-End Testing `[ ]`
**Scope:** Full integration test of the complete flow with the backend.

**Actions:**
1. Full flow test: landing → upload → keywords → jobs → optimize → processing → results → download
2. Test responsive behavior (mobile, tablet, desktop)
3. Test light mode and dark mode
4. Docker rebuild and test: `docker-compose down && docker-compose up --build`
5. Commit and push

**Test CV:** `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf`
**Job description:** `examples/sample-job.json`

**Verification:** Full demo flows smoothly. Professional enough for a portfolio piece.

---

## REFERENCE FILES

| File | Path | Purpose |
|------|------|---------|
| Test CV (PDF) | `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf` | Real CV for end-to-end testing |
| LaTeX template | `examples/cv-template.tex` | Reference LaTeX template for Claude vision |
| Job description | `examples/sample-job.json` | H&M Data Engineering Summer Internship |
| Design reference | `examples/digilab-reference-styles.css` | Original design tokens from digilab.co |

---

## KEY COMPONENTS

| Component | File | Purpose |
|-----------|------|---------|
| BackgroundPaths | `frontend/src/components/ui/background-paths.tsx` | Two-phase animated background (spiral → lines) |
| GlassButton | `frontend/src/components/ui/glass-button.tsx` | Glass-effect button (CSS in globals.css) |
| BrandWordmark | `frontend/src/components/ui/brand-wordmark.tsx` | "JobbMatch" brand text (Space Grotesk) |
| CVUpload | `frontend/src/components/cv-upload.tsx` | Drag-drop PDF upload zone |
| KeywordSearch | `frontend/src/components/keyword-search.tsx` | Keyword input + Find Jobs button |
| JobGrid | `frontend/src/components/job-grid.tsx` | Grid of job listings |
| JobCard | `frontend/src/components/job-card.tsx` | Expandable job card with actions |
| ProcessingStatus | `frontend/src/components/processing-status.tsx` | Glass ring loading animation |
| ComparisonView | `frontend/src/components/comparison-view.tsx` | Side-by-side PDF comparison + download |
| ThemeToggle | `frontend/src/components/theme-toggle.tsx` | Light/dark mode toggle |

---

## LESSONS LEARNED

### Phase 1
- PyMuPDF: pip package is `PyMuPDF`, import is `fitz`
- Correct model IDs: `claude-opus-4-6` (NO date suffix), `claude-sonnet-4-20250514`
- Reference LaTeX template uses pdflatex (no fontspec) — much more reliable in Docker
- `examples/` dir must be mounted as Docker volume (outside backend build context)
- Frontend needs JSON error body parsing + 5-min fetch timeout for process endpoint

### Phase 2
- Structured response format (---CLEAN_LATEX--- / ---HIGHLIGHTED_LATEX--- / ---SUMMARY---) for reliable parsing
- pdflatex more reliable than xelatex in Docker (no font issues)

### Phase 3
- Tailwind v4: shadcn tokens in `:root`, mapped in `@theme inline` as `--color-*: var(--token)`
- Glass button CSS not bundled with shadcn registry — must be manually added to globals.css
- `oklch(from var(--foreground) l c h / N%)` — CSS Color Level 5 relative colors for theme-adaptive glass effects
- framer-motion `Math.random()` in render → path despawning on re-render. Use `useMemo` with seeded PRNG.
- Sticky hero: `h-screen overflow-hidden` when active, `absolute inset-0` when exited to leave document flow
- next-themes: use `resolvedTheme` (not `theme`) for toggle — `theme` can be `"system"` causing phantom clicks
- Space Grotesk: excellent brand font at large display sizes, pairs well with Inter body text
- GSAP spiral `onNearEnd` callback at `time >= 14/15` lets lines start fading in 1s before spiral ends for smooth crossfade

---

## CURRENT STATE

**Last completed:** Phase 3 — Full landing page + new user flow (upload → keywords → jobs → optimize → results)
**Next up:** Phase 4 — CV upload page visual polish
**Known blockers:** None

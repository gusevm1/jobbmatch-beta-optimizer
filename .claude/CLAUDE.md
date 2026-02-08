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

### STEP 10: Improve LaTeX Generation Prompt with Example Template `[ ]`
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

### STEP 11: Add Diff Highlighting (Green Text) in Optimized PDF `[ ]`
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

### STEP 12: Frontend Rework — Three-Panel Comparison `[ ]`
**Scope:** Redesign the comparison view to show the highlighted version and provide a clean download.

**Actions:**
1. Update `frontend/src/types/index.ts` — add `highlighted_pdf_url` to `CVProcessResponse`
2. Update `frontend/src/lib/api-client.ts` — add `getHighlightedPdfUrl(id)` helper
3. Redesign `frontend/src/components/comparison-view.tsx`:
   - Left panel: "Original CV" (original PDF)
   - Right panel: "Optimized CV" (highlighted PDF — shows green changes)
   - Below: changes summary text
   - Download button downloads the **clean** optimized PDF (no green highlighting)
   - "Start Over" button
4. Improve overall page layout:
   - Job description info shown (title, company) so user knows what they're optimizing for
   - Better responsive design
   - Nicer processing animation
5. Commit and push

**Verification:** Side-by-side shows original vs highlighted. Green text is visible in the right panel. Download gives clean PDF without green marks.

---

### STEP 13: End-to-End Testing + Final Polish `[ ]`
**Scope:** Full integration test with the real CV and H&M job description.

**Actions:**
1. Test full flow: upload Mathias's CV → get highlighted comparison → download clean PDF
2. Verify the LaTeX template approach produces reliable, compilable output
3. Verify green highlighting is clear and accurate
4. Verify clean download has no color artifacts
5. Docker rebuild and test: `docker-compose down && docker-compose up --build`
6. Update README if needed
7. Commit and push

**Test CV:** `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf`
**Test LaTeX source:** `/Users/maximgusev/workspace/CV-stuff/IntroCV.Mall.Overleaf.tex`
**Job description:** `examples/sample-job.json` (H&M Data Engineering Summer Internship)

**Verification:** Full demo works smoothly. Highlighted changes are readable. Download is clean.

---

## REFERENCE FILES

These files are available for development/testing:

| File | Path | Purpose |
|------|------|---------|
| Test CV (PDF) | `/Users/maximgusev/workspace/CV-stuff/Mathias_Gren_CV_Mall_med_Intro_att_Dela.pdf` | Real CV for end-to-end testing |
| LaTeX template source | `/Users/maximgusev/workspace/CV-stuff/IntroCV.Mall.Overleaf.tex` | Reference LaTeX template — use as basis for prompt engineering |
| Job description | `examples/sample-job.json` | H&M Data Engineering Summer Internship |

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

---

## CURRENT STATE

**Last completed step:** Phase 1 complete (Steps 1-8) + debugging fixes
**Currently working on:** Phase 2 starting at STEP 10
**Last instance notes:** Full pipeline works end-to-end with real CV. Opus 4.6 for vision, Sonnet 4 for optimization. Font sanitizer handles Docker font limitations. H&M Data Engineering internship as sample job. Next: improve prompts with template LaTeX, add green diff highlighting, rework frontend.
**Known blockers:** None

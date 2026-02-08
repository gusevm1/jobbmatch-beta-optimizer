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
| AI model | Claude Opus 4.6 (`claude-opus-4-6-20250219`) | Best vision + writing quality |
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

## TODO — IMPLEMENTATION TASKS

Each task is designed for ONE Claude Code instance. Work sequentially.

### STEP 1: Repository Initialization + GitHub Remote `[x]`
**Scope:** Initialize the project repository and push to GitHub.

**Actions:**
1. Run `git init` in the project root
2. Create `.gitignore` with entries for: `data/`, `node_modules/`, `__pycache__/`, `.env`, `*.pyc`, `.next/`, `dist/`, `.venv/`, `*.pdf` (in data/), `.DS_Store`
3. Create `.env.example` with: `ANTHROPIC_API_KEY=your-api-key-here`, `BACKEND_PORT=8000`, `FRONTEND_URL=http://localhost:3000`
4. Create a minimal `README.md` with project name and one-line description
5. Create directory structure with `.gitkeep` files: `backend/src/api/routes/`, `backend/src/services/`, `backend/src/models/`, `backend/tests/`, `frontend/src/`, `examples/`, `data/uploads/`, `data/generated/`
6. Create GitHub repo: `gh repo create jobbmatch-beta-optimizer --public --source=. --remote=origin`
7. Initial commit and push to `main`

**Verification:** `git remote -v` shows GitHub remote. `git log` shows initial commit. GitHub repo page loads.

---

### STEP 2: Backend Foundation `[→]`
**Scope:** Set up FastAPI skeleton with health check, CORS, config, and Docker.

**Actions:**
1. Create `backend/pyproject.toml` with project metadata
2. Create `backend/requirements.txt`:
   - `fastapi>=0.109.0`
   - `uvicorn[standard]>=0.27.0`
   - `python-multipart>=0.0.6`
   - `anthropic>=0.43.0`
   - `PyMuPDF>=1.23.0` (fitz — for PDF to image)
   - `pydantic>=2.5.0`
   - `pydantic-settings>=2.1.0`
   - `python-dotenv>=1.0.0`
3. Create `backend/src/__init__.py` (empty)
4. Create `backend/src/config.py` — Pydantic Settings class reading from `.env`
5. Create `backend/src/main.py` — FastAPI app with CORS middleware, include health router
6. Create `backend/src/api/__init__.py` and `backend/src/api/routes/__init__.py`
7. Create `backend/src/api/routes/health.py` — `GET /api/health` returning `{"status": "ok"}`
8. Create `backend/Dockerfile`:
   - Base: `python:3.12-slim`
   - Install TexLive: `texlive-xetex texlive-fonts-recommended texlive-fonts-extra texlive-latex-extra`
   - Install Python deps
   - Copy source, run uvicorn
9. Create `docker-compose.yml` with backend service (port 8000, env file, volume for data/)
10. Commit and push: `chore(backend): initialize FastAPI skeleton with Docker + TexLive`

**Verification:** `cd backend && pip install -r requirements.txt && uvicorn src.main:app --port 8000` → `curl localhost:8000/api/health` returns `{"status":"ok"}`

---

### STEP 3: PDF Upload + LaTeX Generation Service `[ ]`
**Scope:** Implement PDF upload, PDF-to-image conversion, and Claude-based LaTeX generation.

**Actions:**
1. Create `backend/src/models/cv.py` — Pydantic models: `CVUploadResponse(id, filename)`, `CVProcessRequest(id)`, `CVProcessResponse(id, original_pdf_url, optimized_pdf_url, changes_summary)`
2. Create `backend/src/services/anthropic_client.py` — Thin wrapper around Anthropic SDK. Initialize with API key from config. Method: `generate_latex_from_images(images: list[bytes]) -> str` and `optimize_latex(latex: str, job_description: dict) -> tuple[str, str]` (returns optimized_latex, changes_summary)
3. Create `backend/src/services/pdf_parser.py` — Method: `pdf_to_images(pdf_path: Path) -> list[bytes]`. Uses PyMuPDF to render each page as a PNG image (300 DPI). Returns list of image bytes.
4. Create `backend/src/services/latex_generator.py` — Method: `generate_latex(images: list[bytes]) -> str`. Sends images to Claude with a carefully crafted prompt asking it to reproduce the CV as LaTeX. The prompt should emphasize: reproduce the layout faithfully, use standard LaTeX packages, make it compilable with xelatex.
5. Create `backend/src/api/routes/cv.py`:
   - `POST /api/cv/upload` — Accept multipart file upload, save to `data/uploads/{uuid}.pdf`, return id
   - Wire up the router in `main.py`
6. Create `backend/src/services/__init__.py`
7. Create `backend/src/models/__init__.py`
8. Commit and push: `feat(backend): add PDF upload and Claude LaTeX generation service`

**Verification:** Upload a test PDF via curl. Check that image extraction works. Check that Claude returns compilable LaTeX (manual inspection of response).

---

### STEP 4: LaTeX Compilation + Optimization Pipeline `[ ]`
**Scope:** Implement LaTeX-to-PDF compilation and the full optimization pipeline endpoint.

**Actions:**
1. Create `backend/src/services/latex_compiler.py` — Method: `compile_latex(latex: str, output_dir: Path) -> Path`. Writes `.tex` file, runs `xelatex` via subprocess (with timeout), returns path to compiled PDF. Handle compilation errors gracefully.
2. Create `backend/src/services/cv_optimizer.py` — Method: `optimize_cv(latex: str, job_description: dict) -> tuple[str, str]`. Sends LaTeX + job JSON to Claude with prompt: "Make minimal, targeted changes to this CV's content to better match this job description. Keep the same LaTeX structure and formatting. Only adjust wording, add relevant keywords, or slightly rephrase bullet points. Return the complete modified LaTeX. Also provide a brief summary of changes made." Returns (optimized_latex, changes_summary).
3. Create `examples/sample-job.json` — A realistic software engineering job description with title, company, description, requirements (required + preferred), and keywords.
4. Add `POST /api/cv/process` endpoint to `cv.py`:
   - Load PDF from `data/uploads/{id}.pdf`
   - Convert to images → send to Claude → get LaTeX
   - Load `examples/sample-job.json`
   - Send LaTeX + job to optimizer → get optimized LaTeX + summary
   - Compile original LaTeX → `data/generated/{id}_original.pdf`
   - Compile optimized LaTeX → `data/generated/{id}_optimized.pdf`
   - Return URLs for both PDFs + changes summary
5. Add `GET /api/cv/{id}/original` and `GET /api/cv/{id}/optimized` — Serve the PDF files via `FileResponse`
6. Commit and push: `feat(backend): add LaTeX compilation and full CV optimization pipeline`

**Verification:** Upload PDF via `/api/cv/upload`, then call `/api/cv/process` with the returned ID. Check that two PDFs are generated and downloadable. Verify changes_summary describes the modifications.

---

### STEP 5: Frontend Foundation `[ ]`
**Scope:** Initialize Next.js project with TailwindCSS and shadcn/ui.

**Actions:**
1. Run `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (answer prompts appropriately)
2. `cd frontend && npx shadcn@latest init` — choose defaults (New York style, slate base color)
3. Add shadcn components we'll need: `npx shadcn@latest add button card progress`
4. Create `frontend/src/lib/api-client.ts` — Functions: `uploadCV(file: File): Promise<{id: string}>`, `processCV(id: string): Promise<{original_pdf_url, optimized_pdf_url, changes_summary}>`, `getOriginalPdfUrl(id: string): string`, `getOptimizedPdfUrl(id: string): string`. Base URL from env var `NEXT_PUBLIC_API_URL` defaulting to `http://localhost:8000`.
5. Create `frontend/src/types/index.ts` — TypeScript types matching backend models
6. Update `frontend/src/app/layout.tsx` — Clean layout with app title
7. Create minimal `frontend/src/app/page.tsx` — Just a heading and placeholder text
8. Configure `next.config.js` to allow backend URL for API calls
9. Commit and push: `feat(frontend): initialize Next.js with TailwindCSS and shadcn/ui`

**Verification:** `cd frontend && npm run dev` → page loads at localhost:3000 without errors.

---

### STEP 6: Frontend — Upload Component + Processing Flow `[ ]`
**Scope:** Build the CV upload component with drag-and-drop and processing state management.

**Actions:**
1. Create `frontend/src/components/cv-upload.tsx`:
   - Drag-and-drop zone for PDF files (accept only .pdf)
   - File validation (type, size limit)
   - Upload button trigger
   - Shows selected filename
   - Calls `uploadCV()` then `processCV()` from api-client
   - Emits events/callbacks for state changes: idle → uploading → processing → done/error
2. Create `frontend/src/components/processing-status.tsx`:
   - Shows current pipeline stage with progress animation
   - Stages: "Uploading CV..." → "Analyzing CV layout..." → "Optimizing for job match..." → "Generating PDF..."
   - Uses shadcn Progress component
3. Update `frontend/src/app/page.tsx`:
   - When idle: show upload component centered on page
   - When processing: show processing status
   - When done: show comparison view (placeholder for now, built in step 7)
4. Commit and push: `feat(frontend): add CV upload with drag-drop and processing states`

**Verification:** Upload a PDF. See the processing states animate. Backend receives the file (check server logs).

---

### STEP 7: Frontend — Side-by-Side PDF Comparison `[ ]`
**Scope:** Build the PDF viewer and side-by-side comparison view.

**Actions:**
1. Install `react-pdf` or `@react-pdf-viewer/core` for PDF rendering in browser
2. Create `frontend/src/components/pdf-viewer.tsx`:
   - Renders a PDF from a URL
   - Scrollable, zoomable
   - Page navigation
3. Create `frontend/src/components/comparison-view.tsx`:
   - Two PDF viewers side by side (responsive — stacked on mobile)
   - Labels: "Original CV" and "Optimized CV"
   - Changes summary section below (text list of what was changed)
   - Download button for optimized PDF
   - "Start Over" button to upload a new CV
4. Wire into `page.tsx` — show comparison view when processing is complete
5. Add shadcn components if needed: `npx shadcn@latest add badge separator scroll-area`
6. Commit and push: `feat(frontend): add side-by-side PDF comparison view`

**Verification:** Full end-to-end test: upload PDF → wait for processing → see both PDFs side by side → download optimized PDF → "Start Over" works.

---

### STEP 8: Integration Testing + Polish `[ ]`
**Scope:** End-to-end testing, error handling, and demo readiness.

**Actions:**
1. Test the full flow end-to-end with a real CV PDF
2. Add error handling:
   - Backend: proper error responses for invalid files, Claude API failures, LaTeX compilation errors
   - Frontend: error toasts/alerts, retry button
3. Add loading skeleton states
4. Ensure CORS works correctly between frontend (3000) and backend (8000)
5. Test Docker Compose setup: `docker-compose up` should bring up everything
6. Update README.md with:
   - Project description
   - Setup instructions (env vars, Docker)
   - Demo instructions
7. Final cleanup: remove unused boilerplate, check for TODO comments
8. Commit and push: `chore: integration testing and demo polish`

**Verification:** `docker-compose up`, open `localhost:3000`, upload CV, see results. No console errors. All error states handled gracefully.

---

### STEP 9 (STRETCH): Diff Highlighting `[ ]`
**Scope:** Highlight the differences between original and optimized PDFs.

**Note:** This is a stretch goal. The core demo works without it.

**Possible approaches:**
- Text-level diff: Extract text from both PDFs, run diff, highlight changed sections in the summary
- Visual overlay: Not practical for a demo
- Change annotations: List specific line/section changes alongside the PDFs

**Actions:** TBD based on approach chosen. Discuss with user before implementing.

---

## LESSONS LEARNED

_This section is updated by Claude instances as they complete tasks. Add entries with the date and what you learned._

<!-- Example format:
### 2025-01-15 — Step 2
- PyMuPDF requires `pymupdf` not `fitz` as the pip package name
- TexLive Docker install needs `--no-install-recommends` to keep image size reasonable
-->

---

## CURRENT STATE

**Last completed step:** STEP 1 (repo init + GitHub remote)
**Last instance notes:** Repo created at https://github.com/gusevm1/jobbmatch-beta-optimizer
**Known blockers:** None

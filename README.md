# JobbMatch Beta Optimizer

Upload your CV and get an AI-optimized version tailored to a specific job description — side-by-side PDF comparison included.

## How It Works

1. **Upload** your CV as a PDF
2. The backend converts your PDF to LaTeX using Claude's vision capabilities
3. Claude optimizes the LaTeX content to match a predefined job description
4. The optimized LaTeX is compiled back to PDF
5. **Compare** your original and optimized CVs side-by-side
6. **Download** the optimized PDF

LaTeX is used purely as an internal representation — you never see or touch it.

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- TexLive with XeLaTeX (for local development) or Docker

### Setup

```bash
# Clone the repo
git clone https://github.com/gusevm1/jobbmatch-beta-optimizer.git
cd jobbmatch-beta-optimizer

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Option A: Docker (recommended)

```bash
docker-compose up
```

Backend runs at `http://localhost:8000`. Then start the frontend:

```bash
cd frontend && npm install && npm run dev
```

Frontend runs at `http://localhost:3000`.

### Option B: Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Frontend | Next.js 16, TailwindCSS v4, shadcn/ui |
| AI | Claude Opus 4.6 (vision + text) |
| PDF Rendering | react-pdf |
| LaTeX Compilation | XeLaTeX (TexLive) |
| Containerization | Docker |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/cv/upload` | Upload a CV (PDF) |
| POST | `/api/cv/process` | Run the full optimization pipeline |
| GET | `/api/cv/{id}/original` | Download original PDF |
| GET | `/api/cv/{id}/optimized` | Download optimized PDF |

import hashlib
import json
import logging
import shutil
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse

from src.config import settings
from src.models.cv import (
    CVAnalyzeRequest,
    CVAnalyzeResponse,
    CVApplyRequest,
    CVApplyResponse,
    CVProcessRequest,
    CVProcessResponse,
    CVUploadResponse,
)
from src.services.cv_analyzer import analyze_cv_for_job, compute_job_id
from src.services.cv_applier import apply_changes_and_compile
from src.services.cv_optimizer import optimize_cv
from src.services.latex_compiler import compile_latex
from src.services.latex_generator import generate_latex
from src.services.pdf_parser import pdf_to_images

logger = logging.getLogger("uvicorn.error")

router = APIRouter()

SAMPLE_JOB_PATH = Path("examples/sample-job.json")


@router.post("/api/cv/upload", response_model=CVUploadResponse)
async def upload_cv(file: UploadFile):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()

    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Deterministic ID from file content — same PDF always gets same ID
    cv_id = hashlib.sha256(content).hexdigest()[:16]

    upload_dir = settings.DATA_DIR / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{cv_id}.pdf"
    if not file_path.exists():
        file_path.write_bytes(content)

    return CVUploadResponse(id=cv_id, filename=file.filename)


@router.post("/api/cv/process", response_model=CVProcessResponse)
async def process_cv(request: CVProcessRequest):
    cv_id = request.id
    pdf_path = settings.DATA_DIR / "uploads" / f"{cv_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="CV not found. Please upload first.")

    # Demo shortcut: if full results already cached, return immediately
    generated_dir = settings.DATA_DIR / "generated" / cv_id
    cached_optimized = generated_dir / f"{cv_id}_optimized.pdf"
    cached_highlighted = generated_dir / f"{cv_id}_highlighted.pdf"
    cached_summary = generated_dir / "summary.txt"

    if cached_optimized.exists() and cached_highlighted.exists() and cached_summary.exists():
        logger.info(f"Returning fully cached results for {cv_id}")
        return CVProcessResponse(
            id=cv_id,
            original_pdf_url=f"/api/cv/{cv_id}/original",
            optimized_pdf_url=f"/api/cv/{cv_id}/optimized",
            highlighted_pdf_url=f"/api/cv/{cv_id}/highlighted",
            changes_summary=cached_summary.read_text(encoding="utf-8"),
        )

    # Load job description
    if not SAMPLE_JOB_PATH.exists():
        raise HTTPException(status_code=500, detail="Job description file not found")

    job_description = json.loads(SAMPLE_JOB_PATH.read_text(encoding="utf-8"))

    # Step 1: Convert PDF to images
    try:
        images = pdf_to_images(pdf_path)
    except Exception as e:
        logger.error(f"Failed to parse PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {e}")

    generated_dir = settings.DATA_DIR / "generated" / cv_id
    generated_dir.mkdir(parents=True, exist_ok=True)
    cached_latex_path = generated_dir / "original.tex"

    # Step 2: Generate LaTeX from images via Claude (or use cached)
    if cached_latex_path.exists():
        logger.info(f"Using cached LaTeX for {cv_id}")
        original_latex = cached_latex_path.read_text(encoding="utf-8")
    else:
        try:
            original_latex = await generate_latex(images)
            cached_latex_path.write_text(original_latex, encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to generate LaTeX from PDF: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to generate LaTeX from PDF: {e}")

    # Step 3: Optimize LaTeX for job description
    try:
        clean_latex, highlighted_latex, changes_summary = await optimize_cv(original_latex, job_description)
    except Exception as e:
        logger.error(f"Failed to optimize CV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to optimize CV: {e}")

    # Step 4: Compile clean optimized LaTeX to PDF (for download)
    optimized_dir = generated_dir / "optimized"
    try:
        optimized_pdf = await compile_latex(clean_latex, optimized_dir)
        final_optimized = generated_dir / f"{cv_id}_optimized.pdf"
        shutil.copy2(optimized_pdf, final_optimized)
    except RuntimeError as e:
        logger.error(f"Failed to compile optimized LaTeX: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compile optimized LaTeX: {e}")

    # Step 5: Compile highlighted LaTeX to PDF (for side-by-side comparison)
    highlighted_dir = generated_dir / "highlighted"
    try:
        highlighted_pdf = await compile_latex(highlighted_latex, highlighted_dir)
        final_highlighted = generated_dir / f"{cv_id}_highlighted.pdf"
        shutil.copy2(highlighted_pdf, final_highlighted)
    except RuntimeError as e:
        logger.error(f"Failed to compile highlighted LaTeX: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compile highlighted LaTeX: {e}")

    # Cache the summary for future demo runs
    cached_summary.write_text(changes_summary, encoding="utf-8")

    return CVProcessResponse(
        id=cv_id,
        original_pdf_url=f"/api/cv/{cv_id}/original",
        optimized_pdf_url=f"/api/cv/{cv_id}/optimized",
        highlighted_pdf_url=f"/api/cv/{cv_id}/highlighted",
        changes_summary=changes_summary,
    )


@router.post("/api/cv/analyze", response_model=CVAnalyzeResponse)
async def analyze_cv(request: CVAnalyzeRequest):
    cv_id = request.cv_id
    pdf_path = settings.DATA_DIR / "uploads" / f"{cv_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="CV not found. Please upload first.")

    # Compute deterministic job ID from job description
    job_dict = request.job.model_dump()
    job_id = compute_job_id(job_dict)

    # Check for cached analysis
    cached_analysis_path = (
        settings.DATA_DIR / "generated" / cv_id / "analyses" / job_id / "analysis.json"
    )
    if cached_analysis_path.exists():
        logger.info(f"Returning cached analysis for {cv_id}/{job_id}")
        analysis = json.loads(cached_analysis_path.read_text(encoding="utf-8"))
        return CVAnalyzeResponse(
            cv_id=cv_id,
            job_id=job_id,
            score=analysis["score"],
            score_label=analysis["score_label"],
            issues=analysis.get("issues", []),
            strengths=analysis.get("strengths", []),
            changes=analysis.get("changes", []),
        )

    # Get or generate LaTeX from the uploaded PDF
    generated_dir = settings.DATA_DIR / "generated" / cv_id
    generated_dir.mkdir(parents=True, exist_ok=True)
    cached_latex_path = generated_dir / "original.tex"

    if cached_latex_path.exists():
        logger.info(f"Using cached LaTeX for {cv_id}")
        original_latex = cached_latex_path.read_text(encoding="utf-8")
    else:
        # Convert PDF to images, then generate LaTeX via Claude vision
        try:
            images = pdf_to_images(pdf_path)
        except Exception as e:
            logger.error(f"Failed to parse PDF: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {e}")

        try:
            original_latex = await generate_latex(images)
            cached_latex_path.write_text(original_latex, encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to generate LaTeX from PDF: {e}", exc_info=True)
            raise HTTPException(
                status_code=500, detail=f"Failed to generate LaTeX from PDF: {e}"
            )

    # Run analysis via Claude
    try:
        analysis = await analyze_cv_for_job(original_latex, job_dict, cv_id, job_id)
    except Exception as e:
        logger.error(f"Failed to analyze CV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze CV: {e}")

    return CVAnalyzeResponse(
        cv_id=cv_id,
        job_id=job_id,
        score=analysis["score"],
        score_label=analysis["score_label"],
        issues=analysis.get("issues", []),
        strengths=analysis.get("strengths", []),
        changes=analysis.get("changes", []),
    )


@router.post("/api/cv/apply", response_model=CVApplyResponse)
async def apply_cv_changes(request: CVApplyRequest):
    cv_id = request.cv_id
    job_id = request.job_id
    accepted_change_ids = request.accepted_change_ids

    try:
        orig_url, opt_url, hl_url = await apply_changes_and_compile(
            cv_id, job_id, accepted_change_ids
        )
    except FileNotFoundError as e:
        logger.error(f"File not found during apply: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Failed to compile during apply: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compile CV: {e}")
    except Exception as e:
        logger.error(f"Failed to apply changes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to apply changes: {e}")

    return CVApplyResponse(
        cv_id=cv_id,
        original_pdf_url=orig_url,
        optimized_pdf_url=opt_url,
        highlighted_pdf_url=hl_url,
    )


@router.get("/api/cv/{cv_id}/original")
async def get_original_pdf(cv_id: str):
    # Serve the actual uploaded PDF, not a reproduced version
    pdf_path = settings.DATA_DIR / "uploads" / f"{cv_id}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Original PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{cv_id}_original.pdf")


@router.get("/api/cv/{cv_id}/optimized")
async def get_optimized_pdf(cv_id: str):
    pdf_path = settings.DATA_DIR / "generated" / cv_id / f"{cv_id}_optimized.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Optimized PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{cv_id}_optimized.pdf")


@router.get("/api/cv/{cv_id}/highlighted")
async def get_highlighted_pdf(cv_id: str):
    pdf_path = settings.DATA_DIR / "generated" / cv_id / f"{cv_id}_highlighted.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Highlighted PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{cv_id}_highlighted.pdf")

import json
import logging
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse

from src.config import settings
from src.models.cv import CVProcessRequest, CVProcessResponse, CVUploadResponse
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

    cv_id = str(uuid.uuid4())
    upload_dir = settings.DATA_DIR / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / f"{cv_id}.pdf"
    content = await file.read()

    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    file_path.write_bytes(content)

    return CVUploadResponse(id=cv_id, filename=file.filename)


@router.post("/api/cv/process", response_model=CVProcessResponse)
async def process_cv(request: CVProcessRequest):
    cv_id = request.id
    pdf_path = settings.DATA_DIR / "uploads" / f"{cv_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="CV not found. Please upload first.")

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

    # Step 2: Generate LaTeX from images via Claude
    try:
        original_latex = await generate_latex(images)
    except Exception as e:
        logger.error(f"Failed to generate LaTeX from PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate LaTeX from PDF: {e}")

    generated_dir = settings.DATA_DIR / "generated" / cv_id
    generated_dir.mkdir(parents=True, exist_ok=True)

    # Step 3: Compile original LaTeX to PDF
    original_dir = generated_dir / "original"
    try:
        original_pdf = await compile_latex(original_latex, original_dir)
        # Copy to expected location
        final_original = generated_dir / f"{cv_id}_original.pdf"
        shutil.copy2(original_pdf, final_original)
    except RuntimeError as e:
        logger.error(f"Failed to compile original LaTeX: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compile original LaTeX: {e}")

    # Step 4: Optimize LaTeX for job description
    try:
        optimized_latex, changes_summary = await optimize_cv(original_latex, job_description)
    except Exception as e:
        logger.error(f"Failed to optimize CV: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to optimize CV: {e}")

    # Step 5: Compile optimized LaTeX to PDF
    optimized_dir = generated_dir / "optimized"
    try:
        optimized_pdf = await compile_latex(optimized_latex, optimized_dir)
        final_optimized = generated_dir / f"{cv_id}_optimized.pdf"
        shutil.copy2(optimized_pdf, final_optimized)
    except RuntimeError as e:
        logger.error(f"Failed to compile optimized LaTeX: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to compile optimized LaTeX: {e}")

    return CVProcessResponse(
        id=cv_id,
        original_pdf_url=f"/api/cv/{cv_id}/original",
        optimized_pdf_url=f"/api/cv/{cv_id}/optimized",
        changes_summary=changes_summary,
    )


@router.get("/api/cv/{cv_id}/original")
async def get_original_pdf(cv_id: str):
    pdf_path = settings.DATA_DIR / "generated" / cv_id / f"{cv_id}_original.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Original PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{cv_id}_original.pdf")


@router.get("/api/cv/{cv_id}/optimized")
async def get_optimized_pdf(cv_id: str):
    pdf_path = settings.DATA_DIR / "generated" / cv_id / f"{cv_id}_optimized.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Optimized PDF not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{cv_id}_optimized.pdf")

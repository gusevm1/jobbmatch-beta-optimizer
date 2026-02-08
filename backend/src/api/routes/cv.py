import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from src.config import settings
from src.models.cv import CVUploadResponse

router = APIRouter()


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

from pydantic import BaseModel


class CVUploadResponse(BaseModel):
    id: str
    filename: str


class CVProcessRequest(BaseModel):
    id: str


class CVProcessResponse(BaseModel):
    id: str
    original_pdf_url: str
    optimized_pdf_url: str
    highlighted_pdf_url: str
    changes_summary: str

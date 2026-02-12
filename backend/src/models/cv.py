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


class JobDescription(BaseModel):
    title: str
    company: str
    location: str
    type: str
    description: str
    keywords: list[str] | None = None


class AnalysisIssue(BaseModel):
    text: str
    severity: str  # "high" | "medium" | "low"


class AnalysisStrength(BaseModel):
    text: str


class ChangeProposal(BaseModel):
    id: str
    section: str
    original_text: str
    proposed_text: str
    reason: str
    impact: str  # "high" | "medium" | "low"


class CVAnalyzeRequest(BaseModel):
    cv_id: str
    job: JobDescription


class CVAnalyzeResponse(BaseModel):
    cv_id: str
    job_id: str
    score: int
    score_label: str
    issues: list[AnalysisIssue]
    strengths: list[AnalysisStrength]
    changes: list[ChangeProposal]


class CVApplyRequest(BaseModel):
    cv_id: str
    job_id: str
    accepted_change_ids: list[str]


class CVApplyResponse(BaseModel):
    cv_id: str
    original_pdf_url: str
    optimized_pdf_url: str
    highlighted_pdf_url: str

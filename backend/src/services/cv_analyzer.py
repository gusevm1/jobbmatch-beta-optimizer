import hashlib
import json
import logging

from src.config import settings
from src.services.anthropic_client import get_client

OPTIMIZATION_MODEL = "claude-opus-4-6"

logger = logging.getLogger("uvicorn.error")


def compute_job_id(job_dict: dict) -> str:
    """Compute a deterministic job ID from job description dict (SHA-256[:16] of sorted JSON)."""
    canonical = json.dumps(job_dict, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def _strip_markdown_fences(text: str) -> str:
    """Strip markdown code fences (```json ... ```) from a string if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove opening fence line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return text.strip()


async def analyze_cv_for_job(latex: str, job_dict: dict, cv_id: str, job_id: str) -> dict:
    """Analyze a CV (LaTeX) against a job description using Claude.

    Returns a dict with: score, score_label, issues, strengths, changes.
    Each change includes original_text that is validated as an exact substring of the LaTeX.
    Results are cached to disk.
    """
    client = get_client()

    job_json = json.dumps(job_dict, indent=2, ensure_ascii=False)

    # Include a snippet of the LaTeX so Claude can see exact formatting
    latex_snippet = latex[:3000] if len(latex) > 3000 else latex

    prompt = (
        "You are a CV optimization analyst. Analyze the following CV (in LaTeX) against the "
        "job description and return a structured JSON response.\n\n"
        "=== JOB DESCRIPTION ===\n"
        f"{job_json}\n\n"
        "=== FULL CV LATEX ===\n"
        f"{latex}\n\n"
        "=== LATEX SNIPPET (for reference on exact formatting) ===\n"
        f"{latex_snippet}\n\n"
        "INSTRUCTIONS:\n"
        "1. Score the CV's match to the job (0-100) and give a label (e.g. 'Good Match', 'Needs Work').\n"
        "2. Identify keywords: list which job keywords the CV already contains (matched_keywords) "
        "and which are missing (missing_keywords). Keywords should be specific skills, tools, "
        "technologies, certifications, or domain terms from the job description.\n"
        "3. Assess each CV section's relevance to the job with section_scores. For each major section "
        "(e.g. Summary, Skills, Experience, Education), give a relevance rating: 'strong', 'moderate', or 'weak'.\n"
        "4. List issues (gaps, missing keywords, weak phrasing) with severity: 'high', 'medium', or 'low'.\n"
        "5. List strengths (what already matches well).\n"
        "6. Propose specific text changes. Each change targets the INNER CONTENT of a \\resumeItem{...} line "
        "or a similar text element -- NOT the LaTeX wrapper commands themselves.\n\n"
        "CRITICAL PAGE-LENGTH CONSTRAINT:\n"
        "- The proposed_text for each change MUST be approximately the SAME LENGTH or SHORTER than the original_text.\n"
        "- NEVER make bullet points significantly longer. If you add keywords, remove filler words to compensate.\n"
        "- The CV must stay the same number of pages after all changes are applied. If the original is 1 page, "
        "the optimized version MUST also fit on 1 page.\n"
        "- Prefer concise, punchy rewrites over verbose expansions. Cut fluff, tighten phrasing, swap in keywords.\n"
        "- If you need to add new content (e.g. missing keywords in Skills), suggest replacing existing weaker "
        "content rather than adding new lines.\n\n"
        "CRITICAL REQUIREMENT FOR original_text:\n"
        "- The `original_text` field MUST be an EXACT, CHARACTER-FOR-CHARACTER substring that appears "
        "verbatim in the LaTeX source above.\n"
        "- Copy the text EXACTLY as it appears -- preserve every space, hyphen, comma, and special character.\n"
        "- Do NOT paraphrase, summarize, or reformat the original text.\n"
        "- Do NOT include the \\resumeItem{ wrapper or closing } -- just the inner text content.\n"
        "- If a \\resumeItem line reads: \\resumeItem{Developed REST APIs using Python and FastAPI}\n"
        "  then original_text should be exactly: Developed REST APIs using Python and FastAPI\n"
        "- Each original_text must be unique enough to match only one location in the document.\n"
        "- Double-check every original_text against the FULL CV LATEX above before including it.\n\n"
        "CRITICAL REQUIREMENT FOR proposed_text:\n"
        "- The proposed_text will be inserted into a LaTeX document, so it MUST use proper LaTeX escaping.\n"
        "- Escape these special characters: & → \\&, # → \\#, % → \\%, $ → \\$, _ → \\_\n"
        "- For example, write 'H\\&M' not 'H&M', and 'C\\#' not 'C#'.\n"
        "- If the original_text already uses LaTeX commands (like \\textbf, \\LaTeX, \\%), preserve them in proposed_text.\n\n"
        "Respond with ONLY valid JSON (no markdown fences, no explanation) in this exact structure:\n"
        "{\n"
        '  "score": <integer 0-100>,\n'
        '  "score_label": "<string like Good Match, Needs Work, Strong Match, etc.>",\n'
        '  "matched_keywords": ["<keyword from job that IS in the CV>", ...],\n'
        '  "missing_keywords": ["<keyword from job that is NOT in the CV>", ...],\n'
        '  "section_scores": [\n'
        '    {"section": "Summary", "relevance": "strong|moderate|weak"},\n'
        '    {"section": "Skills", "relevance": "strong|moderate|weak"},\n'
        '    {"section": "Experience", "relevance": "strong|moderate|weak"},\n'
        '    {"section": "Education", "relevance": "strong|moderate|weak"}\n'
        "  ],\n"
        '  "issues": [\n'
        '    {"text": "<issue description>", "severity": "high|medium|low"}\n'
        "  ],\n"
        '  "strengths": [\n'
        '    {"text": "<strength description>"}\n'
        "  ],\n"
        '  "changes": [\n'
        "    {\n"
        '      "id": "change-1",\n'
        '      "section": "<section name, e.g. Experience, Skills, Summary>",\n'
        '      "original_text": "<EXACT substring from the LaTeX source>",\n'
        '      "proposed_text": "<improved replacement text>",\n'
        '      "reason": "<why this change helps>",\n'
        '      "impact": "high|medium|low"\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )

    response = await client.messages.create(
        model=OPTIMIZATION_MODEL,
        max_tokens=16384,
        messages=[{"role": "user", "content": prompt}],
    )

    text = response.content[0].text
    text = _strip_markdown_fences(text)

    try:
        analysis = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Claude analysis JSON: {e}\nRaw response:\n{text[:2000]}")
        raise ValueError(f"Failed to parse analysis response as JSON: {e}")

    # Validate and filter changes: original_text must be an exact substring of the LaTeX
    validated_changes = []
    for change in analysis.get("changes", []):
        original = change.get("original_text", "")
        if original in latex:
            validated_changes.append(change)
        elif original.strip() in latex:
            # Try stripped version -- update original_text to the stripped form
            logger.warning(
                f"Change '{change.get('id')}' matched after stripping whitespace. "
                f"Updating original_text."
            )
            change["original_text"] = original.strip()
            validated_changes.append(change)
        else:
            logger.warning(
                f"Dropping change '{change.get('id')}' -- original_text not found in LaTeX. "
                f"Text was: {original[:100]!r}"
            )

    analysis["changes"] = validated_changes

    # Cache to disk
    cache_dir = settings.DATA_DIR / "generated" / cv_id / "analyses" / job_id
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / "analysis.json"
    cache_path.write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")

    logger.info(
        f"CV analysis complete for {cv_id}/{job_id}: "
        f"score={analysis.get('score')}, "
        f"{len(validated_changes)} validated changes"
    )

    return analysis

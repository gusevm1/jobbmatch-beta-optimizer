import base64
from pathlib import Path

import anthropic

from src.config import settings

VISION_MODEL = "claude-opus-4-6"  # Best for vision + LaTeX generation
OPTIMIZATION_MODEL = "claude-opus-4-6"  # Using Opus for demo

# Template path: in Docker it's /app/examples/, locally it's relative to project root
TEMPLATE_PATH = Path("examples/cv-template.tex")

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def _load_template() -> str:
    """Load the CV LaTeX template from disk."""
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"CV template not found at {TEMPLATE_PATH}")
    return TEMPLATE_PATH.read_text(encoding="utf-8")


async def generate_latex_from_images(images: list[bytes]) -> str:
    """Send PDF page images to Claude along with a reference LaTeX template to get a faithful LaTeX reproduction."""
    client = get_client()
    template = _load_template()

    content: list[dict] = []
    for img in images:
        b64 = base64.standard_b64encode(img).decode("utf-8")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": b64},
        })

    content.append({
        "type": "text",
        "text": (
            "Here is a LaTeX CV template and images of a CV. Reproduce the CV content "
            "using this exact LaTeX template structure.\n\n"
            "=== LATEX TEMPLATE ===\n"
            f"{template}\n"
            "=== END TEMPLATE ===\n\n"
            "Instructions:\n"
            "- Keep the ENTIRE preamble (all \\usepackage lines, custom commands, formatting) EXACTLY as shown in the template. Do not add or remove any packages.\n"
            "- Only replace the placeholder content within \\begin{document}...\\end{document} with the actual content from the CV images.\n"
            "- Use the same custom commands (\\resumeSubheading, \\resumeItem, \\resumeSubHeadingListStart, etc.) exactly as defined in the template.\n"
            "- Match the CV's sections, headings, dates, and bullet points faithfully from the images.\n"
            "- Add or remove \\resumeSubheading and \\resumeItem entries as needed to match the actual CV content — the template placeholders are just examples of the structure.\n"
            "- Keep ALL bullet items under a single \\resumeSubheading in ONE \\resumeItemListStart/\\resumeItemListEnd block. "
            "Do NOT split items (like GPA, Organizations, Coursework) into separate itemize blocks under the same subheading.\n"
            "- Do NOT add manual \\vspace adjustments between items or between \\resumeItemListEnd and the next \\resumeSubheading. "
            "The spacing built into the custom commands (\\resumeItem, \\resumeSubheading, \\resumeItemListEnd) is sufficient. "
            "Only preserve the \\vspace values that appear in the PREAMBLE section formatting and header area — never add \\vspace in the document body between list items or subheadings.\n"
            "- Ensure all special characters are properly escaped for LaTeX.\n"
            "- Output ONLY the complete LaTeX document, no explanations or markdown fences."
        ),
    })

    response = await client.messages.create(
        model=VISION_MODEL,
        max_tokens=8192,
        messages=[{"role": "user", "content": content}],
    )

    latex = response.content[0].text

    # Strip markdown fences if present
    if latex.startswith("```"):
        lines = latex.split("\n")
        lines = lines[1:]  # Remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        latex = "\n".join(lines)

    return latex


def _strip_markdown_fences(text: str) -> str:
    """Strip markdown code fences from a string if present."""
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove opening fence
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    return text


async def optimize_latex(latex: str, job_description: dict) -> tuple[str, str, str]:
    """Optimize CV LaTeX to better match a job description.

    Returns (clean_latex, highlighted_latex, changes_summary).
    - clean_latex: optimized version with no color markup (for download)
    - highlighted_latex: optimized version with changes in green bold (for viewing)
    - changes_summary: bullet-point summary of changes
    """
    client = get_client()

    import json
    job_json = json.dumps(job_description, indent=2)

    response = await client.messages.create(
        model=OPTIMIZATION_MODEL,
        max_tokens=16384,
        messages=[{
            "role": "user",
            "content": (
                "You are a CV optimization expert. Your goal: make SURGICAL, high-impact changes to "
                "this CV so it better matches the job description. The output MUST stay the same length "
                "or shorter — NEVER add content that would push the CV onto an extra page.\n\n"
                "RULES:\n"
                "1. REPLACE, don't add. Rewrite existing bullet points to weave in relevant keywords "
                "from the job description. Do NOT add new bullet points or lines of text.\n"
                "2. REMOVE low-relevance content if needed to make room for more impactful phrasing. "
                "For example, if the job is about data engineering, a restaurant waiter role can be "
                "shortened or its bullet points trimmed.\n"
                "3. Focus rewrites where they have MAXIMUM impact: bullet points describing technical "
                "experience, the professional summary, and the skills section.\n"
                "4. Keep the same LaTeX structure, preamble, sections, and formatting. Do NOT add or "
                "remove sections. Do NOT change \\vspace values or layout commands.\n"
                "5. Preserve the candidate's authentic voice — rephrase, don't fabricate.\n"
                "6. The total text content must fit within the SAME number of pages as the original.\n\n"
                f"=== JOB DESCRIPTION ===\n{job_json}\n\n"
                f"=== ORIGINAL CV LATEX ===\n{latex}\n\n"
                "You must respond with TWO complete versions of the optimized LaTeX document plus a summary.\n\n"
                "VERSION 1 (CLEAN): The complete optimized LaTeX document with no markup or highlighting. "
                "Keep the preamble exactly as-is.\n\n"
                "VERSION 2 (HIGHLIGHTED): The same optimized LaTeX document, but with ALL changed or added text "
                "wrapped in \\textcolor{OliveGreen}{\\textbf{...}} so changes are visible in green bold. "
                "In this version ONLY, replace the line \\usepackage[usenames,dvipsnames]{color} with "
                "\\usepackage[usenames,dvipsnames]{xcolor} to enable \\textcolor. "
                "Only wrap the actual changed WORDS or phrases, not entire bullet points unless the whole text changed. "
                "Do not wrap LaTeX commands or structural elements — only the text content that changed.\n\n"
                "Respond in EXACTLY this format:\n"
                "---CLEAN_LATEX---\n"
                "<complete clean optimized LaTeX document>\n"
                "---HIGHLIGHTED_LATEX---\n"
                "<complete highlighted optimized LaTeX document>\n"
                "---SUMMARY---\n"
                "<bullet-point summary of changes made>"
            ),
        }],
    )

    text = response.content[0].text

    if "---CLEAN_LATEX---" in text and "---HIGHLIGHTED_LATEX---" in text and "---SUMMARY---" in text:
        # Parse three sections
        clean_and_rest = text.split("---HIGHLIGHTED_LATEX---")
        clean_latex = clean_and_rest[0].replace("---CLEAN_LATEX---", "").strip()

        highlighted_and_summary = clean_and_rest[1].split("---SUMMARY---")
        highlighted_latex = highlighted_and_summary[0].strip()
        summary = highlighted_and_summary[1].strip()
    elif "---LATEX---" in text and "---SUMMARY---" in text:
        # Fallback to old format (no highlighted version)
        parts = text.split("---SUMMARY---")
        clean_latex = parts[0].replace("---LATEX---", "").strip()
        highlighted_latex = clean_latex  # No highlighting available
        summary = parts[1].strip()
    else:
        # Last resort: treat entire response as LaTeX
        clean_latex = text
        highlighted_latex = text
        summary = "CV optimized for the target job description."

    clean_latex = _strip_markdown_fences(clean_latex)
    highlighted_latex = _strip_markdown_fences(highlighted_latex)

    return clean_latex, highlighted_latex, summary

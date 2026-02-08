import base64

import anthropic

from src.config import settings

VISION_MODEL = "claude-opus-4-6-20250609"  # Best for vision + LaTeX generation
OPTIMIZATION_MODEL = "claude-sonnet-4-20250514"  # Cost-effective for text rewriting

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


async def generate_latex_from_images(images: list[bytes]) -> str:
    """Send PDF page images to Claude and get LaTeX reproduction."""
    client = get_client()

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
            "Reproduce this CV exactly as a complete LaTeX document. "
            "Requirements:\n"
            "- Output ONLY the LaTeX code, no explanations or markdown fences\n"
            "- Use \\documentclass{article} with standard packages\n"
            "- Must compile with xelatex\n"
            "- Faithfully reproduce the layout, formatting, sections, and all text content\n"
            "- Use packages like geometry, enumitem, titlesec, hyperref as needed\n"
            "- For fonts: use fontspec with ONLY DejaVu fonts (DejaVu Sans, DejaVu Serif, DejaVu Sans Mono) "
            "or use the default Latin Modern fonts. Do NOT use any other font names.\n"
            "- Ensure all special characters are properly escaped\n"
            "- The document must be complete (\\begin{document} to \\end{document})"
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


async def optimize_latex(latex: str, job_description: dict) -> tuple[str, str]:
    """Optimize CV LaTeX to better match a job description. Returns (optimized_latex, changes_summary)."""
    client = get_client()

    import json
    job_json = json.dumps(job_description, indent=2)

    response = await client.messages.create(
        model=OPTIMIZATION_MODEL,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": (
                "You are a CV optimization expert. Make minimal, targeted changes to this CV's "
                "content to better match the job description below. Keep the same LaTeX structure "
                "and formatting. Only adjust wording, add relevant keywords, or slightly rephrase "
                "bullet points. Do NOT change the layout or add/remove sections.\n\n"
                f"=== JOB DESCRIPTION ===\n{job_json}\n\n"
                f"=== ORIGINAL CV LATEX ===\n{latex}\n\n"
                "Respond in exactly this format:\n"
                "---LATEX---\n"
                "<the complete modified LaTeX document>\n"
                "---SUMMARY---\n"
                "<bullet-point summary of changes made>"
            ),
        }],
    )

    text = response.content[0].text

    if "---LATEX---" in text and "---SUMMARY---" in text:
        parts = text.split("---SUMMARY---")
        optimized = parts[0].replace("---LATEX---", "").strip()
        summary = parts[1].strip()
    else:
        # Fallback: treat entire response as LaTeX
        optimized = text
        summary = "CV optimized for the target job description."

    # Strip markdown fences from LaTeX if present
    if optimized.startswith("```"):
        lines = optimized.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        optimized = "\n".join(lines)

    return optimized, summary

from src.services.anthropic_client import optimize_latex


async def optimize_cv(latex: str, job_description: dict) -> tuple[str, str, str]:
    """Optimize CV LaTeX content for a job description. Returns (clean_latex, highlighted_latex, changes_summary)."""
    return await optimize_latex(latex, job_description)

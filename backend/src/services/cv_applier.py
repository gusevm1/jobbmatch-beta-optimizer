import json
import logging
import re
import shutil

from src.config import settings
from src.services.latex_compiler import compile_latex

logger = logging.getLogger("uvicorn.error")


def _normalize_vspace(latex: str) -> str:
    """Strip aggressive manual \\vspace hacks from the document body.

    The custom commands (\\resumeItem, \\resumeSubheading, \\resumeItemListEnd)
    already have proper spacing built in. Any additional \\vspace{-Npt} lines
    in the body (where N > 7) are manual hacks that break when text reflows.
    This strips them to let the built-in spacing work naturally.
    """
    # Remove standalone \vspace{-Npt} lines where N > 7 (the aggressive hacks)
    # Preserves vspace in preamble commands and reasonable small adjustments
    latex = re.sub(r"^[ \t]*\\vspace\{-(?:[89]|[1-9]\d+)pt\}[ \t]*\n?", "", latex, flags=re.MULTILINE)
    return latex


def _sanitize_proposed_latex(text: str) -> str:
    """Escape bare LaTeX special characters in proposed text.

    Claude sometimes forgets to escape & # % in proposed replacement text.
    This ensures they are properly escaped for LaTeX compilation.
    """
    # Escape bare & (not already preceded by \)
    text = re.sub(r"(?<!\\)&", r"\\&", text)
    # Escape bare # (not already preceded by \)
    text = re.sub(r"(?<!\\)#", r"\\#", text)
    # Escape bare % (not already preceded by \)
    text = re.sub(r"(?<!\\)%", r"\\%", text)
    return text


def _apply_string_replacements(
    latex: str,
    changes: list[dict],
    accepted_ids: list[str],
) -> tuple[str, str]:
    """Apply accepted changes to the LaTeX source.

    Returns (clean_latex, highlighted_latex).
    - clean_latex: replacements applied directly
    - highlighted_latex: replacements wrapped in green bold + xcolor package swap
    """
    accepted_set = set(accepted_ids)

    # Filter to only accepted changes
    accepted_changes = [c for c in changes if c["id"] in accepted_set]

    # Sort changes in reverse document order (by position of original_text in latex)
    # so that replacements don't shift positions of earlier matches
    positioned = []
    for change in accepted_changes:
        pos = latex.find(change["original_text"])
        if pos == -1:
            logger.warning(
                f"Skipping change '{change['id']}' -- original_text no longer found in LaTeX"
            )
            continue
        positioned.append((pos, change))

    # Sort by position descending (reverse order) to preserve earlier positions
    positioned.sort(key=lambda x: x[0], reverse=True)

    clean_latex = latex
    highlighted_latex = latex

    for _pos, change in positioned:
        original = change["original_text"]
        proposed = _sanitize_proposed_latex(change["proposed_text"])

        # Clean version: simple replacement
        clean_latex = clean_latex.replace(original, proposed, 1)

        # Highlighted version: wrap proposed text in green bold
        highlighted_replacement = f"\\textcolor{{OliveGreen}}{{\\textbf{{{proposed}}}}}"
        highlighted_latex = highlighted_latex.replace(original, highlighted_replacement, 1)

    # In highlighted version only: swap color package for xcolor to enable \textcolor
    highlighted_latex = highlighted_latex.replace(
        "\\usepackage[usenames,dvipsnames]{color}",
        "\\usepackage[usenames,dvipsnames]{xcolor}",
    )

    return clean_latex, highlighted_latex


async def apply_changes_and_compile(
    cv_id: str,
    job_id: str,
    accepted_ids: list[str],
) -> tuple[str, str, str]:
    """Apply accepted changes to the CV and compile PDFs.

    Returns (original_pdf_url, optimized_pdf_url, highlighted_pdf_url).
    """
    generated_dir = settings.DATA_DIR / "generated" / cv_id

    # Load cached LaTeX
    latex_path = generated_dir / "original.tex"
    if not latex_path.exists():
        raise FileNotFoundError(f"Cached LaTeX not found at {latex_path}")
    latex = latex_path.read_text(encoding="utf-8")

    # Load cached analysis
    analysis_path = generated_dir / "analyses" / job_id / "analysis.json"
    if not analysis_path.exists():
        raise FileNotFoundError(f"Cached analysis not found at {analysis_path}")
    analysis = json.loads(analysis_path.read_text(encoding="utf-8"))

    changes = analysis.get("changes", [])

    # Apply accepted changes
    clean_latex, highlighted_latex = _apply_string_replacements(latex, changes, accepted_ids)

    # Normalize spacing: strip aggressive manual \vspace hacks
    clean_latex = _normalize_vspace(clean_latex)
    highlighted_latex = _normalize_vspace(highlighted_latex)

    # Compile clean optimized PDF
    wizard_dir = generated_dir / "wizard" / job_id
    optimized_dir = wizard_dir / "optimized"
    try:
        optimized_pdf = await compile_latex(clean_latex, optimized_dir)
        # Also copy to the standard location for the serving endpoint
        final_optimized = generated_dir / f"{cv_id}_optimized.pdf"
        shutil.copy2(optimized_pdf, final_optimized)
    except RuntimeError as e:
        logger.error(f"Failed to compile optimized LaTeX: {e}", exc_info=True)
        raise

    # Compile highlighted PDF
    highlighted_dir = wizard_dir / "highlighted"
    try:
        highlighted_pdf = await compile_latex(highlighted_latex, highlighted_dir)
        # Also copy to the standard location for the serving endpoint
        final_highlighted = generated_dir / f"{cv_id}_highlighted.pdf"
        shutil.copy2(highlighted_pdf, final_highlighted)
    except RuntimeError as e:
        logger.error(f"Failed to compile highlighted LaTeX: {e}", exc_info=True)
        raise

    logger.info(
        f"Applied {len(accepted_ids)} changes for {cv_id}/{job_id}, "
        f"compiled optimized and highlighted PDFs"
    )

    return (
        f"/api/cv/{cv_id}/original",
        f"/api/cv/{cv_id}/optimized",
        f"/api/cv/{cv_id}/highlighted",
    )

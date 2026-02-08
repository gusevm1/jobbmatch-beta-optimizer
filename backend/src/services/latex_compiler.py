import asyncio
import re
from pathlib import Path

# Fonts known to be available in our Docker image (texlive + dejavu)
SAFE_FONTS = {"DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono",
              "Latin Modern Roman", "Latin Modern Sans", "Latin Modern Mono"}


def _sanitize_fonts(latex: str) -> str:
    """Replace unknown font names with DejaVu equivalents to avoid fontspec errors."""
    # Match \setmainfont{...}, \setsansfont{...}, \setmonofont{...}, \newfontfamily\..{...}
    def replace_font(match: re.Match) -> str:
        cmd = match.group(1)
        font = match.group(2)
        if font in SAFE_FONTS:
            return match.group(0)
        # Map to DejaVu equivalents
        if "mono" in cmd.lower() or "typewriter" in cmd.lower():
            return f"{cmd}{{DejaVu Sans Mono}}"
        elif "sans" in cmd.lower():
            return f"{cmd}{{DejaVu Sans}}"
        else:
            return f"{cmd}{{DejaVu Serif}}"

    latex = re.sub(
        r'(\\(?:setmainfont|setsansfont|setmonofont|newfontfamily\\[a-zA-Z]+))\s*\{([^}]+)\}',
        replace_font, latex
    )
    # Also handle \setmainfont[...]{FontName} with options
    latex = re.sub(
        r'(\\(?:setmainfont|setsansfont|setmonofont))\s*\[[^\]]*\]\s*\{([^}]+)\}',
        replace_font, latex
    )
    return latex


async def compile_latex(latex: str, output_dir: Path) -> Path:
    """Compile a LaTeX string to PDF using xelatex. Returns path to the compiled PDF."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Sanitize font names to only use available fonts
    latex = _sanitize_fonts(latex)

    # Write the .tex file
    tex_path = output_dir / "document.tex"
    tex_path.write_text(latex, encoding="utf-8")

    # Run xelatex twice for proper cross-references
    for _ in range(2):
        proc = await asyncio.create_subprocess_exec(
            "xelatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory", str(output_dir),
            str(tex_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
        except asyncio.TimeoutError:
            proc.kill()
            raise RuntimeError("LaTeX compilation timed out after 60 seconds")

    pdf_path = output_dir / "document.pdf"
    if not pdf_path.exists():
        # Read log for error details
        log_path = output_dir / "document.log"
        log_content = ""
        if log_path.exists():
            log_content = log_path.read_text(encoding="utf-8", errors="replace")
            # Extract just the error lines
            error_lines = [
                line for line in log_content.split("\n")
                if line.startswith("!") or "Error" in line
            ]
            log_content = "\n".join(error_lines[:10]) if error_lines else "See full log for details"
        raise RuntimeError(f"LaTeX compilation failed. Errors:\n{log_content}")

    return pdf_path

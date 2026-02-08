import asyncio
from pathlib import Path


async def compile_latex(latex: str, output_dir: Path) -> Path:
    """Compile a LaTeX string to PDF using pdflatex. Returns path to the compiled PDF."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # Write the .tex file
    tex_path = output_dir / "document.tex"
    tex_path.write_text(latex, encoding="utf-8")

    # Run pdflatex twice for proper cross-references
    for _ in range(2):
        proc = await asyncio.create_subprocess_exec(
            "pdflatex",
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

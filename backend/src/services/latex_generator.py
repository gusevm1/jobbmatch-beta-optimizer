from src.services.anthropic_client import generate_latex_from_images


async def generate_latex(images: list[bytes]) -> str:
    """Convert PDF page images to a LaTeX document via Claude vision."""
    return await generate_latex_from_images(images)

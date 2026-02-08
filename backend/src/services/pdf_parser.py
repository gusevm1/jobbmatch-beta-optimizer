from pathlib import Path

import fitz  # PyMuPDF


def pdf_to_images(pdf_path: Path) -> list[bytes]:
    """Convert each page of a PDF to a PNG image at 300 DPI."""
    doc = fitz.open(str(pdf_path))
    images: list[bytes] = []

    for page in doc:
        # 300 DPI: default is 72, so scale factor is 300/72 ≈ 4.17
        mat = fitz.Matrix(300 / 72, 300 / 72)
        pix = page.get_pixmap(matrix=mat)
        images.append(pix.tobytes("png"))

    doc.close()
    return images

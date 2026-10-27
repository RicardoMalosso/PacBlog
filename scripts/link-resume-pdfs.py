"""Add localized portfolio footer links to résumé PDFs (requires PyMuPDF)."""
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[1]
FILES = {"Ricardo_Malosso_Resume_EN.pdf": ("en", "Portfolio"),
         "Ricardo_Malosso_CV.pdf": ("pt-br", "Portfólio")}

for filename, (locale, label) in FILES.items():
    path = ROOT / "public" / "resumes" / filename
    uri = f"https://ricardomalosso.github.io/PacBlog/{locale}/"
    doc = fitz.open(path)
    changed = False
    for page in doc:
        if any(link.get("uri") == uri for link in page.get_links()):
            continue
        text = f"{label}: ricardomalosso.github.io/PacBlog/{locale}/"
        size = 7
        width = fitz.get_text_length(text, fontname="helv", fontsize=size)
        x = (page.rect.width - width) / 2
        y = page.rect.height - 23
        page.insert_text((x, y), text, fontname="helv", fontsize=size,
                         color=(0.15, 0.28, 0.42))
        page.insert_link({"kind": fitz.LINK_URI, "from": fitz.Rect(x, y - size, x + width, y + 2), "uri": uri})
        changed = True
    if changed:
        temporary = path.with_suffix(".linked.pdf")
        doc.save(temporary, garbage=4, deflate=True)
        doc.close()
        temporary.replace(path)
    else:
        doc.close()

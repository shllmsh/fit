"""Render the approved 25-page PDF to lossless artwork; keep PDF unmodified."""
import argparse
import json
from pathlib import Path

import fitz
from PIL import Image
from build_transition_previews import write_previews

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    8: ('home', 1), 9: ('about', 2), 10: ('shared', 4),
    11: ('event-price', 15), 12: ('turnkey', 16), 13: ('booking', 24),
    14: ('shared-gallery-1', 7), 15: ('shared-gallery-2', 8), 16: ('shared-gallery-3', 9),
    17: ('guest', 12), 18: ('company', 13), 19: ('timing', 17), 20: ('four-hours', 18),
    21: ('equipment', 14), 22: ('boss', 19), 23: ('boss-result', 20),
    24: ('boss-price', 21), 25: ('contacts', 25), 26: ('custom', 23), 27: ('workshops', 22),
    28: ('events', 3), 29: ('mini', 6), 30: ('mini-gallery', 11),
    31: ('composite', 5), 32: ('composite-gallery', 10),
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    args = parser.parse_args()
    doc = fitz.open(args.pdf)
    if len(doc) != 25 or any(page.rect.width != 1920 or page.rect.height != 1080 for page in doc):
        raise ValueError('Expected the approved 25-page, 1920×1080 presentation.')
    output = ROOT / 'public/screens'
    output.mkdir(parents=True, exist_ok=True)
    text = {}
    for asset, (screen, page_number) in PAGES.items():
        page = doc[page_number - 1]
        pix = page.get_pixmap(alpha=False)
        image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        image.save(output / f'{asset}.webp', lossless=True, method=6)
        text[screen] = page.get_text().strip()
        print(f'{screen}: page {page_number}, {image.width}×{image.height}', flush=True)
    (ROOT / 'src/screen-text.json').write_text(json.dumps(text, ensure_ascii=False, indent=2) + '\n')
    write_previews()


if __name__ == '__main__':
    main()

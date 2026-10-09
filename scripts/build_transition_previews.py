"""Embed small copies of every screen so navigation never waits for the network."""
import base64
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def write_previews():
    previews = {}
    for path in sorted((ROOT / 'public/screens').glob('*.webp')):
        with Image.open(path) as original:
            preview = original.convert('RGB').resize((960, 540), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            preview.save(output, format='WEBP', quality=78, method=6)
        previews[path.stem] = 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode('ascii')
    if len(previews) != 25:
        raise ValueError('Expected all 25 approved screens.')
    target = ROOT / 'src/transition-previews.json'
    target.write_text(json.dumps(previews, separators=(',', ':')) + '\n')
    print(f'Saved 25 transition previews: {target.stat().st_size} bytes.')


if __name__ == '__main__':
    write_previews()

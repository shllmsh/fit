"""Package the production site into one HTML file that works without a server."""
import argparse
import base64
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    dist = ROOT / 'dist'
    html = (dist / 'index.html').read_text()
    script = re.search(r'<script[^>]+src="([^"]+)"[^>]*></script>', html)
    style = re.search(r'<link[^>]+href="([^"]+\.css)"[^>]*>', html)
    if script is None or style is None:
        raise ValueError('Run npm run build first: expected a single JS/CSS bundle.')
    javascript = (dist / script[1].lstrip('/')).read_text()
    stylesheet = (dist / style[1].lstrip('/')).read_text()
    if '</script' in javascript.lower() or '</style' in stylesheet.lower():
        raise ValueError('The bundle contains an HTML closing tag; inline packaging needs escaping.')
    artwork = {
        path.stem: 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
        for path in sorted((dist / 'screens').glob('*.webp'))
    }
    if len(artwork) != 25:
        raise ValueError('Expected all 25 artwork files.')
    html = html.replace(script[0], '')
    html = html.replace(style[0], f'<style>{stylesheet}</style>')
    inline = '<script>window.FIT_ARTWORK=' + json.dumps(artwork, separators=(',', ':')) + ';</script>'
    inline += f'<script>{javascript}</script>'
    html = html.replace('</body>', inline + '\n</body>')
    args.output.write_text(html)
    print(f'Saved {args.output}: {args.output.stat().st_size} bytes; 25 embedded screens.')


if __name__ == '__main__':
    main()

"""Check static HTML assets, accounting for Vercel redirects and SPA routes."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
root = Path(__file__).resolve().parents[1]
errors = []
class Check(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('href', 'src') or not value:
                continue
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            route = unquote(parsed.path)
            if route in ('/dachwerk/datenschutz', '/dachwerk/datenschutz.html'):
                continue
            if route.startswith('/grammarfirst/lingora/') and not Path(route).suffix:
                continue
            target = root / route.lstrip('/') if route.startswith('/') else self.file.parent / route
            if not any(p.exists() for p in (target, target.with_suffix('.html'), target / 'index.html')):
                errors.append(f'{self.file.relative_to(root)}: {value}')
files = [p for p in root.rglob('*.html') if not set(p.relative_to(root).parts) & {'node_modules', '.git', 'tmp', 'output', 'src'}]
for file in files:
    parser = Check()
    parser.file = file
    parser.feed(file.read_text())
print(f'Checked {len(files)} HTML files; {len(errors)} missing references.')
for error in errors:
    print(error)
raise SystemExit(bool(errors))

"""Check that every local src/href/srcset/poster in the site's HTML resolves to a real file.
Also flags root-absolute ("/...") links, which break on GitHub Pages project sites.
Run from the repo root:  python3 tools/check-links.py"""
import re, os, glob, sys
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATTR = re.compile(r'''\b(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']''', re.I)
SRCSET = re.compile(r'''\bsrcset\s*=\s*["']([^"']+)["']''', re.I)
CSSURL = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''')

bad, absolute, checked = [], [], 0
files = sorted(glob.glob(os.path.join(ROOT, '*.html'))) + sorted(glob.glob(os.path.join(ROOT, 'css', '*.css')))
for page in files:
    text = open(page, encoding='utf-8').read()
    refs = ATTR.findall(text) + CSSURL.findall(text)
    for s in SRCSET.findall(text):
        refs += [c.strip().split()[0] for c in s.split(',') if c.strip()]
    for ref in refs:
        if ref.startswith(('http://', 'https://', 'mailto:', 'tel:', 'data:', '#', '%23', 'javascript:', '//')):
            continue
        if ref.startswith('/'):
            absolute.append((os.path.basename(page), ref)); continue
        path = unquote(urlsplit(ref).path)
        if not path: continue
        target = os.path.normpath(os.path.join(os.path.dirname(page), path))
        checked += 1
        if not os.path.exists(target):
            bad.append((os.path.relpath(page, ROOT), ref))

print(f'checked {checked} local references in {len(files)} files')
for p, r in absolute: print(f'  ROOT-ABSOLUTE  {p}: {r}')
for p, r in bad:      print(f'  MISSING        {p}: {r}')
print('OK: all references resolve' if not bad and not absolute else f'{len(bad)} missing, {len(absolute)} root-absolute')
sys.exit(1 if bad or absolute else 0)

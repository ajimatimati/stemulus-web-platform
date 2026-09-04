"""
Swap PNG/JPG image references to WebP across all HTML/CSS/JS files.
Run from project root: python tools/swap_webp.py
"""
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

SKIP_DIRS = {'node_modules', '_archive', 'dist', 'scratch', '.git', 'tools'}

# ── Build set of all WebP files that exist on disk ───────────────────────────
webp_files = set()
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for f in files:
        if f.lower().endswith('.webp'):
            rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace('\\', '/')
            webp_files.add(rel)

print(f"WebP files on disk: {len(webp_files)}")

def has_webp(img_ref):
    norm = img_ref.strip('/').lstrip('./').replace('\\', '/')
    base = re.sub(r'\.(png|jpg|jpeg)$', '', norm, flags=re.I)
    return (base + '.webp') in webp_files

def swap(img_ref):
    return re.sub(r'\.(png|jpg|jpeg)$', '.webp', img_ref, flags=re.I)

# Match image paths inside quotes that come from our known image dirs
IMG_RE = re.compile(
    r'((?:assets/images|images/portal|images/)[^\s"\'`<>)]+\.(?:png|jpg|jpeg))',
    re.IGNORECASE
)

SKIP_PATTERNS = ['og-image']  # keep these as JPEG

total = 0
changed = []

for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fname in files:
        if not any(fname.endswith(e) for e in ('.html', '.css', '.js')):
            continue
        if fname.endswith('.min.js') or fname.endswith('.min.css'):
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            content = open(fpath, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        original = content

        def replacer(m):
            ref = m.group(1)
            for skip in SKIP_PATTERNS:
                if skip in ref:
                    return ref
            if has_webp(ref):
                return swap(ref)
            return ref

        content = IMG_RE.sub(replacer, content)

        if content != original:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            rel = os.path.relpath(fpath, ROOT).replace('\\', '/')
            # count how many substitutions
            orig_matches = IMG_RE.findall(original)
            new_matches = IMG_RE.findall(content)
            n = sum(1 for o, n2 in zip(orig_matches, new_matches) if o != n2)
            total += n
            changed.append(f"{rel}  ({n} swaps)")

print(f"Total swaps: {total}")
print(f"Files changed: {len(changed)}")
for f in sorted(changed):
    print(f"  {f}")

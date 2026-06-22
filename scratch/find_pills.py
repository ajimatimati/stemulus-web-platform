import os
import re

root_dir = r"c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus"
exclude_dirs = {".vscode", ".git", "All img assests", "images", "scratch"}

css_files = []
js_files = []
html_files = []

for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        path = os.path.join(root, file)
        ext = os.path.splitext(file)[1].lower()
        if ext == ".css":
            css_files.append(path)
        elif ext == ".js":
            js_files.append(path)
        elif ext == ".html":
            html_files.append(path)

output_lines = []
output_lines.append(f"Found {len(css_files)} CSS, {len(js_files)} JS, and {len(html_files)} HTML files.\n")

output_lines.append("\n--- CSS PILL SEARCH ---")
for path in css_files:
    rel_path = os.path.relpath(path, root_dir)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    matches = re.finditer(r"border-radius:\s*([^;]+);", content, re.IGNORECASE)
    for m in matches:
        val = m.group(1).strip()
        if any(p in val for p in ["9999px", "999px", "99px", "60px", "30px", "40px"]):
            line_no = content.count("\n", 0, m.start()) + 1
            output_lines.append(f"{rel_path}:{line_no} -> {m.group(0)}")

output_lines.append("\n--- HTML PILL SEARCH ---")
for path in html_files:
    rel_path = os.path.relpath(path, root_dir)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # Check for rounded-full class in html
    matches = re.finditer(r"<([a-z0-9]+)\s+[^>]*class=\"([^\"]*rounded-full[^\"]*)\"", content, re.IGNORECASE)
    for m in matches:
        tag = m.group(1).lower()
        cls = m.group(2)
        line_no = content.count("\n", 0, m.start()) + 1
        is_circle = tag == "img" or "w-10 h-10" in cls or "w-12 h-12" in cls or "w-16 h-16" in cls or "w-8 h-8" in cls or "w-6 h-6" in cls or "w-24 h-24" in cls or "w-20 h-20" in cls or "w-32 h-32" in cls or "w-48 h-48" in cls or "rounded-full p-1" in cls or "w-14 h-14" in cls or "avatar" in cls or "w-5 h-5" in cls or "w-4 h-4" in cls
        if not is_circle:
            output_lines.append(f"{rel_path}:{line_no} -> <{tag} class=\"{cls}\">")

output_lines.append("\n--- JS PILL SEARCH ---")
for path in js_files:
    rel_path = os.path.relpath(path, root_dir)
    # Skip minified files
    if rel_path.endswith(".min.js"):
        continue
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    for p in ["rounded-full", "9999px", "999px", "30px", "60px"]:
        matches = re.finditer(re.escape(p), content)
        for m in matches:
            line_no = content.count("\n", 0, m.start()) + 1
            snippet = content[max(0, m.start()-40):min(len(content), m.end()+40)].replace("\n", " ")
            output_lines.append(f"{rel_path}:{line_no} ({p}) -> ...{snippet}...")

# Write to output file
out_path = os.path.join(root_dir, "scratch", "find_pills_output.txt")
with open(out_path, "w", encoding="utf-8") as out_f:
    out_f.write("\n".join(output_lines))

print(f"Results written to: {out_path}")

import os

root_dir = r"c:\Users\USER\OneDrive\Desktop\HTMLCSSJS GEM STEMulus"

html_files = [
    "404.html",
    "ai-machine-learning.html",
    "arduino-robotics.html",
    "blog-template.html",
    "creative-coding.html",
    "digital-art.html",
    "fullstack-web-dev.html",
    "join-as-tutor.html",
    "junior-robotics.html",
    "python-programming.html",
    "scratch-creators.html",
    "web-wizards.html",
    "blog-coding-readiness.html",
    "blog-daniel-spotlight.html",
    "blog-scratch-first-language.html",
    "blog.html",
    "contact.html",
]

for filename in html_files:
    path = os.path.join(root_dir, filename)
    if not os.path.exists(path):
        continue
    
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    original_content = content
    
    replacements = [
        ("px-10 rounded-full", "px-10 rounded-xl"),
        ("px-8 rounded-full", "px-8 rounded-xl"),
        ("px-6 py-3 rounded-full", "px-6 py-3 rounded-xl"),
        ("px-4 py-2 rounded-full", "px-4 py-2 rounded-xl"),
        ("px-3 py-1 rounded-full", "px-3 py-1 rounded-xl"),
        ("py-4 px-10 rounded-full", "py-4 px-10 rounded-xl"),
        ("px-3 py-1.5 rounded-full", "px-3 py-1.5 rounded-xl"),
        ("rounded-full text-lg", "rounded-xl text-lg"),
        ("rounded-full text-xs font-bold shadow-lg", "rounded-xl text-xs font-bold shadow-lg"),
        ("rounded-full text-xs font-bold uppercase", "rounded-xl text-xs font-bold uppercase"),
        ("rounded-full px-6 py-3", "rounded-xl px-6 py-3"),
        ("rounded-full px-4 py-2", "rounded-xl px-4 py-2"),
        ("rounded-full mb-4", "rounded-xl mb-4"),
        ("rounded-full uppercase tracking-widest", "rounded-xl uppercase tracking-widest"),
        ("rounded-full uppercase tracking-wider", "rounded-xl uppercase tracking-wider"),
        ("rounded-full font-bold", "rounded-xl font-bold"),
        ("rounded-full border border-gray-200", "rounded-xl border border-gray-200"),
    ]
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    if content != original_content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated pills in {filename}")
    else:
        print(f"No pills replaced in {filename}")

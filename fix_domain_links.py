import os
import re
import glob

TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"

def fix_domain_links(file_path, depth):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if depth == 0:
        prefix = "./"
    else:
        prefix = "../" * depth

    def repl_domain_link(match):
        path = match.group(1) # e.g. /company/
        if path == "" or path == "/":
            return f'href="{prefix}index.html"'
        path = path.lstrip("/")
        if path.endswith("/"):
            path += "index.html"
        elif not re.search(r'\.[a-zA-Z0-9]+$', path):
            path += "/index.html"
        return f'href="{prefix}{path}"'

    # Match href="https://www.re-inception.co.jp/..."
    content = re.sub(r'href=["\']https://www\.re-inception\.co\.jp(/[^"\']*)["\']', repl_domain_link, content)
    # Also match src="https://www.re-inception.co.jp/..."
    content = re.sub(r'src=["\']https://www\.re-inception\.co\.jp(/[^"\']*)["\']', lambda m: f'src="{prefix}{m.group(1).lstrip("/")}"', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    html_files = glob.glob(os.path.join(TARGET_DIR, "**/*.html"), recursive=True)
    for html_file in html_files:
        rel_path = os.path.relpath(html_file, TARGET_DIR)
        depth = len(rel_path.split(os.sep)) - 1
        fix_domain_links(html_file, depth)
    print("Domain links fixed.")

if __name__ == "__main__":
    main()

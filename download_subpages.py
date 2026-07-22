import os
import re
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError
import glob

BASE_URL = "https://www.re-inception.co.jp"
TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"

SUBPAGES = [
    "/company/",
    "/privacy/",
    "/contact/",
    "/sitepolicy/",
    "/sitemap/",
    "/report/",
    "/news/",
    "/article/",
    "/article/for-lessees/genchi-kengaku/naiken/",
    "/article/for-lessees/tenkyo/hikkoshi/"
]

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    full_url = urllib.parse.urljoin(BASE_URL, url)
    print(f"Downloading {full_url} to {target_path}")
    
    req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
    except HTTPError as e:
        print(f"HTTP Error: {e.code} for {full_url}")
    except URLError as e:
        print(f"URL Error: {e.reason} for {full_url}")
    except Exception as e:
        print(f"Error: {e} for {full_url}")

def extract_and_download_assets(html_content):
    links = re.findall(r'<link[^>]+href=["\'](/[^"\']+)["\']', html_content)
    scripts = re.findall(r'<script[^>]+src=["\'](/[^"\']+)["\']', html_content)
    images = re.findall(r'<img[^>]+src=["\'](/[^"\']+)["\']', html_content)
    
    all_assets = set(links + scripts + images)
    
    for asset in all_assets:
        if asset == "/" or asset.endswith("/"):
            continue
        if asset.startswith("/"):
            relative_path = asset.lstrip("/")
            target_path = os.path.join(TARGET_DIR, relative_path.replace("/", os.sep))
            if not os.path.exists(target_path):
                download_file(asset, target_path)

def fix_paths_in_html(file_path, depth):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Calculate prefix for relative paths based on depth
    if depth == 0:
        prefix = "./"
    else:
        prefix = "../" * depth

    # Fix root-relative links for assets
    content = re.sub(r'href=["\'](/[^"\']*\.[a-zA-Z0-9]+)["\']', f'href="{prefix}\\1"', content)
    content = re.sub(r'src=["\'](/[^"\']+)["\']', f'src="{prefix}\\1"', content)
    # Background images
    content = re.sub(r'url\([\'"]?(/[^)\'"]+)[\'"]?\)', f'url({prefix}\\1)', content)
    
    # Also fix root-relative links to other pages (directories)
    # e.g., href="/company/" -> href="../company/index.html"
    def repl_dir_link(match):
        path = match.group(1)
        if path == "/":
            return f'href="{prefix}index.html"'
        # Strip leading slash
        path = path.lstrip("/")
        # If it ends with slash, append index.html
        if path.endswith("/"):
            path += "index.html"
        elif not re.search(r'\.[a-zA-Z0-9]+$', path):
            path += "/index.html"
        return f'href="{prefix}{path}"'

    content = re.sub(r'href=["\'](/[a-zA-Z0-9_/-]*/)["\']', repl_dir_link, content)
    # Cleanup any double slashes caused by regex replacement like href="..//company..."
    content = content.replace(f'href="{prefix}/', f'href="{prefix}')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    # 1. Download HTML for subpages
    for url in SUBPAGES:
        # url is like /company/
        dir_path = url.strip("/")
        target_path = os.path.join(TARGET_DIR, dir_path.replace("/", os.sep), "index.html")
        download_file(url, target_path)

    # 2. Extract and download new assets from all html files
    html_files = glob.glob(os.path.join(TARGET_DIR, "**/*.html"), recursive=True)
    for html_file in html_files:
        with open(html_file, "r", encoding="utf-8") as f:
            extract_and_download_assets(f.read())

    # 3. Fix paths in all HTML files
    for html_file in html_files:
        # Calculate depth
        rel_path = os.path.relpath(html_file, TARGET_DIR)
        depth = len(rel_path.split(os.sep)) - 1
        fix_paths_in_html(html_file, depth)

    print("Subpages cloned and paths fixed.")

if __name__ == "__main__":
    main()

import os
import re
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError
import glob

BASE_URL = "https://www.re-inception.co.jp"
TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"

def download_file(full_url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path):
        return  # Skip if already downloaded

    print(f"Downloading {full_url} to {target_path}")
    req = urllib.request.Request(full_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response, open(target_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
    except HTTPError as e:
        print(f"HTTP Error: {e.code} for {full_url}")
    except Exception as e:
        print(f"Error: {e} for {full_url}")

def process_css_files():
    css_files = glob.glob(os.path.join(TARGET_DIR, "**/*.css"), recursive=True)
    
    for css_file in css_files:
        # Calculate the absolute url path for this css file
        # TARGET_DIR is the root
        rel_css_path = os.path.relpath(css_file, TARGET_DIR).replace(os.sep, "/")
        css_url = urllib.parse.urljoin(BASE_URL, "/" + rel_css_path)
        
        with open(css_file, "r", encoding="utf-8") as f:
            content = f.read()
            
        # extract url(...)
        urls = re.findall(r'url\s*\(\s*[\'"]?([^\'"\)]+)[\'"]?\s*\)', content)
        for url in urls:
            if url.startswith("data:"):
                continue
            
            # Resolve url against css_url
            asset_full_url = urllib.parse.urljoin(css_url, url)
            
            # Determine target_path
            # Parse the path from the asset_full_url
            parsed_url = urllib.parse.urlparse(asset_full_url)
            asset_rel_path = parsed_url.path.lstrip("/")
            
            if asset_rel_path:
                target_path = os.path.join(TARGET_DIR, asset_rel_path.replace("/", os.sep))
                download_file(asset_full_url, target_path)

if __name__ == "__main__":
    process_css_files()
    print("CSS image download process completed.")

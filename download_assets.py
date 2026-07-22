import os
import re
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError

# Base URL of the target website
BASE_URL = "https://www.re-inception.co.jp"
TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"
HTML_FILE = os.path.join(TARGET_DIR, "original_index.html")

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    if os.path.exists(target_path):
        return  # Skip if already downloaded

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

def extract_and_download(html_content):
    # Find links (CSS, icons)
    links = re.findall(r'<link[^>]+href=["\'](/[^"\']+)["\']', html_content)
    # Find scripts
    scripts = re.findall(r'<script[^>]+src=["\'](/[^"\']+)["\']', html_content)
    # Find images
    images = re.findall(r'<img[^>]+src=["\'](/[^"\']+)["\']', html_content)
    
    all_assets = set(links + scripts + images)
    
    for asset in all_assets:
        # Avoid downloading root directory index
        if asset == "/" or asset.endswith("/"):
            continue
        # Only download paths starting with /
        if asset.startswith("/"):
            relative_path = asset.lstrip("/")
            target_path = os.path.join(TARGET_DIR, relative_path.replace("/", os.sep))
            download_file(asset, target_path)

if __name__ == "__main__":
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    extract_and_download(content)
    print("Asset download process completed.")

import os
import re

TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"
INPUT_FILE = os.path.join(TARGET_DIR, "original_index.html")
OUTPUT_FILE = os.path.join(TARGET_DIR, "index.html")

def fix_paths():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace href="/..." with href="./..."
    content = re.sub(r'href=["\'](/[^"\']+)["\']', r'href=".\1"', content)
    
    # Replace src="/..." with src="./..."
    content = re.sub(r'src=["\'](/[^"\']+)["\']', r'src=".\1"', content)

    # Some images might have style="background: url(/...)" or similar
    content = re.sub(r'url\([\'"]?(/[^)\'"]+)[\'"]?\)', r'url(.\1)', content)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Fixed paths and saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    fix_paths()

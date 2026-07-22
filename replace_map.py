import os
import glob
import re

TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"

# Google Maps iframe for 〒610-0101 京都府城陽市平川中道表１５－６ 株式会社INCEPTION
IFRAME_HTML = """
    <div class="gmap-iframe-container" style="width: 100%; text-align: center; margin: 20px 0;">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3274.6033789078434!2d135.76712957619213!3d34.84138107572765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60011116c117f7df%3A0xe54bb3f090b83e60!2z44CSNjEwLTAxMDEg5Lqs6YO95bqc5Z-O6Zm95biC5bmz5bed5Lit6YGT6KGo77yR77yV4oiS77yW!5e0!3m2!1sja!2sjp!4v1700000000000!5m2!1sja!2sjp" width="100%" height="400" style="border:0; max-width:800px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
"""

def replace_map_in_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match the old map canvas div
    # It looks like: <div class="element-map-canvas" id="map_others_canvas" ... ></div>
    pattern = re.compile(r'<div class="element-map-canvas"[^>]*></div>', re.MULTILINE | re.DOTALL)
    
    modified_content, num_subs = pattern.subn(IFRAME_HTML, content)
    
    if num_subs > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        print(f"Replaced map in {file_path}")

def main():
    html_files = glob.glob(os.path.join(TARGET_DIR, "**/*.html"), recursive=True)
    for html_file in html_files:
        replace_map_in_html(html_file)

if __name__ == "__main__":
    main()

import os
import re
import glob

TARGET_DIR = r"C:\Users\choko\.gemini\antigravity\scratch\re_inception"

def clean_html(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Define regex pattern to match Google tag container
    # Matches everything from <!-- Google tag (gtag.js) --> up to </script> after window.dataLayer
    pattern = re.compile(
        r'<!--\s*Google tag \(gtag\.js\)\s*-->\s*'
        r'<script async src="https://www\.googletagmanager\.com/gtag/js\?id=G-CGY875M4FR"></script>\s*'
        r'<script>\s*window\.dataLayer = window\.dataLayer \|\| \[\];\s*'
        r'function gtag\(\)\{dataLayer\.push\(arguments\);\}\s*'
        r'gtag\(\'js\', new Date\(\)\);\s*'
        r'gtag\(\'config\', \'G-CGY875M4FR\'\);\s*'
        r'</script>',
        re.DOTALL | re.IGNORECASE
    )

    cleaned_content = pattern.sub('', content)

    # Optional: also remove fb-root and fb-like if they are tracking related and not actively used, but let's just focus on GA purely first
    # Or keep it for SNS buttons to render if that is intended functionality.

    if content != cleaned_content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(cleaned_content)
        print(f"Cleaned tracking tags from {file_path}")

def modify_form_action(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Modify the form tag in contact/index.html to prepare for Netlify forms
    # Example: <form method="post" action="https://www.re-inception.co.jp/contact/confirm/" name="Form" id="Form">
    # Replace action with a local placeholder or add netlify attributes

    if "<form" in content:
        # We will change the action to javascript:void(0) or empty for now, and add data-netlify="true" placeholder for Netlify usage.
        content = re.sub(
            r'<form\s+method=["\'][^"\']+["\']\s+action=["\']https://www\.re-inception\.co\.jp/contact/confirm/["\']\s+name=["\']Form["\']\s+id=["\']Form["\']>',
            r'<form method="POST" name="contact" data-netlify="true">',
            content,
            flags=re.IGNORECASE
        )
        
        # Another common pattern if relative path was used
        content = re.sub(
            r'<form\s+method=["\'][^"\']+["\']\s+action=["\']\.\./contact/confirm/["\']\s+name=["\']Form["\']\s+id=["\']Form["\']>',
            r'<form method="POST" name="contact" data-netlify="true">',
            content,
            flags=re.IGNORECASE
        )

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Modified form action in {file_path}")

def main():
    html_files = glob.glob(os.path.join(TARGET_DIR, "**/*.html"), recursive=True)
    for html_file in html_files:
        clean_html(html_file)
        if "contact" in html_file:
            modify_form_action(html_file)

    print("Cleanup process completed.")

if __name__ == "__main__":
    main()

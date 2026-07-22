import os

files = [
    "index.html",
    "contact.html",
    "privacy.html",
    "hikkoshi.html",
    "naiken.html",
    "report.html",
    "article.html",
    "sitepolicy.html",
    "sitemap.xml",
    "robots.txt"
]

old_domain = "https://hilarious-khapse-ee3f7a.netlify.app"
new_domain = "https://re-inception.com"

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        content = content.replace(old_domain, new_domain)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")

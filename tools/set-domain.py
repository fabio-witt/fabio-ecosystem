#!/usr/bin/env python3
"""
Switch every absolute link (canonical, og:url, sitemap, robots, structured data)
from the Vercel address to your own domain.

Usage, after the domain is connected in Vercel:
    python3 tools/set-domain.py https://fabio-witt.com
Run it from the repository root, then commit and push with GitHub Desktop.
"""
import pathlib
import sys

OLD = "https://fabio-ecosystem-ashy.vercel.app"

def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
        sys.exit("Usage: python3 tools/set-domain.py https://your-domain.com")
    new = sys.argv[1].rstrip("/")
    root = pathlib.Path(__file__).resolve().parent.parent
    changed = 0
    for path in root.rglob("*"):
        if path.suffix not in {".html", ".xml", ".txt", ".json", ".js", ".webmanifest"}:
            continue
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if OLD in text:
            path.write_text(text.replace(OLD, new), encoding="utf-8")
            changed += 1
    print(f"{changed} files now use {new}")

if __name__ == "__main__":
    main()

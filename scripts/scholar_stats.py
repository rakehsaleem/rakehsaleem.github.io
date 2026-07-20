#!/usr/bin/env python3
"""Fetch Google Scholar profile stats into assets/scholar.json.

Runs daily via GitHub Actions (.github/workflows/scholar.yml).
Uses only the Python standard library. If Scholar blocks the request,
the script exits non-zero and the previous scholar.json is kept.
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone

SCHOLAR_USER = "sNDGyTYAAAAJ"
URL = (
    "https://scholar.google.com/citations?user="
    + SCHOLAR_USER
    + "&hl=en&cstart=0&pagesize=100"
)
OUT = "assets/scholar.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def main() -> int:
    req = urllib.request.Request(URL, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001
        print(f"fetch failed: {exc}", file=sys.stderr)
        return 1

    # Sidebar table: [citations_all, citations_recent, h_all, h_recent, i10_all, i10_recent]
    std = re.findall(r'class="gsc_rsb_std">(\d+)<', html)
    if len(std) < 3:
        print("could not parse citation table (page layout change or block page)", file=sys.stderr)
        return 1
    citations, h_index = int(std[0]), int(std[2])
    i10 = int(std[4]) if len(std) >= 5 else None

    # Publication rows: title+link, per-paper citations, year
    pubs = []
    row_re = re.compile(
        r'<a[^>]+href="(/citations\?view_op=view_citation[^"]+)"[^>]*class="gsc_a_at"[^>]*>(.*?)</a>'
        r".*?class=\"gsc_a_ac[^\"]*\"[^>]*>(\d*)</a>"
        r".*?class=\"gsc_a_hc?[^\"]*\"[^>]*>(\d*)</span>",
        re.S,
    )
    for href, title, cites, year in row_re.findall(html):
        title = re.sub(r"<[^>]+>", "", title).strip()
        pubs.append(
            {
                "title": title,
                "url": "https://scholar.google.com" + href.replace("&amp;", "&"),
                "citations": int(cites) if cites else 0,
                "year": int(year) if year else None,
            }
        )
    pubs.sort(key=lambda p: p["citations"], reverse=True)

    data = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "citations": citations,
        "h_index": h_index,
        "i10_index": i10,
        "publications_count": len(pubs),
        "top": pubs[:5],
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    print(f"wrote {OUT}: {citations} citations, h-index {h_index}, {len(pubs)} pubs")
    return 0


if __name__ == "__main__":
    sys.exit(main())

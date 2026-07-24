# Rakeh Saleem — Personal Website & Research Portfolio

Source code for my professional website and research portfolio, deployed via GitHub Pages at:

**[https://rakehsaleem.github.io/](https://rakehsaleem.github.io/)**

## About

This site is a digital portfolio showcasing my work at the intersection of **AI, computer vision, and civil infrastructure engineering** — from PhD research in gaze-informed structural inspection to production machine learning systems for aviation.

It highlights:

* **Applied research** — gaze-supervised computer vision, UAV-based structural inspection, and structural health monitoring, with an interactive map of my co-author network across six countries.
* **Production ML** — demand forecasting and document-AI systems built in industry (transformers, gradient boosting, AWS).
* **Publications & talks** — 11 peer-reviewed papers with live citation metrics, plus invited talks at ETH Zürich and Thornton Tomasetti.
* **Open-source projects** — pulled live from the GitHub API.

## Technical details

No frameworks, no build system — hand-written **HTML, CSS, and vanilla JavaScript**, served directly by **GitHub Pages**. Highlights:

* **Design system** — a copper/burnt-sienna palette built entirely on CSS custom properties, with automatic light/dark theming (system preference + manual toggle).
* **Interactive research network** — a custom force-directed graph (no libraries) of co-authors and topics; edge thickness and node size scale with joint-paper count. Drag, hover, and click to explore.
* **Interactive world map** — collaborator locations on solid continents generated from Natural Earth geodata, with connection arcs, pan/zoom/pinch, and click-to-reveal detail cards.
* **Ambient background** — a dot-grid canvas with a soft cursor-proximity glow (disabled for touch devices and reduced-motion preferences).
* **Live Google Scholar stats** — a scheduled GitHub Action (`.github/workflows/scholar.yml`) refreshes `assets/scholar.json` daily; the homepage stats and top-cited publication list read from it, with graceful static fallbacks.
* **Live GitHub projects** — the projects page fetches repositories client-side, with a built-in fallback if the API is unavailable.

## Repository structure

```
index.html            Homepage
projects.html         Open-source projects (live GitHub data)
research.html         Network graph, world map, research threads, experience
publications.html     Publications & invited talks
contact.html          Contact form + "open to" tracks
404.html              Not-found page (self-contained)
assets/
  style.css           All styling (light + dark themes)
  main.js             Theme toggle, background canvas, marquee, stats
  scholar.json        Auto-refreshed Scholar metrics
  logos/              Affiliation logos for the marquee
scripts/
  scholar_stats.py    Scholar scraper run by the GitHub Action
.github/workflows/
  scholar.yml         Daily Scholar stats refresh
```

## Development quickstart

```bash
# 1. Clone
git clone https://github.com/rakehsaleem/rakehsaleem.github.io.git
cd rakehsaleem.github.io

# 2. Serve locally (a local server is needed for the JSON/API fetches;
#    opening index.html directly via file:// will show fallback data)
python -m http.server 8000
# then open http://localhost:8000
```

To refresh Scholar metrics manually (useful when Google blocks GitHub's runners):

```bash
python scripts/scholar_stats.py
git add assets/scholar.json && git commit -m "refresh scholar stats" && git push
```

## Acknowledgements

Design direction inspired by [aashnadoshi.com](https://www.aashnadoshi.com/). World map geometry derived from [Natural Earth](https://www.naturalearthdata.com/) public-domain data. An earlier version of this site was built with [Hugo Blox](https://hugoblox.com/); it lives on in the `hugo-blox-backup` branch.

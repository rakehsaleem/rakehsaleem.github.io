# rakehsaleem.github.io — new site

A fast, zero-cost static portfolio. No build system, no framework — just HTML/CSS/JS
served by GitHub Pages. Design inspired by aashnadoshi.com, adapted to a copper/burnt-sienna
"research → production" identity with an interactive dot-grid background.

## Files

```
index.html          Homepage (hero, stats, selected work, recent pubs)
projects.html       Live GitHub repo cards (fetched client-side, with fallback)
publications.html   Publications + invited talks (tabbed)
contact.html        Contact cards + mailto-prefill message form
404.html            Not-found page
assets/style.css    All styling (light + dark themes via CSS variables)
assets/main.js      Theme toggle, mobile menu, interactive dot grid
assets/favicon.svg  Favicon (gaze-dot motif)
```

## BEFORE you deploy — customization checklist

1. **Email address:** set to rakeh.saleem@gmail.com per your instruction.
   NOTE: your resume header uses rakeh.muhammad@gmail.com — confirm which
   one you want the site to use (it appears 3x in contact.html).
2. **Avatar (required):** copy your photo into `assets/avatar.jpg`.
   It's in your old repo at `assets/media/` or download it from your
   current live site. Square, ≥400px recommended.
3. **Resume:** DONE — assets/resume.pdf is your uploaded CV. Replace the
   file anytime you update it; the filename stays the same.
4. **Stats:** verify the numbers in the stats band in `index.html`
   (publications, h-index, years, talks) against your Google Scholar.
5. **Publications:** add your remaining papers in `publications.html` —
   there's an HTML comment marking where; copy an existing block and edit.
   Your old repo's `content/publication/` folders have every title/link.
6. **LinkedIn URL:** verify `linkedin.com/in/rakeh-saleem/` is your handle
   (footer of every page + contact page).

## Deploy (replaces the old Hugo site)

```bash
# 1. Back up the current Hugo site to a branch
cd rakehsaleem.github.io
git checkout -b hugo-blox-backup
git push origin hugo-blox-backup

# 2. Back on main, remove the old source (keep .git!)
git checkout main
git rm -rf . && git clean -fdx    # careful: run inside the repo only

# 3. Copy in the new site files (index.html, *.html, assets/)

# 4. Disable the old Hugo build workflow if it still exists
#    (deleted by step 2 if it lived in .github/workflows)

git add -A
git commit -m "New custom site design"
git push origin main
```

Then in GitHub → repo **Settings → Pages**: set **Source** to
"Deploy from a branch", branch `main`, folder `/ (root)`.
The site is live at https://rakehsaleem.github.io within a minute or two.

## Notes

- **Gaze-trail background:** the cursor produces a live eye-tracking
  scanpath over a static calibration-grid of dots — linger and a
  numbered fixation circle grows with dwell time; move and thin dashed
  saccade lines connect fixations; the trail fades over ~3s. Uses the
  same fixation/saccade event logic as gaze analysis (dispersion
  threshold). Static dots only on touch devices / reduced motion.
  Tune in assets/main.js: FIX_DIST, GROW, FADE, MAX_FIX.
- **Projects page** fetches your repos from the GitHub API in the
  visitor's browser (60 requests/hour per visitor — plenty). If the API
  is unavailable it shows a built-in fallback list. New repos appear
  automatically; add `topics` to your repos on GitHub to get tag chips.
- **Dark mode** follows the visitor's system preference on first visit
  and remembers their toggle choice.
- **Contact form** builds a mailto: link — no backend, nothing stored.
  If you later want real form submissions, Formspree's free tier drops in
  with a two-line change.
- **Rollback:** the entire old site lives on the `hugo-blox-backup` branch.

## New in this version

- **Hero background image:** drop any photo in as `assets/hero-bg.jpg`
  (a wide landscape shot works best — ideally one of YOUR drone shots of
  Florida coast/infrastructure). It renders softly tinted and fades into
  the page. Until then, a built-in teal line-art bridge + drone
  illustration shows instead.
- **Affiliations marquee (logos):** the scrolling bar under the hero now
  shows logos, grayscale at rest and full color + name tooltip on hover.
  It tries `assets/logos/<slug>.png` first (see assets/logos/README.txt
  for the exact filenames and official download pages), falls back to
  each org's live favicon, then to the text name. Edit the ORGS array in
  `assets/main.js` to add/remove organizations.
- **Hero photo parallax:** the background image drifts a few pixels with
  the mouse (eased, max 14px; disabled on touch and reduced-motion).
  Add your photo as `assets/hero-bg.jpg` — it now renders prominently,
  Aashna-style, fading into the page. Get a Sunshine Skyway photo from
  Unsplash or Pexels (both licenses allow free use) or use your own
  drone shot. Wide landscape, ~2000px, works best.
- **Count-up stats:** stat numbers animate from 0 when scrolled into
  view. Edit via data-count / data-suffix attributes.
- **Scroll reveal:** cards and publication rows fade up as they enter
  the viewport (automatic on all pages, no markup needed).

## Live Google Scholar stats (citations, h-index, top-5 papers)

Scholar has no public API and blocks browsers, so a GitHub Action
(`.github/workflows/scholar.yml`) fetches your profile once a day from
GitHub's servers, writes `assets/scholar.json`, and commits it. The
homepage stats and the publications top-5 list read that file and update
automatically. Notes:
- Enable it once: repo Settings → Actions → allow workflows; then run it
  manually the first time (Actions tab → "Update Scholar stats" → Run).
- If Scholar blocks a run, yesterday's data is kept; if scholar.json has
  never been generated, the static fallback numbers in the HTML show.
- When previewing locally via file://, browsers block the JSON fetch, so
  you'll see fallback numbers — on GitHub Pages it works.
- Deployment note: the deploy section earlier says to remove .github/ —
  keep it now; this workflow is the one exception.

## Research page & gaze demo

`research.html` opens with an interactive demo: visitors "inspect" an
illustrated facade with their cursor (teal heatmap), then reveal
representative expert fixation hotspots (amber) concentrated on the
damage. Honest framing is included on-page: hotspots are representative
of your published findings, not raw study data. To swap the illustrated
facade for a real inspection photo later, replace the inline SVG with an
<img> and update the EXPERT hotspot coordinates (normalized 0-1) to
match the damage locations in your photo.

## Research network graph (replaces the gaze demo)

`research.html` now opens with an interactive co-author/topic network —
custom force simulation, no libraries. Drag nodes; hover to trace
connections. Edit the NODES and LINKS arrays at the bottom of
research.html to add collaborators or topics (each node: id, label,
type 'author'/'topic', optional sub for affiliation). The background
interaction site-wide is back to the quiet cursor proximity glow.

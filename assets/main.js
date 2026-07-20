/* Rakeh Saleem — shared site scripts
   1. Theme toggle (light/dark, remembered)
   2. Mobile menu
   3. Interactive dot-grid background:
      a fixed canvas of faint dots; dots near the cursor
      shade toward teal and swell slightly, with a soft
      eased falloff — a quiet nod to gaze heatmaps. */

(function () {
  var root = document.documentElement;

  /* ---------- theme ---------- */
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.setAttribute('data-theme', 'dark');
  }
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      if (dark) { root.removeAttribute('data-theme'); }
      else { root.setAttribute('data-theme', 'dark'); }
      try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) {}
      refreshPalette();
    });
  }

  /* ---------- mobile menu ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () { links.classList.toggle('open'); });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* ---------- gaze-trail background ----------
     Static dot grid (calibration-grid texture) + a live scanpath:
     linger and a numbered fixation circle grows with dwell time;
     move and a thin dashed saccade line connects to the next
     fixation. The trail fades like a decaying gaze overlay —
     the same fixation/saccade event logic used in eye-tracking
     analysis, applied to the cursor. */
  var canvas = document.getElementById('dotgrid');
  if (!canvas) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var ctx = canvas.getContext('2d');
  var SPACING = 26, DOT_R = 1.1;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, dotsLayer = null;
  var baseRGB, tealRGB, baseAlpha;

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }
  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function buildDotsLayer() {
    dotsLayer = document.createElement('canvas');
    dotsLayer.width = W * dpr; dotsLayer.height = H * dpr;
    var dctx = dotsLayer.getContext('2d');
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dctx.fillStyle = 'rgba(' + baseRGB.join(',') + ',' + baseAlpha + ')';
    for (var x = 0; x <= W + SPACING; x += SPACING) {
      for (var y = 0; y <= H + SPACING; y += SPACING) {
        dctx.beginPath(); dctx.arc(x, y, DOT_R, 0, 6.2832); dctx.fill();
      }
    }
  }

  function blitDots() {
    ctx.clearRect(0, 0, W, H);
    if (dotsLayer) ctx.drawImage(dotsLayer, 0, 0, W, H);
  }

  function refreshPalette(skipDraw) {
    var dark = root.getAttribute('data-theme') === 'dark';
    baseRGB = hexToRGB(cssVar('--line') || (dark ? '#342718' : '#EAE1D5'));
    tealRGB = hexToRGB(cssVar('--teal') || (dark ? '#E8956D' : '#B4530A'));
    baseAlpha = dark ? 0.5 : 0.8;
    if (W) buildDotsLayer();
    if (!skipDraw) { blitDots(); wake(); }
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (baseRGB) { buildDotsLayer(); blitDots(); }
  }

  refreshPalette(true);
  resize();
  blitDots();
  window.addEventListener('resize', resize);

  // Static grid only: touch devices or reduced-motion preference
  if (!finePointer || reduceMotion) {
    var wake = function () {};
    return;
  }

  /* --- scanpath state --- */
  var FIX_DIST = 9;      // px: movement below this = still fixating
  var MIN_R = 5, MAX_R = 24;
  var GROW = 0.016;      // px of radius per ms of dwell
  var FADE = 3200;       // ms for a finished fixation to fade out
  var MAX_FIX = 14;      // trail length cap
  var fixations = [];    // finished: {x,y,r,end,n}
  var cur = null;        // active:   {x,y,r,t0,n}
  var counter = 1;
  var raf = null;

  function dist(ax, ay, bx, by) {
    var dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function teal(a) { return 'rgba(' + tealRGB.join(',') + ',' + a + ')'; }

  function drawFix(f, alpha, now) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, 6.2832);
    ctx.fillStyle = teal(0.09 * alpha);
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = teal(0.55 * alpha);
    ctx.stroke();
    if (f.r >= 10) {
      ctx.fillStyle = teal(0.75 * alpha);
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(f.n), f.x, f.y);
    }
  }

  function render(now) {
    blitDots();
    var items = fixations.slice();
    if (cur) items.push(cur);
    // saccade lines between consecutive fixations
    ctx.setLineDash([3, 6]);
    ctx.lineWidth = 1;
    for (var i = 1; i < items.length; i++) {
      var a = alphaOf(items[i - 1], now), b = alphaOf(items[i], now);
      var la = Math.min(a, b);
      if (la <= 0) continue;
      ctx.strokeStyle = teal(0.4 * la);
      ctx.beginPath();
      ctx.moveTo(items[i - 1].x, items[i - 1].y);
      ctx.lineTo(items[i].x, items[i].y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (var j = 0; j < items.length; j++) {
      var al = alphaOf(items[j], now);
      if (al > 0) drawFix(items[j], al, now);
    }
  }

  function alphaOf(f, now) {
    if (!f.end) return 1;
    return Math.max(0, 1 - (now - f.end) / FADE);
  }

  function loop(now) {
    if (cur) cur.r = Math.min(MAX_R, MIN_R + (now - cur.t0) * GROW);
    // prune fully faded
    fixations = fixations.filter(function (f) { return alphaOf(f, now) > 0; });
    render(now);
    if (cur || fixations.length) {
      raf = requestAnimationFrame(loop);
    } else {
      counter = 1;      // fresh scanpath numbering next time
      blitDots();
      raf = null;
    }
  }
  function wake() { if (!raf) raf = requestAnimationFrame(loop); }

  window.addEventListener('mousemove', function (e) {
    var x = e.clientX, y = e.clientY;
    var now = performance.now();
    if (cur && dist(x, y, cur.x, cur.y) < FIX_DIST + cur.r * 0.3) {
      // still within the fixation: drift its center gently toward the cursor
      cur.x += (x - cur.x) * 0.12;
      cur.y += (y - cur.y) * 0.12;
    } else {
      if (cur) {
        cur.end = now;
        fixations.push(cur);
        if (fixations.length > MAX_FIX) fixations.shift();
      }
      cur = { x: x, y: y, r: MIN_R, t0: now, n: counter++ };
    }
    wake();
  }, { passive: true });

  document.addEventListener('mouseleave', function () {
    if (cur) { cur.end = performance.now(); fixations.push(cur); cur = null; }
    wake();
  });
})();

/* ---------- affiliations logo marquee ---------- */
(function () {
  var track = document.getElementById('affilTrack');
  if (!track) return;

  // slug -> assets/logos/<slug>.png (official logo you download);
  // domain -> automatic fallback logo pulled from the org's own web identity
  var ORGS = [
    { name: 'GA Telesis',          slug: 'ga-telesis',         domain: 'gatelesis.com' },
    { name: 'Penn State University', slug: 'penn-state',       domain: 'psu.edu' },
    { name: 'ETH Zürich',          slug: 'eth-zurich',         domain: 'ethz.ch' },
    { name: 'Chung-Ang University', slug: 'chung-ang',         domain: 'cau.ac.kr' },
    { name: 'NUST',                slug: 'nust',               domain: 'nust.edu.pk' },
    { name: 'Thornton Tomasetti',  slug: 'thornton-tomasetti', domain: 'thorntontomasetti.com' },
    { name: 'Bahria University',   slug: 'bahria',             domain: 'bahria.edu.pk' }
  ];

  function makeItem(org, isDup) {
    var item = document.createElement('span');
    item.className = 'affil-item' + (isDup ? ' dup' : '');
    var img = document.createElement('img');
    img.alt = org.name;
    img.loading = 'lazy';
    // source chain: local SVG -> local PNG -> live favicon -> text name
    var sources = [
      'assets/logos/' + org.slug + '.svg',
      'assets/logos/' + org.slug + '.png',
      'https://www.google.com/s2/favicons?domain=' + org.domain + '&sz=128'
    ];
    var i = 0;
    img.onerror = function () {
      i += 1;
      if (i < sources.length) { img.src = sources[i]; return; }
      var txt = document.createElement('span');
      txt.className = 'txt';
      txt.textContent = org.name;
      item.replaceChild(txt, img);
    };
    img.src = sources[0];
    var tip = document.createElement('span');
    tip.className = 'tip';
    tip.textContent = org.name;
    item.appendChild(img);
    item.appendChild(tip);
    return item;
  }

  // two identical sets make the loop seamless
  ORGS.forEach(function (o) { track.appendChild(makeItem(o, false)); });
  ORGS.forEach(function (o) { track.appendChild(makeItem(o, true)); });
})();

/* ---------- hero background mouse parallax ---------- */
(function () {
  var inner = document.getElementById('heroBgInner');
  if (!inner) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !finePointer) return;

  var MAX = 14; // px of drift at screen edges
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  function loop() {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    inner.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
      raf = requestAnimationFrame(loop);
    } else { raf = null; }
  }
  window.addEventListener('mousemove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * -2 * MAX;
    ty = (e.clientY / window.innerHeight - 0.5) * -2 * MAX * 0.6;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
})();

/* ---------- live Scholar stats (from assets/scholar.json) ---------- */
(function () {
  var els = document.querySelectorAll('[data-scholar]');
  if (!els.length || typeof fetch !== 'function') return;
  fetch('assets/scholar.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      els.forEach(function (el) {
        var key = el.getAttribute('data-scholar');
        var val = d[key];
        if (typeof val !== 'number' || val <= 0) return;
        // feed the live number into the count-up (or straight into the text)
        el.setAttribute('data-count', String(val));
        if (key === 'citations' || key === 'publications_count') el.setAttribute('data-suffix', '');
        el.textContent = String(val);
      });
    })
    .catch(function () { /* keep the static fallback numbers */ });
})();

/* ---------- count-up stats + scroll reveal ---------- */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window)) return;

  // Count-up: numbers with data-count animate from 0 when scrolled into view
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && !reduceMotion) {
    var counted = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || counted.has(en.target)) return;
        counted.add(en.target);
        var el = en.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var t0 = null, DUR = 900;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / DUR, 1);
          p = 1 - Math.pow(1 - p, 3); // ease-out cubic
          el.textContent = Math.round(target * p) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  // Scroll reveal: cards and publication rows fade up as they enter view
  var items = document.querySelectorAll('.card, .pub, .contact-card');
  if (items.length && !reduceMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 3, 2) * 70) + 'ms'; // slight stagger per row
      ro.observe(el);
    });
  }
})();

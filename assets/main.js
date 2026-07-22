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

  /* ---------- dot-grid background with cursor glow ----------
     A static grid of faint dots; dots within a soft radius of the
     cursor warm toward the accent and swell slightly, with an eased
     trailing motion. Deliberately quiet — texture, not spectacle. */
  var canvas = document.getElementById('dotgrid');
  if (!canvas) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var ctx = canvas.getContext('2d');
  var SPACING = 26, BASE_R = 1.1, MAX_R = 2.3, RADIUS = 125;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, cols, rows;
  var mouse = { x: -9999, y: -9999 };
  var eased = { x: -9999, y: -9999 };
  var baseRGB, tealRGB, baseAlpha, tealAlpha;

  function cssVar(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }
  function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function refreshPalette(skipDraw) {
    var dark = root.getAttribute('data-theme') === 'dark';
    baseRGB = hexToRGB(cssVar('--line') || (dark ? '#342718' : '#EAE1D5'));
    tealRGB = hexToRGB(cssVar('--teal') || (dark ? '#E8956D' : '#B4530A'));
    baseAlpha = dark ? 0.5 : 0.8;
    tealAlpha = dark ? 0.6 : 0.55;
    if (!skipDraw) drawStatic();
  }
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / SPACING) + 1;
    rows = Math.ceil(H / SPACING) + 1;
    drawStatic();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function draw(px, py) {
    if (!baseRGB || !W) return;
    ctx.clearRect(0, 0, W, H);
    // soft ambient wash of the accent around the cursor (behind the dots)
    if (px > -999) {
      var dark = root.getAttribute('data-theme') === 'dark';
      var g = ctx.createRadialGradient(px, py, 0, px, py, RADIUS * 1.5);
      g.addColorStop(0, 'rgba(' + tealRGB.join(',') + ',' + (dark ? 0.18 : 0.16) + ')');
      g.addColorStop(1, 'rgba(' + tealRGB.join(',') + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, RADIUS * 1.5, 0, 6.2832);
      ctx.fill();
    }
    var r2 = RADIUS * RADIUS;
    for (var i = 0; i < cols; i++) {
      for (var j = 0; j < rows; j++) {
        var x = i * SPACING, y = j * SPACING;
        var dx = x - px, dy = y - py;
        var d2 = dx * dx + dy * dy;
        var t = 0;
        if (d2 < r2) {
          t = 1 - Math.sqrt(d2) / RADIUS;
          t = t * t * (3 - 2 * t); // smoothstep falloff
        }
        var rr = lerp(BASE_R, MAX_R, t);
        var cr = Math.round(lerp(baseRGB[0], tealRGB[0], t));
        var cg = Math.round(lerp(baseRGB[1], tealRGB[1], t));
        var cb = Math.round(lerp(baseRGB[2], tealRGB[2], t));
        var ca = lerp(baseAlpha, tealAlpha, t);
        ctx.beginPath();
        ctx.arc(x, y, rr, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + ca + ')';
        ctx.fill();
      }
    }
  }
  function drawStatic() { draw(-9999, -9999); }

  refreshPalette(true);
  resize();
  window.addEventListener('resize', resize);

  if (!finePointer || reduceMotion) return;

  var raf = null, idle = true;
  function loop() {
    eased.x = lerp(eased.x, mouse.x, 0.16);
    eased.y = lerp(eased.y, mouse.y, 0.16);
    draw(eased.x, eased.y);
    var settled = Math.abs(eased.x - mouse.x) < 0.4 && Math.abs(eased.y - mouse.y) < 0.4;
    if (settled && mouse.x === -9999) { idle = true; raf = null; drawStatic(); return; }
    raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (idle) { idle = false; raf = requestAnimationFrame(loop); }
  }
  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (eased.x === -9999) { eased.x = mouse.x; eased.y = mouse.y; }
    wake();
  }, { passive: true });
  document.addEventListener('mouseleave', function () {
    mouse.x = -9999; mouse.y = -9999; wake();
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
    // source chain: local PNG -> local SVG -> live favicon -> text name
    // (PNG first: that's what exists today, so the common case loads with
    //  zero 404s; drop in a .svg later and it still gets picked up)
    var sources = [
      'assets/logos/' + org.slug + '.png',
      'assets/logos/' + org.slug + '.svg',
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
        var t0 = null, DUR = 900;
        function step(ts) {
          if (!t0) t0 = ts;
          // re-read target each frame so live Scholar data arriving
          // mid-animation retargets the count-up instead of being overwritten
          var target = parseInt(el.getAttribute('data-count'), 10);
          var suffix = el.getAttribute('data-suffix') || '';
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

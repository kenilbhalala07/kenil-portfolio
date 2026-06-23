/* ============================================================
   GRIMOIRE.V01 — FX layer (motion + decorative graphics)
   Exposes window.WizFX. Loaded BEFORE wizard.js.
   The shared reduced-motion guard lives here (single source).
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ---------------- guards (single source) ---------------- */
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = RM.matches;
  if (RM.addEventListener) RM.addEventListener('change', function (e) { reduced = e.matches; });
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function isDay() { return document.documentElement.getAttribute('data-wiz') === 'day'; }
  function calm() { return document.documentElement.hasAttribute('data-calm'); }
  function off() { return reduced || calm(); }   // motion suppressed?

  /* ---------------- starfield twinkle (night) ---------------- */
  function starfield() {
    var field = $('#twinkleField');
    if (!field || off()) return;
    var ns = 'http://www.w3.org/2000/svg', frag = document.createDocumentFragment();
    for (var i = 0; i < 70; i++) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (Math.random() * 1000).toFixed(1));
      c.setAttribute('cy', (Math.random() * 600).toFixed(1));
      c.setAttribute('r', (0.5 + Math.random() * 1.3).toFixed(2));
      c.style.animationDelay = (-Math.random() * 4) + 's';
      c.style.animationDuration = (3 + Math.random() * 4) + 's';
      frag.appendChild(c);
    }
    field.appendChild(frag);
  }

  /* ---------------- scroll reveal (parchment fade-rise) ---------------- */
  function scrollReveal() {
    if (off()) return; // calm/reduced → leave everything visible, never hide
    var blocks = [].slice.call(document.querySelectorAll('.block, .cs-sec, .ticker, .site-foot')); // hero/title excluded — they carry the fold
    if (!blocks.length) return;
    blocks.forEach(function (b) {
      b.classList.add('reveal');
      var kids = b.querySelectorAll('.case-card, .lab-card, .stack-col, .channel, .work-table tbody tr, .chip, .job, .skill-row, .doc-contact > div');
      [].forEach.call(kids, function (k, i) { k.classList.add('stagger'); k.style.setProperty('--i', i % 6); });
    });
    function check() {
      var vh = window.innerHeight;
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.classList.contains('in')) continue;
        if (b.getBoundingClientRect().top < vh * 0.88) b.classList.add('in');
      }
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    // safety net: content must never stay hidden, even if scroll never fires
    setTimeout(function () { blocks.forEach(function (b) { b.classList.add('in'); }); }, 3000);
  }

  /* ---------------- #bigName shimmer ---------------- */
  function nameShimmer() {
    var el = $('#bigName');
    if (!el || off()) return;
    el.classList.remove('shimmer'); void el.offsetWidth; el.classList.add('shimmer');
  }

  /* ---------------- wax-seal press feedback ---------------- */
  function wireWaxSeal() {
    document.querySelectorAll('.btn, .lumos').forEach(function (el) {
      el.addEventListener('pointerdown', function () {
        if (reduced) return;
        el.classList.remove('sealed'); void el.offsetWidth; el.classList.add('sealed');
      });
    });
  }

  /* ---------------- cursor sparkle trail ---------------- */
  function cursorTrail() {
    if (off() || !FINE) return;
    var lastX = 0, lastY = 0, px = 0, py = 0, moved = false, queued = false, live = 0;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY; moved = true;
      if (!queued) { queued = true; requestAnimationFrame(emit); }
    }, { passive: true });
    function emit() {
      queued = false; if (!moved) return; moved = false;
      if (calm()) return;
      var cap = isDay() ? 6 : 12;                 // art-director particle budget
      if (live >= cap) return;
      var dx = px - lastX, dy = py - lastY;
      if (dx * dx + dy * dy < 1600) return;       // ~40px gate
      lastX = px; lastY = py;
      var s = document.createElement('span');
      s.className = 'spark'; s.style.left = px + 'px'; s.style.top = py + 'px';
      document.body.appendChild(s); live++;
      s.addEventListener('animationend', function () { s.remove(); live--; });
    }
  }

  /* ---------------- spell-cast flash (full-screen, z60) ---------------- */
  var flashEl = document.createElement('div');
  flashEl.id = 'spellFlash'; flashEl.setAttribute('aria-hidden', 'true');
  (document.body || document.documentElement).appendChild(flashEl);
  function spellFlash() {
    if (off()) return;
    flashEl.classList.remove('cast'); void flashEl.offsetWidth; flashEl.classList.add('cast');
  }

  /* ---------------- flying owl ---------------- */
  function flyOwl() {
    var owl = $('#owlFlight'); if (!owl || off()) return;
    owl.classList.remove('fly'); void owl.offsetWidth; owl.classList.add('fly');
    var done = function () { owl.classList.remove('fly'); owl.removeEventListener('animationend', done); };
    owl.addEventListener('animationend', done);
  }

  /* ---------------- snitch lure (from console: accio orb) ---------------- */
  function lureSnitch() {
    var stage = $('#gameStage'); if (!stage || off()) return;
    stage.classList.add('lure');
    setTimeout(function () { stage.classList.remove('lure'); }, 1400);
  }

  /* ---------------- candle chime (original magical sparkle, on click) ---------------- */
  function wireCandleChime() {
    var candle = document.querySelector('.candle');
    if (!candle) return;
    candle.style.cursor = 'pointer';
    candle.setAttribute('title', 'tap me ✦');
    var actx;
    function spark() {
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        var t0 = actx.currentTime;
        var master = actx.createGain();
        master.gain.value = 0.42;
        master.connect(actx.destination);
        // original ascending sparkle run — a generic shimmer, not any known melody
        [659.25, 880, 987.77, 1318.51, 1567.98, 2093.0].forEach(function (f, i) {
          var t = t0 + i * 0.075;
          var osc = actx.createOscillator(), g = actx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          var harm = actx.createOscillator(), hg = actx.createGain();
          harm.type = 'sine'; harm.frequency.value = f * 2.01; hg.gain.value = 0.3;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.4, t + 0.015);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
          osc.connect(g); harm.connect(hg); hg.connect(g); g.connect(master);
          osc.start(t); osc.stop(t + 0.66);
          harm.start(t); harm.stop(t + 0.66);
        });
      } catch (e) {}
    }
    candle.addEventListener('click', spark);
  }

  /* ---------------- boot + public API ---------------- */
  function init() {
    starfield(); scrollReveal(); wireWaxSeal(); cursorTrail(); wireCandleChime();
    var owlBtn = document.querySelector('a.btn[href="#owlpost"]');
    if (owlBtn) owlBtn.addEventListener('click', flyOwl);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.WizFX = {
    get reduced() { return reduced; },
    spellFlash: spellFlash,
    nameShimmer: nameShimmer,
    flyOwl: flyOwl,
    lureSnitch: lureSnitch,
  };
})();

/* ============================================================
   KENIL BHALALA — GRIMOIRE.V01  ·  wizarding theme behaviors
   ignite reveal · catch-the-snitch · spell console · lumos/nox
   ember particles · clocks · ticker
   ============================================================ */

(function () {
  'use strict';

  var PROFILE = {
    name: 'Kenil Bhalala',
    email: 'Kenilbhalala20@gmail.com',
    phone: '+919081683490',
    github: 'https://github.com/kenilbhalala',
    linkedin: 'https://linkedin.com/in/kenilbhalala',
  };

  var $ = function (s) { return document.querySelector(s); };
  var ROOT = (document.body && document.body.getAttribute('data-root')) || '';

  /* ---------------- clocks ---------------- */
  function fmtClock() {
    var d = new Date();
    var date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var tz = 'LOCAL';
    try {
      tz = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
        .formatToParts(d).find(function (p) { return p.type === 'timeZoneName'; }).value;
    } catch (e) {}
    return date + ' · ' + time + ' ' + tz;
  }
  function tickClock() {
    var s = fmtClock();
    var bar = $('#barClock'); if (bar) bar.textContent = s;
    var foot = $('#footClock'); if (foot) foot.textContent = s.split(' · ')[1] || s;
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------------- lumos / nox theme ---------------- */
  function setWiz(t) {
    var v = t === 'day' ? 'day' : 'night';
    document.documentElement.setAttribute('data-wiz', v);
    var label = $('#spellToggleLabel');
    if (label) label.textContent = v === 'day' ? 'LUMOS' : 'NOX';
    try { localStorage.setItem('kb:wiz-theme', v); } catch (e) {}
  }
  function getWiz() { return document.documentElement.getAttribute('data-wiz') || 'night'; }
  setWiz(getWiz()); // sync the toggle label to whatever loaded
  var toggle = $('#spellToggle');
  if (toggle) toggle.addEventListener('click', function () {
    setWiz(getWiz() === 'night' ? 'day' : 'night');
    if (window.WizFX) window.WizFX.spellFlash();
  });

  /* ---------------- ember particles (night) ---------------- */
  var embers = $('#embers');
  if (embers) {
    for (var e = 0; e < 26; e++) {
      var s = document.createElement('span');
      s.className = 'ember';
      s.style.left = (Math.random() * 100) + '%';
      s.style.bottom = (-5 - Math.random() * 20) + '%';
      var dur = 9 + Math.random() * 12;
      s.style.animationDuration = dur + 's';
      s.style.animationDelay = (-Math.random() * dur) + 's';
      s.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      s.style.opacity = String(0.4 + Math.random() * 0.6);
      embers.appendChild(s);
    }
  }

  /* ---------------- ignite reveal title ---------------- */
  var nameEl = $('#bigName');
  if (nameEl) {
    var text = nameEl.getAttribute('data-text');
    var igniting = false;

    // Cinzel Decorative is wide & variable-width — shrink to fit its column.
    function fitName() {
      var MIN = 28, MAX = 104, guard = 0;
      nameEl.style.fontSize = MAX + 'px';
      while (nameEl.scrollWidth > nameEl.clientWidth + 1 &&
             parseFloat(nameEl.style.fontSize) > MIN && guard < 320) {
        nameEl.style.fontSize = (parseFloat(nameEl.style.fontSize) - 1) + 'px';
        guard++;
      }
    }
    var fitTimer;
    window.addEventListener('resize', function () {
      clearTimeout(fitTimer); fitTimer = setTimeout(fitName, 120);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitName);
    }
    fitName();
    function buildChars() {
      nameEl.textContent = '';
      var spans = [];
      for (var i = 0; i < text.length; i++) {
        var sp = document.createElement('span');
        sp.className = 'ch dim';
        sp.textContent = text[i] === ' ' ? ' ' : text[i];
        nameEl.appendChild(sp);
        spans.push(sp);
      }
      return spans;
    }
    function ignite() {
      if (igniting) return;
      igniting = true;
      var spans = buildChars();
      fitName();
      var i = 0;
      var iv = setInterval(function () {
        if (i < spans.length) { spans[i].classList.remove('dim'); i++; }
        else { clearInterval(iv); igniting = false;
               if (window.WizFX) window.WizFX.nameShimmer(); }
      }, 70);
    }
    // static name — no ignite/shimmer; subtle glow-on-hover is handled in CSS
  }

  /* ---------------- ticker (duplicate for seamless loop) ---------------- */
  var track = $('#tickerTrack');
  if (track) { track.innerHTML += track.innerHTML; }

  /* ---------------- catch the snitch ---------------- */
  var canvas = $('#gameCanvas');
  if (canvas) initSnitch();

  function initSnitch() {
    var ctx = canvas.getContext('2d');
    var stage = $('#gameStage');
    var modeEl = $('#gameMode');
    var scoreEl = $('#gameScore');
    var bestEl = $('#gameBest');
    var captionEl = $('#gameCaption');
    var overlay = $('#gameOverlay');
    var overlayText = $('#gameOverlayText');

    var W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var GROUND = 14;
    var mode = 'AUTO';
    var snitch, pillars, score, best, spawnT, lastFlap, tripAt, overSince, wingT = 0;
    try { best = parseInt(localStorage.getItem('kb:snitch-best') || '0', 10) || 0; } catch (e) { best = 0; }
    bestEl.textContent = String(best).padStart(2, '0');

    function reset(toMode) {
      snitch = { x: W * 0.26, y: H * 0.45, vy: 0 };
      pillars = [];
      score = 0;
      spawnT = 0;
      lastFlap = 0;
      tripAt = performance.now() + 8000 + Math.random() * 9000;
      scoreEl.textContent = '00';
      setMode(toMode || 'AUTO');
    }

    function setMode(m) {
      mode = m;
      modeEl.textContent = m;
      modeEl.classList.toggle('you', m === 'YOU');
      stage.classList.toggle('playing', m === 'YOU');
      overlay.classList.remove('show');
      if (m === 'AUTO') captionEl.textContent = 'SEEKER: AI · TAP TO TAKE THE BROOM';
      if (m === 'YOU') captionEl.textContent = 'YOU HAVE THE BROOM · KEEP FLYING';
      if (m === 'OVER') captionEl.textContent = 'THE SNITCH GOT AWAY';
      if (m === 'RESET') captionEl.textContent = 'A NEW SEEKER MOUNTS…';
      captionEl.classList.toggle('you', m === 'YOU');
    }

    function flap() { snitch.vy = -290; lastFlap = performance.now(); }

    function crash() {
      if (mode === 'YOU') {
        setMode('OVER');
        overlayText.textContent = 'CAUGHT BY THE WALL · TAP / SPACE TO FLY';
        overlay.classList.add('show');
        overSince = performance.now();
      } else if (mode === 'AUTO') {
        setMode('RESET');
        overlayText.textContent = 'SEEKER STUMBLED · REMOUNTING';
        overlay.classList.add('show');
        setTimeout(function () { reset('AUTO'); }, 1000);
      }
    }

    function takeOverOrFlap() {
      if (mode === 'AUTO') { setMode('YOU'); flap(); }
      else if (mode === 'YOU') { flap(); }
      else if (mode === 'OVER') { reset('YOU'); flap(); }
    }

    stage.addEventListener('pointerdown', function (ev) { ev.preventDefault(); takeOverOrFlap(); });
    window.addEventListener('keydown', function (ev) {
      if (ev.code !== 'Space') return;
      if (document.getElementById('terminal').classList.contains('open')) return;
      if (mode === 'YOU' || mode === 'OVER') { ev.preventDefault(); takeOverOrFlap(); }
    });

    var last = performance.now();
    function loop(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      wingT += dt;
      var playH = H - GROUND;

      if (mode === 'AUTO' || mode === 'YOU' || mode === 'RESET') {
        snitch.vy += 900 * dt;
        snitch.y += snitch.vy * dt;

        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = 1.9;
          var gap = 78;
          var cy = 40 + Math.random() * (playH - 80 - gap);
          pillars.push({ x: W + 30, gapY: cy, gapH: gap, w: 26, passed: false });
        }
        for (var i = pillars.length - 1; i >= 0; i--) {
          var p = pillars[i];
          p.x -= 92 * dt;
          if (!p.passed && p.x + p.w < snitch.x) {
            p.passed = true;
            score++;
            scoreEl.textContent = String(score).padStart(2, '0');
            if (score > best) {
              best = score;
              bestEl.textContent = String(best).padStart(2, '0');
              try { localStorage.setItem('kb:snitch-best', String(best)); } catch (e) {}
            }
          }
          if (p.x < -40) pillars.splice(i, 1);
        }

        if (mode === 'AUTO') {
          var tripped = now > tripAt;
          if (!tripped) {
            var next = null;
            for (var j = 0; j < pillars.length; j++) {
              if (pillars[j].x + pillars[j].w > snitch.x - 4) { next = pillars[j]; break; }
            }
            var targetY = next ? next.gapY + next.gapH * 0.62 : playH * 0.5;
            if (snitch.y > targetY && now - lastFlap > 130) flap();
          }
        }

        if (snitch.y > playH - 4) { snitch.y = playH - 4; crash(); }
        if (snitch.y < 4) { snitch.y = 4; snitch.vy = 0; }
        if (mode === 'AUTO' || mode === 'YOU') {
          for (var k = 0; k < pillars.length; k++) {
            var q = pillars[k];
            if (snitch.x + 8 > q.x && snitch.x - 8 < q.x + q.w) {
              if (snitch.y - 6 < q.gapY || snitch.y + 6 > q.gapY + q.gapH) { crash(); break; }
            }
          }
        }
      }

      if (mode === 'OVER' && now - overSince > 7000) reset('AUTO');

      draw(playH);
      requestAnimationFrame(loop);
    }

    function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

    function draw(playH) {
      var ink = cssVar('--ink-soft') || '#b7a98c';
      var muted = cssVar('--muted') || '#807558';
      var gold = cssVar('--gold') || '#c9a23f';
      var goldSoft = cssVar('--gold-soft') || '#e0c071';
      var oxblood = cssVar('--oxblood') || '#9c2a37';
      var border = cssVar('--border') || '#2b2438';

      ctx.clearRect(0, 0, W, H);

      // pillars / castle columns
      for (var i = 0; i < pillars.length; i++) {
        var p = pillars[i];
        column(p.x, 0, p.w, p.gapY, true, ink, border, gold);
        column(p.x, p.gapY + p.gapH, p.w, playH - (p.gapY + p.gapH), false, ink, border, gold);
      }

      // stone floor hatch
      ctx.save();
      ctx.beginPath(); ctx.rect(0, playH, W, GROUND); ctx.clip();
      ctx.strokeStyle = muted; ctx.globalAlpha = 0.5; ctx.lineWidth = 1;
      for (var x = -GROUND; x < W + GROUND; x += 5) {
        ctx.beginPath(); ctx.moveTo(x, playH + GROUND); ctx.lineTo(x + GROUND, playH); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = border; ctx.strokeRect(0.5, playH + 0.5, W - 1, GROUND - 1);

      // the golden snitch
      if (snitch) {
        var wing = Math.sin(wingT * 22) * 0.5 + 0.5; // 0..1 flap
        ctx.save();
        ctx.translate(snitch.x, snitch.y);
        // wings
        ctx.strokeStyle = goldSoft; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.9;
        drawWing(-1, wing, goldSoft);
        drawWing(1, wing, goldSoft);
        ctx.globalAlpha = 1;
        // body glow
        var grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
        grad.addColorStop(0, goldSoft);
        grad.addColorStop(1, gold);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.fill();
        // seam
        ctx.strokeStyle = oxblood; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.lineTo(5.5, 0); ctx.stroke();
        ctx.restore();
      }
    }

    function drawWing(dir, wing, color) {
      // dir: -1 left, 1 right; wing 0..1 controls spread
      var spread = 6 + wing * 5;
      var lift = -2 - wing * 5;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.quadraticCurveTo(dir * (spread * 0.6), lift, dir * spread, lift - 2);
      ctx.quadraticCurveTo(dir * (spread * 0.7), 1, 0, 1);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.stroke();
    }

    function column(x, y, w, h, isTop, fill, border, gold) {
      if (h <= 0) return;
      var capH = 7, capOver = 4;
      // shaft
      var g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, border); g.addColorStop(0.5, fill); g.addColorStop(1, border);
      ctx.fillStyle = g; ctx.globalAlpha = 0.9;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      // gold cap ring at the gap-facing end (torch sconce vibe)
      var capY = isTop ? y + h - capH : y;
      ctx.fillStyle = gold; ctx.globalAlpha = 0.85;
      ctx.fillRect(x - capOver, capY, w + capOver * 2, capH);
      ctx.globalAlpha = 1;
      // fluting
      ctx.strokeStyle = border; ctx.lineWidth = 1;
      for (var fx = x + 6; fx < x + w - 3; fx += 6) {
        ctx.beginPath();
        ctx.moveTo(fx + 0.5, y + (isTop ? 0 : capH));
        ctx.lineTo(fx + 0.5, y + h - (isTop ? capH : 0));
        ctx.stroke();
      }
    }

    reset('AUTO');
    requestAnimationFrame(loop);
  }

  /* ---------------- spell console ---------------- */
  var terminal = $('#terminal');
  if (!terminal) return;
  var termOut = $('#termOut');
  var termInput = $('#termInput');
  var statusBar = $('#statusBar');
  var history = [];

  var HINTS = [
    'try: inventory',
    'try: examine orb',
    'try: accio resume',
    'try: lumos  (or nox)',
    'try: accio coffer',
    'try: owl',
  ];
  var hintI = 0;
  var hintEl = $('#termHint');
  if (hintEl) setInterval(function () {
    hintI = (hintI + 1) % HINTS.length;
    hintEl.textContent = HINTS[hintI];
  }, 5000);

  function openTerm() {
    terminal.classList.add('open');
    termInput.focus();
    if (!termOut.childElementCount) {
      print('out', "Your satchel is full. Cast <b>inventory</b> to see what you carry, or <b>revelio</b> for the book of spells.");
    }
  }
  function closeTerm() { terminal.classList.remove('open'); termInput.blur(); }

  statusBar.addEventListener('click', openTerm);
  $('#termEsc').addEventListener('click', closeTerm);
  $('#termClose').addEventListener('click', closeTerm);

  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !terminal.classList.contains('open') &&
        !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      openTerm();
    } else if (e.key === 'Escape' && terminal.classList.contains('open')) {
      closeTerm();
    }
  });

  function print(cls, html) {
    var div = document.createElement('div');
    div.className = cls;
    div.innerHTML = html;
    termOut.appendChild(div);
    termOut.scrollTop = termOut.scrollHeight;
  }
  function printRow(c, d, cls) {
    print('row' + (cls ? ' ' + cls : ''), '<span class="c">' + c + '</span><span class="d">' + d + '</span>');
  }

  /* ---- chambers (section anchors) ---- */
  var PLACES = {
    chronicle: 'chronicle', deeds: 'chronicle', work: 'chronicle', experience: 'chronicle',
    tomes: 'tomes', studies: 'tomes', cases: 'tomes', volumes: 'tomes',
    workshop: 'workshop', lab: 'workshop', cauldron: 'workshop', brewing: 'workshop',
    wizard: 'wizard', about: 'wizard',
    spellbook: 'spellbook', stack: 'spellbook', tools: 'spellbook',
    owlpost: 'owlpost', contact: 'owlpost', channels: 'owlpost',
    top: 'top', home: 'top',
  };

  function go(hash) {
    var el = document.getElementById(hash);
    if (!el) return false;
    var rm = window.WizFX && window.WizFX.reduced;
    el.scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
    return true;
  }
  function flash() { if (window.WizFX) window.WizFX.spellFlash(); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function mailURL() { return 'mailto:' + PROFILE.email + '?subject=Hello%20Kenil'; }

  /* ---- the satchel: each item wired to a real action ---- */
  var ITEMS = [
    { id: 'scroll', name: 'Résumé Scroll', glyph: '📜',
      lore: 'Your deeds, sealed in wax — unrolls to the full grimoire.',
      use: function () { print('out', '✦ The scroll unfurls…'); flash(); setTimeout(function () { window.location.href = ROOT + 'resume.html'; }, 200); } },
    { id: 'owl', name: 'Post Owl', glyph: '🦉',
      lore: 'Carries a letter faster than any courier.',
      use: function () { print('out', '✦ An owl takes wing → <a href="' + mailURL() + '">' + PROFILE.email + '</a>'); flash(); if (window.WizFX) window.WizFX.flyOwl(); setTimeout(function () { window.location.href = mailURL(); }, 260); } },
    { id: 'hourglass', name: 'Hour-Turner', glyph: '⧖',
      lore: 'Spin it to turn day into night, and night back to day.',
      use: function () { setWiz(getWiz() === 'night' ? 'day' : 'night'); flash(); print('out', '✦ The sands run backward — it is now <b>' + getWiz() + '</b>.'); } },
    { id: 'map', name: "Wayfarer's Map", glyph: '🗺',
      lore: 'Every chamber of this castle, drawn in moving ink.',
      use: function () { flash(); print('out', '✦ The map reveals these chambers:');
        printRow('chronicle', 'the Chronicle of Deeds', 'kv'); printRow('tomes', 'Tomes &amp; Studies', 'kv');
        printRow('workshop', 'the Workshop', 'kv'); printRow('wizard', 'the Wizard', 'kv');
        printRow('spellbook', 'the Spellbook', 'kv'); printRow('owlpost', 'the Owl Post', 'kv');
        print('out', 'Cast <b>accio &lt;chamber&gt;</b> to travel.'); } },
    { id: 'basin', name: 'Scrying Basin', glyph: '🜄',
      lore: 'Gaze in to glimpse the wizard himself.',
      use: function () { flash(); go('wizard'); print('out', '✦ The waters clear over the Wizard.'); } },
    { id: 'spellbook', name: 'Spellbook', glyph: '📖',
      lore: 'The wands and rites I reach for.',
      use: function () { flash(); go('spellbook'); print('out', '✦ The Spellbook falls open.'); } },
    { id: 'coffer', name: 'Coffer of Coin', glyph: '⛁',
      lore: 'Heavy with the spoils of past launches.',
      use: function () { flash(); print('out', '✦ The coffer spills its gold:');
        printRow('₹7 Cr', 'revenue from the UNSAT launch', 'kv');
        printRow('3.5L+', 'leads conjured for that campaign', 'kv');
        printRow('10,000+', 'concurrent souls held at Newton School', 'kv');
        printRow('−22%', 'checkout drop-off, banished', 'kv'); } },
    { id: 'orb', name: 'Winged Orb', glyph: '✦',
      lore: 'Darts about the chamber above — give chase.',
      use: function () { flash(); go('top'); if (window.WizFX) window.WizFX.lureSnitch(); print('out', '✦ The orb glints in the chamber above — tap it to give chase.'); } },
    { id: 'tome', name: 'Tome of Studies', glyph: '❧',
      lore: 'Two volumes scribed: Claude, and Bolt.',
      use: function () { flash(); go('tomes'); print('out', '✦ Two volumes wait open on the lectern.'); } },
    { id: 'quill', name: 'Quill of Acceptance', glyph: '🪶',
      lore: 'Signs you up for a good conversation.',
      use: function () { flash(); go('owlpost'); print('out', '✦ The quill points to the Owl Post.'); } },
    { id: 'wand', name: 'Wand · Hawthorn', glyph: '➶',
      lore: 'Reliable in a tight spot. Wave it for a flourish.',
      use: function () { flash(); print('out', '✦ Sparks of gold scatter from the wand-tip.'); } },
    { id: 'crest', name: 'House Crest · KB', glyph: '❦',
      lore: 'Bears the mark of the maker.',
      use: function () { flash(); go('top'); print('out', '✦ The crest gleams: <b>KB</b>.'); } },
  ];

  var ITEM_SYN = {
    resume: 'scroll', cv: 'scroll', grimoire: 'scroll',
    mail: 'owl', email: 'owl', post: 'owl',
    time: 'hourglass', turner: 'hourglass', timeturner: 'hourglass', clock: 'hourglass',
    pensieve: 'basin', me: 'basin',
    stack: 'spellbook', tools: 'spellbook', book: 'spellbook',
    coin: 'coffer', coins: 'coffer', gold: 'coffer', money: 'coffer', metrics: 'coffer', galleons: 'coffer',
    snitch: 'orb', seeker: 'orb', game: 'orb', flappy: 'orb', ball: 'orb',
    claude: 'tome', bolt: 'tome', cases: 'tome', studies: 'tome',
    sigil: 'crest', kb: 'crest', logo: 'crest',
  };

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
  function itemById(id) { for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === id) return ITEMS[i]; } return null; }
  function findItem(arg) {
    var a = norm(arg);
    if (!a) return null;
    var hit = itemById(a);
    if (hit) return hit;
    if (ITEM_SYN[a]) return itemById(ITEM_SYN[a]);
    if (a.length >= 3) {
      for (var i = 0; i < ITEMS.length; i++) {
        if (norm(ITEMS[i].name).indexOf(a) !== -1) return ITEMS[i];
      }
    }
    return null;
  }

  /* ---- spell actions ---- */
  function listInventory() {
    print('out', '✦ Your satchel holds:');
    ITEMS.forEach(function (it) {
      printRow(it.glyph + ' ' + it.name, it.lore + ' &nbsp;<a data-accio="' + it.id + '">use</a>', 'kv');
    });
    print('out', 'Cast <b>examine &lt;item&gt;</b> to study one, or <b>accio &lt;item&gt;</b> to use it.');
  }
  function examineItem(arg) {
    var it = findItem(arg);
    if (!it) { print('err', 'You carry no such thing — try <b>inventory</b>.'); return; }
    print('out', it.glyph + '  <b>' + it.name + '</b>');
    print('out', '<i>' + it.lore + '</i>');
    print('out', 'Cast <a data-accio="' + it.id + '">accio ' + it.id + '</a> to use it.');
  }
  function accio(arg) {
    if (!arg) { print('out', 'usage: <b>accio &lt;item or chamber&gt;</b> — e.g. accio scroll · accio tomes'); return; }
    var it = findItem(arg);
    if (it) { it.use(); return; }
    var a = norm(arg);
    if (/resume|grimoire/.test(a)) { window.location.href = ROOT + 'resume.html'; return; }
    if (/claude/.test(a)) { window.location.href = ROOT + 'case-studies/claude.html'; return; }
    if (/bolt/.test(a)) { window.location.href = ROOT + 'case-studies/bolt.html'; return; }
    if (PLACES[a]) { flash(); go(PLACES[a]); print('out', '✦ Accio ' + a + ' — summoned.'); return; }
    print('err', 'Nothing answers to "' + esc(arg) + '".');
  }
  function revelio() {
    print('out', '— THE BOOK OF SPELLS —');
    printRow('inventory', 'List the items in your satchel');
    printRow('examine &lt;item&gt;', 'Study an item (alias: revelio &lt;item&gt;)');
    printRow('accio &lt;item|chamber&gt;', 'Summon / use an item, or travel to a chamber');
    printRow('lumos / nox', 'Light the parchment / snuff the candle');
    printRow('point me', 'Travel to the Owl Post');
    printRow('owl', 'Send an owl (email)');
    printRow('github / linkedin', 'Open a profile');
    printRow('floo', 'Floo call (phone)');
    printRow('grimoire', 'Open the résumé');
    printRow('obliviate', 'Clear the console');
    printRow('history', 'Recall recent spells · Tab to autocomplete');
  }

  var SPELLS = {
    inventory: listInventory,
    examine: examineItem,
    accio: accio,
    revelio: function (arg) { if (arg) examineItem(arg); else revelio(); },
    help: function () { revelio(); },
    lumos: function () { setWiz('day'); flash(); print('out', '✦ Lumos — the parchment glows.'); },
    nox: function () { setWiz('night'); flash(); print('out', '✦ Nox — the candle is snuffed.'); },
    theme: function (arg) {
      if (/day|light|lumos/.test(arg || '')) return SPELLS.lumos();
      if (/night|dark|nox/.test(arg || '')) return SPELLS.nox();
      setWiz(getWiz() === 'night' ? 'day' : 'night'); flash();
      print('out', '✦ theme → ' + getWiz());
    },
    pointme: function () { flash(); go('owlpost'); print('out', '✦ Point Me — the wand turns toward the Owl Post.'); },
    owl: function () { itemById('owl').use(); },
    github: function () { print('out', '→ ' + PROFILE.github); window.open(PROFILE.github, '_blank'); },
    linkedin: function () { print('out', '→ ' + PROFILE.linkedin); window.open(PROFILE.linkedin, '_blank'); },
    floo: function () { print('out', '→ tel:' + PROFILE.phone); window.location.href = 'tel:' + PROFILE.phone; },
    phone: function () { SPELLS.floo(); },
    grimoire: function () { window.location.href = ROOT + 'resume.html'; },
    resume: function () { window.location.href = ROOT + 'resume.html'; },
    obliviate: function () { termOut.innerHTML = ''; },
    clear: function () { termOut.innerHTML = ''; },
    history: function () {
      if (!history.length) { print('out', '(no spells cast yet)'); return; }
      history.slice(-10).forEach(function (h, i) { print('out', (i + 1) + '&nbsp;&nbsp;' + esc(h)); });
    },
  };

  var VERB_ALIASES = {
    i: 'inventory', bag: 'inventory', satchel: 'inventory', items: 'inventory', inv: 'inventory', ls: 'inventory',
    inspect: 'examine', look: 'examine', study: 'examine', reveal: 'examine',
    summon: 'accio', use: 'accio', cast: 'accio', get: 'accio', wave: 'accio', cd: 'accio', open: 'accio',
    email: 'owl', send: 'owl',
    light: 'lumos', dark: 'nox',
  };

  /* ---- dispatch ---- */
  function runLine(raw) {
    history.push(raw);
    print('echo', '✦ ' + esc(raw));
    var lower = raw.toLowerCase().trim();
    if (/^point\s*me\b/.test(lower)) { SPELLS.pointme(); return; }
    var parts = raw.split(/\s+/);
    var verb = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ');
    verb = VERB_ALIASES[verb] || verb;
    if (SPELLS[verb]) { SPELLS[verb](arg.toLowerCase()); return; }
    var asItem = findItem(parts[0]);   // bare item name → examine it
    if (asItem) { examineItem(parts[0]); return; }
    print('err', 'No such spell: ' + esc(parts[0]) + " — cast 'revelio'.");
  }

  /* ---- tab completion ---- */
  var tabMatches = null, tabIdx = -1, tabBase = '';
  function completionPool() {
    return Object.keys(SPELLS)
      .concat(Object.keys(VERB_ALIASES))
      .concat(ITEMS.map(function (it) { return it.id; }))
      .concat(Object.keys(PLACES));
  }
  function tabComplete() {
    var parts = termInput.value.split(/\s+/);
    var editing = parts[parts.length - 1].toLowerCase();
    if (tabIdx === -1 || editing !== tabBase) {
      tabBase = editing;
      tabMatches = completionPool().filter(function (w) { return editing && w.indexOf(editing) === 0; });
      tabMatches = tabMatches.filter(function (w, i) { return tabMatches.indexOf(w) === i; });
      tabIdx = 0;
    } else if (tabMatches.length) {
      tabIdx = (tabIdx + 1) % tabMatches.length;
    }
    if (!tabMatches || !tabMatches.length) return;
    parts[parts.length - 1] = tabMatches[tabIdx];
    termInput.value = parts.join(' ');
    tabBase = tabMatches[tabIdx];
  }

  termInput.addEventListener('input', function () { tabIdx = -1; });
  termInput.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') { e.preventDefault(); tabComplete(); return; }
    if (e.key !== 'Enter') return;
    var raw = termInput.value.trim();
    termInput.value = '';
    tabIdx = -1;
    if (!raw) return;
    runLine(raw);
  });

  /* ---- clickable links printed in the console ---- */
  termOut.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-accio],[data-go]') : null;
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-accio')) accio(t.getAttribute('data-accio'));
    else if (t.hasAttribute('data-go')) { flash(); go(t.getAttribute('data-go')); }
  });

  /* ---- open buttons + keyboard-accessible status bar + quick-spell chips ---- */
  var openSpellBtn = $('#openSpell');
  if (openSpellBtn) openSpellBtn.addEventListener('click', openTerm);
  statusBar.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTerm(); }
  });
  var chips = $('#termChips');
  if (chips) chips.addEventListener('click', function (e) {
    var b = e.target.closest('.term-chip'); if (!b) return;
    termInput.value = '';
    runLine(b.getAttribute('data-spell'));
    termInput.focus();
  });

  /* ---- mobile nav drawer ---- */
  var burger = $('#navBurger'), navList = $('#navLinks');
  if (burger && navList) {
    burger.addEventListener('click', function () {
      var open = navList.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { navList.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- scroll-spy on the primary nav (scroll-based, robust) ---- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (spyLinks.length) {
    var spyMap = spyLinks.map(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      return el ? { a: a, el: el } : null;
    }).filter(Boolean);
    var spyCheck = function () {
      var line = window.innerHeight * 0.4, current = null;
      spyMap.forEach(function (m) {
        var rect = m.el.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) current = m.a;
      });
      spyLinks.forEach(function (a) { a.classList.toggle('active', a === current); });
    };
    spyCheck();
    window.addEventListener('scroll', spyCheck, { passive: true });
    window.addEventListener('resize', spyCheck);
  }

  /* ---- calm mode toggle ---- */
  var calmBtn = $('#calmToggle');
  function setCalm(on) {
    if (on) document.documentElement.setAttribute('data-calm', '');
    else document.documentElement.removeAttribute('data-calm');
    if (calmBtn) { calmBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); calmBtn.textContent = on ? 'Full' : 'Calm'; }
    try { localStorage.setItem('kb:wiz-calm', on ? '1' : '0'); } catch (e) {}
  }
  if (calmBtn) {
    var calmOn = document.documentElement.hasAttribute('data-calm');
    calmBtn.setAttribute('aria-pressed', calmOn ? 'true' : 'false');
    calmBtn.textContent = calmOn ? 'Full' : 'Calm';
    calmBtn.addEventListener('click', function () { setCalm(!document.documentElement.hasAttribute('data-calm')); });
  }

  /* ---- first-visit nudge toward the console ---- */
  var nudge = $('#nudge');
  if (nudge) {
    var seen = false;
    try { seen = localStorage.getItem('kb:wiz-seen') === '1'; } catch (e) {}
    var dismiss = function () { nudge.classList.remove('show'); try { localStorage.setItem('kb:wiz-seen', '1'); } catch (e) {} };
    if (!seen) {
      setTimeout(function () {
        if (!terminal.classList.contains('open')) {
          nudge.classList.add('show');
          setTimeout(function () { if (nudge.classList.contains('show')) dismiss(); }, 9000);
        }
      }, 2600);
    }
    var nx = $('#nudgeX');
    if (nx) {
      nx.addEventListener('click', dismiss);
      nx.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(); } });
    }
    statusBar.addEventListener('click', dismiss);
    if (openSpellBtn) openSpellBtn.addEventListener('click', dismiss);
  }
})();

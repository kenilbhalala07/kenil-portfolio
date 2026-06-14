/* ============================================================
   KENIL BHALALA — PORTFOLIO.V01  ·  shared behaviors
   scramble title · flappy (AI autoplay + takeover) · terminal
   theme · clocks · ticker
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

  /* ---------------- theme ---------------- */

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
    try { localStorage.setItem('kb:theme', t === 'light' ? 'light' : 'dark'); } catch (e) {}
  }
  function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }

  /* ---------------- scramble title ---------------- */

  var nameEl = $('#bigName');
  if (nameEl) {
    var GLYPHS = '!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHKLMNX';
    var scrambling = false;
    var scramble = function () {
      if (scrambling) return;
      scrambling = true;
      var target = nameEl.getAttribute('data-text');
      var frame = 0;
      var totalFrames = 34;
      var iv = setInterval(function () {
        frame++;
        var reveal = Math.floor((frame / totalFrames) * target.length);
        var out = '';
        for (var i = 0; i < target.length; i++) {
          if (target[i] === ' ') { out += ' '; continue; }
          if (i < reveal) { out += target[i]; }
          else { out += GLYPHS[(Math.random() * GLYPHS.length) | 0]; }
        }
        nameEl.textContent = out;
        if (frame >= totalFrames) {
          clearInterval(iv);
          nameEl.textContent = target;
          scrambling = false;
        }
      }, 38);
    };
    scramble();
    nameEl.addEventListener('mouseenter', scramble);
    setInterval(scramble, 28000);
  }

  /* ---------------- ticker (duplicate content for seamless loop) ---------------- */

  var track = $('#tickerTrack');
  if (track) { track.innerHTML += track.innerHTML; }

  /* ---------------- flappy ---------------- */

  var canvas = $('#gameCanvas');
  if (canvas) initFlappy();

  function initFlappy() {
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
    var mode = 'AUTO';           // AUTO | YOU | OVER | RESET
    var bird, pipes, score, best, spawnT, lastFlap, tripAt, overSince;
    try { best = parseInt(localStorage.getItem('kb:flappy-best') || '0', 10) || 0; } catch (e) { best = 0; }
    bestEl.textContent = String(best).padStart(2, '0');

    function reset(toMode) {
      bird = { x: W * 0.26, y: H * 0.45, vy: 0 };
      pipes = [];
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
      if (m === 'AUTO') captionEl.textContent = 'AI · TAP TO TAKE OVER';
      if (m === 'YOU') captionEl.textContent = 'YOU · KEEP FLAPPING';
      if (m === 'OVER') captionEl.textContent = 'YOUR RUN ENDED';
      if (m === 'RESET') captionEl.textContent = 'AI RESETTING…';
      captionEl.classList.toggle('you', m === 'YOU');
    }

    function flap() { bird.vy = -290; lastFlap = performance.now(); }

    function crash() {
      if (mode === 'YOU') {
        setMode('OVER');
        overlayText.textContent = 'GAME OVER · TAP / SPACE TO RETRY';
        overlay.classList.add('show');
        overSince = performance.now();
      } else if (mode === 'AUTO') {
        setMode('RESET');
        overlayText.textContent = 'AI TRIPPED · RESTARTING';
        overlay.classList.add('show');
        setTimeout(function () { reset('AUTO'); }, 1000);
      }
    }

    function takeOverOrFlap() {
      if (mode === 'AUTO') { setMode('YOU'); flap(); }
      else if (mode === 'YOU') { flap(); }
      else if (mode === 'OVER') { reset('YOU'); flap(); }
    }

    stage.addEventListener('pointerdown', function (e) { e.preventDefault(); takeOverOrFlap(); });
    window.addEventListener('keydown', function (e) {
      if (e.code !== 'Space') return;
      if (document.getElementById('terminal').classList.contains('open')) return;
      if (mode === 'YOU' || mode === 'OVER') { e.preventDefault(); takeOverOrFlap(); }
    });

    var last = performance.now();
    function loop(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      var playH = H - GROUND;

      if (mode === 'AUTO' || mode === 'YOU' || mode === 'RESET') {
        // physics
        bird.vy += 900 * dt;
        bird.y += bird.vy * dt;

        // spawn pipes
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = 1.9;
          var gap = 74;
          var cy = 40 + Math.random() * (playH - 80 - gap);
          pipes.push({ x: W + 30, gapY: cy, gapH: gap, w: 26, passed: false });
        }
        for (var i = pipes.length - 1; i >= 0; i--) {
          var p = pipes[i];
          p.x -= 92 * dt;
          if (!p.passed && p.x + p.w < bird.x) {
            p.passed = true;
            score++;
            scoreEl.textContent = String(score).padStart(2, '0');
            if (score > best) {
              best = score;
              bestEl.textContent = String(best).padStart(2, '0');
              try { localStorage.setItem('kb:flappy-best', String(best)); } catch (e) {}
            }
          }
          if (p.x < -40) pipes.splice(i, 1);
        }

        // AI pilot
        if (mode === 'AUTO') {
          var tripped = now > tripAt;
          if (!tripped) {
            var next = null;
            for (var j = 0; j < pipes.length; j++) {
              if (pipes[j].x + pipes[j].w > bird.x - 4) { next = pipes[j]; break; }
            }
            var targetY = next ? next.gapY + next.gapH * 0.62 : playH * 0.5;
            if (bird.y > targetY && now - lastFlap > 130) flap();
          }
        }

        // collisions
        if (bird.y > playH - 4) { bird.y = playH - 4; crash(); }
        if (bird.y < 4) { bird.y = 4; bird.vy = 0; }
        if (mode === 'AUTO' || mode === 'YOU') {
          for (var k = 0; k < pipes.length; k++) {
            var q = pipes[k];
            if (bird.x + 10 > q.x && bird.x - 10 < q.x + q.w) {
              if (bird.y - 5 < q.gapY || bird.y + 5 > q.gapY + q.gapH) { crash(); break; }
            }
          }
        }
      }

      // auto-return to AI after idle game-over
      if (mode === 'OVER' && now - overSince > 7000) reset('AUTO');

      draw(playH);
      requestAnimationFrame(loop);
    }

    function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

    function draw(playH) {
      var fg = cssVar('--fg') || '#efece2';
      var muted = cssVar('--muted') || '#76746a';
      var accent = cssVar('--accent-soft') || '#6e8bff';
      var border = cssVar('--border') || '#232326';

      ctx.clearRect(0, 0, W, H);

      // pipes as pillars
      for (var i = 0; i < pipes.length; i++) {
        var p = pipes[i];
        pillar(p.x, 0, p.w, p.gapY, true, fg, border);
        pillar(p.x, p.gapY + p.gapH, p.w, playH - (p.gapY + p.gapH), false, fg, border);
      }

      // ground hatch
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, playH, W, GROUND);
      ctx.clip();
      ctx.strokeStyle = muted;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      for (var x = -GROUND; x < W + GROUND; x += 5) {
        ctx.beginPath();
        ctx.moveTo(x, playH + GROUND);
        ctx.lineTo(x + GROUND, playH);
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = border;
      ctx.strokeRect(0.5, playH + 0.5, W - 1, GROUND - 1);

      // bird (ascii)
      ctx.fillStyle = accent;
      ctx.font = '700 13px "Geist Mono", monospace';
      ctx.textBaseline = 'middle';
      var lean = bird ? Math.max(-0.35, Math.min(0.5, bird.vy / 600)) : 0;
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(lean);
      ctx.fillText('<°)~', -16, 0);
      ctx.restore();
    }

    function pillar(x, y, w, h, isTop, fg, border) {
      if (h <= 0) return;
      var capH = 7, capOver = 4;
      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.92;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      // cap at the gap-facing end
      var capY = isTop ? y + h - capH : y;
      ctx.fillRect(x - capOver, capY, w + capOver * 2, capH);
      // fluting lines
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
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

  /* ---------------- terminal ---------------- */

  var terminal = $('#terminal');
  if (!terminal) return;
  var termOut = $('#termOut');
  var termInput = $('#termInput');
  var statusBar = $('#statusBar');
  var history = [];

  var HINTS = [
    'try: cat resume.md',
    'try: cd experience',
    'try: ls case-studies',
    'try: theme light',
    'try: open claude',
    'try: email kenil',
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
      print('out', "Welcome. Type 'help' to list commands.");
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
  function printRow(c, d) {
    print('row', '<span class="c">' + c + '</span><span class="d">' + d + '</span>');
  }

  var SECTIONS = ['top', 'experience', 'cases', 'lab', 'about', 'stack', 'contact'];
  var ROOT = document.body.getAttribute('data-root') || '';

  function go(hash) {
    var el = document.getElementById(hash);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); return true; }
    window.location.href = ROOT + 'index.html#' + hash;
    return true;
  }

  var COMMANDS = {
    help: function () {
      printRow('help', 'List every command');
      printRow('cd', 'Jump to a section');
      printRow('ls', 'List items in a section');
      printRow('open', 'Open a case study or project');
      printRow('cat', 'View a file (e.g. resume.md)');
      printRow('email', 'Email Kenil');
      printRow('github', 'Open GitHub profile');
      printRow('linkedin', 'Open LinkedIn');
      printRow('phone', 'Call Kenil');
      printRow('theme', 'Switch theme: dark | light | toggle');
      printRow('accent', 'Override accent color');
      printRow('clear', 'Clear the palette output');
      printRow('history', 'Show recent commands');
    },
    cd: function (arg) {
      if (!arg) { print('out', 'usage: cd &lt;section&gt; — ' + SECTIONS.join(' | ')); return; }
      arg = arg.replace(/^\/+|\/+$/g, '');
      if (arg === 'experience' || arg === 'work-history') return void (go('experience') && print('out', '→ /experience'));
      if (arg === 'cases' || arg === 'case-studies') return void (go('cases') && print('out', '→ /case-studies'));
      if (SECTIONS.indexOf(arg) !== -1) return void (go(arg) && print('out', '→ /' + arg));
      print('err', 'no such directory: ' + arg);
    },
    ls: function (arg) {
      if (!arg) { print('out', SECTIONS.map(function (s) { return s + '/'; }).join('&nbsp;&nbsp;')); return; }
      if (/case/.test(arg)) { print('out', 'claude.md&nbsp;&nbsp;bolt.md'); return; }
      if (/lab/.test(arg)) { print('out', 'drift-notes/&nbsp;&nbsp;agent-loop/'); return; }
      print('out', SECTIONS.map(function (s) { return s + '/'; }).join('&nbsp;&nbsp;'));
    },
    open: function (arg) {
      if (/claude/.test(arg || '')) { window.location.href = ROOT + 'case-studies/claude.html'; return; }
      if (/bolt/.test(arg || '')) { window.location.href = ROOT + 'case-studies/bolt.html'; return; }
      if (/resume/.test(arg || '')) { window.location.href = ROOT + 'resume.html'; return; }
      print('out', 'usage: open &lt;claude | bolt | resume&gt;');
    },
    cat: function (arg) {
      if (/resume/.test(arg || '')) { window.location.href = ROOT + 'resume.html'; return; }
      if (/about/.test(arg || '')) { go('about'); print('out', '→ /about'); return; }
      if (/stack/.test(arg || '')) { go('stack'); print('out', '→ /stack'); return; }
      print('err', 'cat: ' + (arg || '?') + ': no such file');
    },
    email: function () {
      var url = 'mailto:' + PROFILE.email + '?subject=Hello%20Kenil';
      print('out', '→ <a href="' + url + '">' + url.replace('mailto:', 'mailto:') + '</a>');
      window.location.href = url;
    },
    github: function () { print('out', '→ ' + PROFILE.github); window.open(PROFILE.github, '_blank'); },
    linkedin: function () { print('out', '→ ' + PROFILE.linkedin); window.open(PROFILE.linkedin, '_blank'); },
    phone: function () { print('out', '→ tel:' + PROFILE.phone); window.location.href = 'tel:' + PROFILE.phone; },
    theme: function (arg) {
      var next = arg === 'toggle' || !arg ? (getTheme() === 'dark' ? 'light' : 'dark')
        : (arg === 'light' ? 'light' : 'dark');
      setTheme(next);
      print('out', 'theme → ' + next);
    },
    accent: function (arg) {
      if (!arg) { print('out', 'usage: accent &lt;css-color&gt; · e.g. accent #c0392b'); return; }
      if (window.CSS && CSS.supports('color', arg)) {
        document.documentElement.style.setProperty('--accent', arg);
        document.documentElement.style.setProperty('--accent-soft', arg);
        try { localStorage.setItem('kb:accent', arg); } catch (e) {}
        print('out', 'accent → ' + arg);
      } else { print('err', 'not a color: ' + arg); }
    },
    clear: function () { termOut.innerHTML = ''; },
    history: function () {
      if (!history.length) { print('out', '(empty)'); return; }
      history.slice(-10).forEach(function (h, i) { print('out', (i + 1) + '&nbsp;&nbsp;' + h); });
    },
  };

  termInput.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var raw = termInput.value.trim();
    termInput.value = '';
    if (!raw) return;
    history.push(raw);
    print('echo', '&gt; ' + raw.replace(/</g, '&lt;'));
    var parts = raw.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ').toLowerCase();
    if (COMMANDS[cmd]) COMMANDS[cmd](arg);
    else print('err', 'command not found: ' + cmd + " — try 'help'");
  });

  /* ---------------- case-study scrollspy ---------------- */

  var navLinks = document.querySelectorAll('.cs-nav a');
  if (navLinks.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('.cs-sec[id]').forEach(function (s) { obs.observe(s); });
  }
})();

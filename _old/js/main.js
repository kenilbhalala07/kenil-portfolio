/* ===================== clock + dock stamp ===================== */
function tick() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const date = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  document.querySelectorAll('.js-clock').forEach(el => el.textContent = time + ' IST');
  document.querySelectorAll('.js-stamp').forEach(el => el.textContent = date + ' · ' + time.slice(0, 5) + ' IST');
}
tick(); setInterval(tick, 1000);

/* ===================== rotating dock tips ===================== */
(function () {
  const tipEl = document.querySelector('.js-tip');
  if (!tipEl) return;
  const tips = [
    "try: ask about kenil", "try: cd experience", "try: ls case-studies",
    "try: theme light", "try: accent #1f47ff", "try: cat resume.md"
  ];
  let i = 0;
  setInterval(() => { i = (i + 1) % tips.length; tipEl.textContent = tips[i]; }, 5000);
})();

/* ===================== scramble-in big name ===================== */
(function () {
  const h1 = document.getElementById('bigname');
  if (!h1) return;
  const NAME = 'Kenil Bhalala';
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#________';
  const caret = h1.querySelector('.caret');
  const spans = [];
  NAME.split(' ').forEach((word, wi) => {
    if (wi > 0) h1.insertBefore(document.createTextNode(' '), caret);
    const w = document.createElement('span');
    w.style.display = 'inline-block';
    w.style.whiteSpace = 'nowrap';
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.dataset.target = ch;
      s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      w.appendChild(s);
      spans.push(s);
    }
    h1.insertBefore(w, caret);
  });
  let frame = 0;
  const iv = setInterval(() => {
    frame++;
    let done = true;
    spans.forEach((s, i) => {
      if (frame > i * 2 + 8) { s.textContent = s.dataset.target; }
      else { s.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; done = false; }
    });
    if (done) clearInterval(iv);
  }, 40);
})();

/* ===================== ticker loop ===================== */
(function () {
  const track = document.getElementById('ticker-track');
  if (track) track.innerHTML += track.innerHTML;
})();

/* ===================== flappy — AI plays, tap to take over ===================== */
(function () {
  const canvas = document.getElementById('flappy');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('flappy-status');
  const footEl = document.getElementById('flappy-foot');
  const scoreEl = document.getElementById('flappy-score');
  const bestEl = document.getElementById('flappy-best');

  const W = 320, H = 230, GROUND = 18;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const css = () => getComputedStyle(document.documentElement);
  const col = name => css().getPropertyValue(name).trim();

  let mode = 'auto';            // auto | player | over | resetting
  let bird, pillars, score, best = 0, t = 0, resetAt = 0;

  function reset() {
    bird = { x: 70, y: H / 2, vy: 0 };
    pillars = [];
    score = 0; t = 0;
    for (let i = 0; i < 3; i++) spawn(W + 60 + i * 130);
  }
  function spawn(x) {
    const gap = 78;
    const cy = 45 + Math.random() * (H - GROUND - 90);
    pillars.push({ x, top: cy - gap / 2, bot: cy + gap / 2, scored: false });
  }
  function flap() { bird.vy = -3.4; }

  function aiThink() {
    // aim for the centre of the next gap, with a little noise so it can trip
    const next = pillars.find(p => p.x + 26 > bird.x);
    if (!next) return;
    const target = (next.top + next.bot) / 2 + 6;
    const noise = Math.sin(t * 0.013) * 7;
    if (bird.y + noise > target && bird.vy > -1) flap();
  }

  function setMode(m) {
    mode = m;
    if (m === 'auto')   { statusEl.textContent = 'AUTO';  footEl.textContent = 'AI · TAP TO TAKE OVER'; }
    if (m === 'player') { statusEl.textContent = 'YOU';   footEl.textContent = 'YOU · KEEP FLAPPING'; }
    if (m === 'over')   { statusEl.textContent = 'OVER';  footEl.textContent = 'YOUR RUN ENDED'; }
    if (m === 'resetting') { statusEl.textContent = 'RESET'; footEl.textContent = 'AI RESETTING…'; }
  }

  function die() {
    best = Math.max(best, score);
    bestEl.textContent = String(best).padStart(2, '0');
    if (mode === 'player') { setMode('over'); }
    else { setMode('resetting'); resetAt = t + 80; }
  }

  function step() {
    t++;
    if (mode === 'resetting') { if (t >= resetAt) { reset(); setMode('auto'); } draw(); requestAnimationFrame(step); return; }
    if (mode === 'over') { draw(); requestAnimationFrame(step); return; }

    if (mode === 'auto') aiThink();
    bird.vy += 0.16;
    bird.y += bird.vy;

    pillars.forEach(p => p.x -= 1.25);
    if (pillars[0].x < -40) { pillars.shift(); spawn(pillars[pillars.length - 1].x + 130); }

    for (const p of pillars) {
      if (!p.scored && p.x + 13 < bird.x) { p.scored = true; score++; scoreEl.textContent = String(score).padStart(2, '0'); }
      if (bird.x > p.x - 8 && bird.x < p.x + 34 && (bird.y < p.top + 4 || bird.y > p.bot - 4)) return die(), draw(), requestAnimationFrame(step);
    }
    if (bird.y > H - GROUND - 4 || bird.y < 4) return die(), draw(), requestAnimationFrame(step);

    draw();
    requestAnimationFrame(step);
  }

  function drawColumn(x, yTop, yBot) {
    const ink = col('--ink');
    ctx.fillStyle = ink;
    // greek column: capital + shaft, top pillar hangs down, bottom rises up
    if (yTop > 0) {            // top pillar: from 0 to yTop
      ctx.fillRect(x + 4, 0, 18, yTop - 8);
      ctx.fillRect(x, yTop - 8, 26, 4);      // abacus
      ctx.fillRect(x + 2, yTop - 4, 22, 4);  // echinus
    }
    if (yBot < H - GROUND) {   // bottom pillar: from yBot to ground
      ctx.fillRect(x, yBot, 26, 4);
      ctx.fillRect(x + 2, yBot + 4, 22, 4);
      ctx.fillRect(x + 4, yBot + 8, 18, H - GROUND - yBot - 8);
    }
  }

  function draw() {
    const accent = col('--accent'), ink = col('--ink'), hair = col('--hair'), mute = col('--mute');
    ctx.clearRect(0, 0, W, H);

    pillars.forEach(p => drawColumn(p.x, p.top, p.bot));

    // hatched ground
    ctx.strokeStyle = mute; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, H - GROUND + 0.5, W - 1, GROUND - 1);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, H - GROUND, W, GROUND); ctx.clip();
    for (let x = -GROUND; x < W; x += 6) {
      ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + GROUND, H - GROUND); ctx.stroke();
    }
    ctx.restore();

    // bird
    ctx.fillStyle = accent;
    ctx.font = '700 13px "Geist Mono", monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('<°)~', bird.x - 14, bird.y);

    // overlays
    if (mode === 'over' || mode === 'resetting') {
      const msg = mode === 'over' ? 'GAME OVER · TAP / SPACE TO RETRY' : 'AI TRIPPED · RESTARTING';
      ctx.font = '9px "Geist Mono", monospace';
      const w = ctx.measureText(msg).width + 20;
      ctx.fillStyle = col('--bg'); ctx.fillRect((W - w) / 2, H / 2 - 12, w, 24);
      ctx.strokeStyle = hair; ctx.strokeRect((W - w) / 2 + .5, H / 2 - 11.5, w - 1, 23);
      ctx.fillStyle = ink; ctx.textAlign = 'center';
      ctx.fillText(msg, W / 2, H / 2 + 1);
      ctx.textAlign = 'left';
    }
  }

  function interact() {
    if (mode === 'over') { reset(); setMode('player'); scoreEl.textContent = '00'; flap(); return; }
    if (mode === 'auto') setMode('player');
    if (mode === 'player') flap();
  }
  canvas.addEventListener('pointerdown', interact);
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && (mode === 'player' || mode === 'over') && !termIsOpen()) { e.preventDefault(); interact(); }
  });

  reset(); setMode('auto'); step();
})();

/* ===================== terminal dock ===================== */
const SECTIONS = ['work', 'experience', 'cases', 'lab', 'about', 'skills', 'contact'];
const LINKS = {
  github: 'https://github.com/',
  linkedin: 'https://www.linkedin.com/',
  discord: 'https://discord.com/',
  email: 'mailto:kenil@example.com'
};
function termIsOpen() {
  const t = document.getElementById('term');
  return t && t.classList.contains('open');
}
(function () {
  const term = document.getElementById('term');
  if (!term) return;
  const out = term.querySelector('.out');
  const input = term.querySelector('input');
  const openBtn = document.querySelector('.js-open-term');
  const history = [];

  // path prefix for subpages (terminal lives on every page)
  const root = document.body.dataset.root || '';

  function print(html, cls) {
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }
  function open() { term.classList.add('open'); setTimeout(() => input.focus(), 220); }
  function close() { term.classList.remove('open'); input.blur(); }

  openBtn && openBtn.addEventListener('click', open);
  window.addEventListener('keydown', e => {
    if (e.key === '/' && !termIsOpen() && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); open(); }
    if (e.key === 'Escape' && termIsOpen()) close();
  });

  const HELP = [
    ['help', 'List every command'],
    ['cd', 'Jump to a section'],
    ['ls', 'List items in a section'],
    ['open', 'Open a case study or project'],
    ['cat', 'View a file (e.g. resume.md)'],
    ['email', 'Email Kenil'],
    ['github', 'Open GitHub profile'],
    ['linkedin', 'Open LinkedIn'],
    ['discord', 'Open Discord'],
    ['theme', 'Switch theme: dark | light | toggle'],
    ['accent', 'Override accent color'],
    ['clear', 'Clear the palette output'],
    ['history', 'Show recent commands'],
    ['ask', 'Force a question to the AI assistant'],
  ];

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    history.push(line);
    print(escapeHtml(line), 'cmd-echo');
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
        print('<table class="cmds">' + HELP.map(([c, d]) => `<tr><td>${c}</td><td>${d}</td></tr>`).join('') + '</table>');
        break;
      case 'cd': {
        const target = (arg || '').replace(/\/$/, '');
        if (target === 'resume') { location.href = root + 'resume.html'; break; }
        if (SECTIONS.includes(target)) {
          close();
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
        } else print(`cd: no such section: ${escapeHtml(target)} — try one of: ${SECTIONS.join(', ')}, resume`, 'err');
        break;
      }
      case 'ls':
        if (/case/.test(arg)) print('claude/   bolt/', 'muted');
        else print(SECTIONS.map(s => s + '/').join('   ') + '   resume.md', 'muted');
        break;
      case 'open':
        if (/claude/i.test(arg)) location.href = root + 'case-studies/claude.html';
        else if (/bolt/i.test(arg)) location.href = root + 'case-studies/bolt.html';
        else if (/resume/i.test(arg)) location.href = root + 'resume.html';
        else print('open: claude | bolt | resume', 'err');
        break;
      case 'cat':
        if (/resume/.test(arg)) location.href = root + 'resume.html';
        else if (/about/.test(arg)) { close(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }
        else if (/stack/.test(arg)) { close(); document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }); }
        else print('cat: about.md | stack.txt | resume.md', 'err');
        break;
      case 'email': location.href = LINKS.email; break;
      case 'github': window.open(LINKS.github, '_blank'); break;
      case 'linkedin': window.open(LINKS.linkedin, '_blank'); break;
      case 'discord': window.open(LINKS.discord, '_blank'); break;
      case 'theme': {
        const cur = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
        const next = arg === 'toggle' || !arg ? (cur === 'light' ? 'dark' : 'light') : arg;
        if (next === 'light' || next === 'dark') {
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem('kb:theme', next); } catch (e) {}
          print('theme set to ' + next, 'muted');
        } else print('theme: dark | light | toggle', 'err');
        break;
      }
      case 'accent': {
        const named = { red: '#ff2222', blue: '#1f47ff', green: '#00c853', orange: '#ff7a18', purple: '#8a3cff', reset: '#ff2222' };
        const val = named[arg] || arg;
        if (/^#[0-9a-fA-F]{3,8}$/.test(val)) {
          document.documentElement.style.setProperty('--accent', val);
          try { localStorage.setItem('kb:accent', val); } catch (e) {}
          print(`accent set to <span style="color:${val}">${val}</span>`, 'muted');
        } else print('accent: pass a hex like #1f47ff, or red | blue | green | orange | purple | reset', 'err');
        break;
      }
      case 'clear': out.innerHTML = ''; break;
      case 'history': print(history.map((h, i) => `${String(i + 1).padStart(3, ' ')}  ${escapeHtml(h)}`).join('\n'), 'muted'); break;
      case 'ask': print("the AI assistant isn't wired up in this replica — email kenil instead :)", 'muted'); break;
      default: print(`command not found: ${escapeHtml(cmd)} — try 'help'`, 'err');
    }
  }
  function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { run(input.value); input.value = ''; }
  });
})();

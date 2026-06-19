# Kenil Bhalala — Portfolio

A hand-built, zero-dependency personal portfolio for **Kenil Bhalala**, Associate Product Manager.
Static site: plain HTML + CSS + vanilla JS, no build step.

## Two themes, one site

- **Wizard (default)** — a wizarding-academia treatment (all original artwork & copy): ember-&-crimson palette with a **Lumos / Nox** day–night toggle, an interactive **spell console** with an inventory of items wired to real actions, a "catch-the-Snitch" mini-game, scroll-reveal motion, and a **Calm mode** that quiets the effects for fast scanning.
  - `index.html` · `resume.html` · `case-studies/claude.html` · `case-studies/bolt.html`
- **Terminal (archived)** — the original CLI-styled version, preserved under `*-terminal.html`.
  - `index-terminal.html` · `resume-terminal.html` · `case-studies/*-terminal.html`

## Run it

It's fully static — just open `index.html`, or serve the folder:

```bash
npx serve .        # or: python3 -m http.server
```

## Structure

```
index.html              landing (wizard)
resume.html             résumé (downloadable PDF in /files)
case-studies/           Claude & Bolt write-ups
css/wizard.css          wizard theme + tokens, motion, layout
css/style.css           terminal theme
js/wizard.js            console + game + nav/UX + theme
js/wizard-fx.js         motion + decorative graphics (window.WizFX)
js/main.js              terminal-site behaviors
imgs/ · files/          photo · résumé PDF
```

## Accessibility

Respects `prefers-reduced-motion`, keyboard-operable, visible focus, skip-link, and a user-toggleable Calm mode that also reverts the custom cursor.

— Built by hand · 2026

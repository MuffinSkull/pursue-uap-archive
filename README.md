# PURSUE · UAP / UFO Release 01 — Visual archive

**Interactive browser for the Department of War “PURSUE” public UAP release — built with React, Three.js, and Framer Motion.**

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## Why people star & share this repo

This project turns a **major government transparency drop** into a **fast, cinematic web UI**: search and filter **161 records**, open PDFs, DVIDS mission video, and imagery in one place — with a **WebGL hero scene** and smooth motion design. That combo (timely topic + real data + polished frontend) is exactly what spreads on GitHub, dev Twitter/X, Reddit (`r/UFOs`, `r/webdev`), and Hacker News — **if you ship a live demo and tag it well**.

> **Reality check:** Nobody can promise “millions of views.” Traffic comes from **how you distribute** the repo (live URL, GitHub Topics, social posts, Show HN, etc.). This README is written so both humans and search engines understand what you built — **maximize discovery**, not hype.

---

## Features

- **161 catalog records** — PDFs, video (DVIDS / CloudFront), and images  
- **Filters** — agency, media type, full-text-style search  
- **Inspector** — overview, embedded media, per-file links, raw JSON  
- **Three.js + React Three Fiber** — animated starfield / wireframe “data core” hero  
- **Framer Motion** — grid and slide-over panel transitions  
- **Offline mirror script** — optional bulk download of mirrored assets (~3.6 GB)

---

## Quick start

```bash
cd viewer
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
cd viewer
npm run build
npm run preview
```

---

## Publish to GitHub (public)

This machine has **Git** and (after install) the **GitHub CLI** (`gh`). Creating a public repo and pushing **requires a one-time login** to your GitHub account (the agent cannot do that for you without your credentials).

1. **Install GitHub CLI** (if `gh` is not found):  
   `winget install GitHub.cli`
2. **Log in** (device flow — browser):  
   ```
   "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol https --web
   ```  
   Open [github.com/login/device](https://github.com/login/device) and paste the one-time code from the terminal.
3. **From the repo root** (`UFO/`), create the public remote and push:  
   ```powershell
   .\scripts\publish-github.ps1
   ```  
   Or pick a name: `.\scripts\publish-github.ps1 -RepoName "pursue-uap-archive"`  
   Equivalent one-liner:  
   `gh repo create pursue-uap-archive --public --source . --remote origin --push --description "PURSUE UAP archive viewer"`

If the repo name is already taken, change `-RepoName` / the `gh repo create` name.

---

## Data source & disclaimer

Official portal: [war.gov/UFO](https://www.war.gov/UFO/) (PURSUE).

Automated scraping of `war.gov` often hits **Akamai protection** (403). This app loads metadata from a **public mirror** on Hugging Face ([Blessespain/dow-ufo-release-01](https://huggingface.co/datasets/Blessespain/dow-ufo-release-01)) — same release files, documented mirror — plus `manifest.json`, `dvids_videos.json`, and `uap-csv.csv` shipped under `viewer/public/` and `data/`.

Content is **U.S. government–released material**; this repository is an **independent viewer**, not affiliated with the Department of War or any agency.

---

## Optional: download everything locally (~3.6 GB)

Requires `data/manifest.json` and `data/dvids_videos.json` at repo root:

```bash
cd viewer
npm run download:data
```

Outputs to `downloads/` (PDFs, thumbnails, images, videos, CSV).

---

## Grow visibility on GitHub (what actually moves the needle)

1. **Add Topics** on the repo page — e.g. `uap`, `ufo`, `react`, `threejs`, `framer-motion`, `typescript`, `vite`, `government-data`, `visualization`, `open-data`.  
2. **Deploy a live demo** (Vercel, Netlify, Cloudflare Pages) and put the **URL at the top** of this README — repos with one-click demos outperform “clone-only” projects.  
3. **Pin the repo** on your GitHub profile and add a **short profile README** linking here.  
4. **Post once** where developers and topic fans overlap — bad spam hurts; one solid Show HN / thoughtful Reddit post / thread with the demo link is enough to test traction.  
5. **Good screenshot or GIF** in the README — record 10 seconds of the hero + grid and drop it under **Screenshots**.

---

## Repo layout

| Path | Purpose |
|------|---------|
| `viewer/` | React + Vite app |
| `viewer/public/` | `manifest.json`, `dvids_videos.json`, `uap-csv.csv` for the UI |
| `data/` | Same JSON/CSV copies for scripts |
| `scripts/download-release.mjs` | Bulk download from the HF mirror |

---

## License

Project code: **MIT** (recommended — add a `LICENSE` file if you adopt this).

Government documents retain their **public-domain–style** status in the U.S.; see [USA.gov copyright notice](https://www.usa.gov/government-copyright).

---

## Acknowledgments

- Release data: U.S. Department of War PURSUE / public mirror maintainers.  
- Stack: [Vite](https://vitejs.dev/), [React](https://react.dev/), [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/), [drei](https://github.com/pmndrs/drei), [Framer Motion](https://www.framer.com/motion/).

---

**Star ⭐ this repo** if it saves you time — and **fork** it if you want your own themed archive UI.

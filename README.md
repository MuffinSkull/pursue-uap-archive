# PURSUE · UAP / UFO Release 01 — Visual archive

Hey — **MuffinSkull** here. I built this project because I wanted a **single place to actually browse** the Department of War’s public PURSUE drop: PDFs, DVIDS footage, photos — without juggling a dozen tabs. It’s a **React** app with a **Three.js** hero (React Three Fiber + drei) and **Framer Motion** for the grid and slide-over inspector.

**Live repo:** [github.com/MuffinSkull/pursue-uap-archive](https://github.com/MuffinSkull/pursue-uap-archive)

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## What I shipped

- **161 catalog records** — documents, DVIDS / CloudFront video, and imagery  
- **Search + filters** — agency, type (PDF / video / image), text search  
- **Inspector** — story/meta, embedded previews, every file link, raw JSON  
- **WebGL hero** — starfield + wireframe “core” (lazy-loaded so the first paint stays light)  
- **Optional offline mirror** — script to pull the full mirrored asset set (~3.6 GB) if you want everything local  

I’m not claiming government affiliation — this is **my viewer** on top of **public releases**. See disclaimer below.

---

## Run it locally

```bash
cd viewer
npm install
npm run dev
```

Then open whatever URL Vite prints (usually `http://localhost:5173`).

### Build for production

```bash
cd viewer
npm run build
npm run preview
```

---

## Data — how I hook it up

The official portal is [war.gov/UFO](https://www.war.gov/UFO/) (PURSUE). When I tried scripted pulls, **`war.gov` often returned 403** (Akamai), so the app loads releases from a **documented public mirror** on Hugging Face: [Blessespain/dow-ufo-release-01](https://huggingface.co/datasets/Blessespain/dow-ufo-release-01). Same tranche of files, structured for mirrors.

Bundled for the UI: `manifest.json`, `dvids_videos.json`, and `uap-csv.csv` under `viewer/public/` (copies also live in `data/` for scripts).

**Disclaimer:** The underlying PDFs/media are **U.S. government–released material**. This repo is **independent** — not endorsed by or affiliated with the Department of War, NASA, FBI, State, or anyone else.

---

## Download everything offline (~3.6 GB)

If you want the full mirror on disk (I use this when I don’t want to rely on CDNs):

```bash
cd viewer
npm run download:data
```

Needs `data/manifest.json` and `data/dvids_videos.json`. Output goes to `downloads/`.

---

## Publishing (how I pushed this)

I use **Git** and the **GitHub CLI** (`gh`). One-time login:

```powershell
& "$env:ProgramFiles\GitHub CLI\gh.exe" auth login --hostname github.com --git-protocol https --web
```

Then from the repo root you can use my helper script or `gh repo create` — see `scripts/publish-github.ps1`. This repo is already public under my account (link at the top).

---

## Repo layout (for anyone forking)

| Path | What it is |
|------|------------|
| `viewer/` | The Vite + React app |
| `viewer/public/` | Manifest + CSV + DVIDS JSON the UI fetches |
| `data/` | Same files for local scripts |
| `scripts/download-release.mjs` | Bulk download from the HF mirror |
| `scripts/publish-github.ps1` | How I publish to GitHub |

---

## License

I’m releasing **my code** under **MIT** — see [`LICENSE`](LICENSE) in this repo.

Government documents in the release stay **public-domain–style** in the U.S.; see [USA.gov — government copyright](https://www.usa.gov/government-copyright).

---

## Credits

- **Data / release:** PURSUE portal maintainers + mirror packagers (linked above).  
- **Stack I used:** [Vite](https://vitejs.dev/), [React](https://react.dev/), [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/), [drei](https://github.com/pmndrs/drei), [Framer Motion](https://www.framer.com/motion/).

---

If this saves you time, a **star** helps. If you fork and theme your own archive, tag me — I’d love to see what you build.

— **MuffinSkull**

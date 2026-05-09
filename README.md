# PURSUE · UAP / UFO Release 01 — Visual archive

Hey — **MuffinSkull** here. This project is a **single place to browse** the Department of War’s public PURSUE drop: PDFs, DVIDS footage, and photos — without juggling a dozen tabs. It’s a **React** app with **React Three Fiber** + **drei** for the WebGL views, **Framer Motion** for the grid and inspector motion, and **Lenis** for smooth scrolling.

**Live repo:** [github.com/MuffinSkull/pursue-uap-archive](https://github.com/MuffinSkull/pursue-uap-archive)

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?logo=threedotjs)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## What’s in the app

- **Grid archive** — responsive cards with agency badge, type (PDF / video / image), and quick actions  
- **3D knowledge map** — interactive graph of releases linked by agency, year, location, and media type; space-themed flying-disc hulls, starfield, bloom; physics-style layout and orbit controls  
- **Search + filters** — agency, release type, text search  
- **Inspector** — slide-over panel with metadata, embedded previews, file links, and raw JSON (rendered via a root portal so it stacks above the WebGL canvas)  
- **Hero / backdrop** — lazy-loaded cosmic WebGL backdrop on the landing strip  
- **Optional offline mirror** — script to pull the mirrored asset set (~3.6 GB) for fully local use  

Data volume follows whatever `viewer/public/manifest.json` contains when you build or run (the upstream PURSUE tranche). Supplementary CSVs in the repo root (e.g. `all_documents.csv`) are for analysis or tooling, not required for the default UI.

I’m not claiming government affiliation — this is **my viewer** on top of **public releases**. See disclaimer below.

---

## Run it locally

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

## Repository layout (high level)

| Path | Purpose |
|------|---------|
| `viewer/` | Vite + React app (main UI) |
| `viewer/src/components/` | `ArchiveCanvas`, `KnowledgeMapScene`, `MapViewChrome`, `Inspector`, `RecordCard`, etc. |
| `viewer/src/lib/` | Manifest resolution, knowledge graph build, 3D layout helpers |
| `viewer/public/` | `manifest.json`, `dvids_videos.json`, bundled CSV copies |
| `data/` | Same JSON/CSV copies for scripts |
| `scripts/` | Data download / tooling |
| `.cursor/skills/` | Optional Cursor agent skills (Three.js reference markdown from [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills/tree/main/skills)) — safe to delete if you don’t use Cursor |

---

## Data sources

The official portal is [war.gov/UFO](https://www.war.gov/UFO/) (PURSUE). Scripted pulls against `war.gov` often hit **403** (Akamai), so the app loads releases from a **documented public mirror** on Hugging Face: [Blessespain/dow-ufo-release-01](https://huggingface.co/datasets/Blessespain/dow-ufo-release-01).

The UI reads **`manifest.json`**, **`dvids_videos.json`**, and related assets from **`viewer/public/`** (copies also live under **`data/`** for scripts).

**Disclaimer:** The underlying PDFs and media are **U.S. government–released material**. This repo is **independent** — not endorsed by or affiliated with the Department of War, NASA, FBI, State, or anyone else.

---

## Download everything offline (~3.6 GB)

```bash
cd viewer
npm run download:data
```

Requires `data/manifest.json` and `data/dvids_videos.json`. Output goes to `downloads/` (ignored by git).

---

## License

**My code** is under **MIT** — see [`LICENSE`](LICENSE).

Government documents in the release remain **public-domain–style** in the U.S.; see [USA.gov — government copyright](https://www.usa.gov/government-copyright).

---

## Credits

- **Data / release:** PURSUE portal maintainers and mirror packagers (linked above).  
- **Stack:** [Vite](https://vitejs.dev/), [React](https://react.dev/), [Three.js](https://threejs.org/), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/), [drei](https://github.com/pmndrs/drei), [postprocessing](https://github.com/pmndrs/postprocessing), [Framer Motion](https://www.framer.com/motion/), [Lenis](https://github.com/darkroomengineering/lenis).

---

If this saves you time, a **star** helps. If you fork and theme your own archive, tag me — I’d love to see what you build.

— **MuffinSkull**

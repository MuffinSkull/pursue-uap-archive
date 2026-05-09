/**
 * Downloads every mirrored asset from the Blessespain/dow-ufo-release-01 dataset:
 * all paths referenced in data/manifest.json, every DVIDS mp4 from data/dvids_videos.json,
 * plus csv/uap-csv.csv into ./downloads/ (~3.6 GB total — run when ready).
 *
 * Usage: node scripts/download-release.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'downloads');

const HF_RESOLVE =
  'https://huggingface.co/datasets/Blessespain/dow-ufo-release-01/resolve/main';

function hfUrl(rel) {
  const trimmed = rel.replace(/^\/+/, '');
  return `${HF_RESOLVE}/${trimmed.split('/').map(encodeURIComponent).join('/')}`;
}

async function downloadFile(url, destPath) {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PURSUE-local-mirror/1.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(destPath, buf);
}

const manifestPath = path.join(DATA, 'manifest.json');
const dvidsPath = path.join(DATA, 'dvids_videos.json');

if (!fs.existsSync(manifestPath) || !fs.existsSync(dvidsPath)) {
  console.error('Missing data/manifest.json or data/dvids_videos.json. Run from repo root.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const dvids = JSON.parse(fs.readFileSync(dvidsPath, 'utf8'));

/** @type {{ url: string; dest: string }[]} */
const tasks = [];

for (const row of manifest) {
  for (const f of row.files || []) {
    tasks.push({ url: hfUrl(f), dest: path.join(OUT, f) });
  }
}

for (const row of dvids) {
  const id = row.dvids.id;
  tasks.push({
    url: row.dvids.video,
    dest: path.join(OUT, 'videos', `dvids_${id}.mp4`),
  });
}

tasks.push({
  url: hfUrl('csv/uap-csv.csv'),
  dest: path.join(OUT, 'csv/uap-csv.csv'),
});

tasks.push({
  url: hfUrl('metadata/manifest.json'),
  dest: path.join(OUT, 'metadata/manifest.json'),
});

const CONCURRENCY = 4;
let cursor = 0;
let ok = 0;
let fail = 0;

async function worker() {
  for (;;) {
    const i = cursor++;
    if (i >= tasks.length) break;
    const t = tasks[i];
    try {
      await downloadFile(t.url, t.dest);
      ok++;
      console.log(`[${ok + fail}/${tasks.length}] OK ${t.dest}`);
    } catch (e) {
      fail++;
      console.error(`[${ok + fail}/${tasks.length}] FAIL ${t.url}`, e.message);
    }
  }
}

console.log(`Downloading ${tasks.length} files to ${OUT} …`);
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
console.log(`Done. Success: ${ok}, failed: ${fail}`);

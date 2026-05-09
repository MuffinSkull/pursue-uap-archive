import * as React from 'react';
import { motion } from 'framer-motion';
import type { DvidsEntry, ReleaseRecord } from './types';
import { buildVideoLookup } from './lib/videoLookup';
import { resolveRecord, type ResolvedRecord } from './lib/resolveRecord';
import { RecordCard } from './components/RecordCard';
import { Inspector } from './components/Inspector';
import './pursue.css';

const ArchiveCanvas = React.lazy(() =>
  import('./components/ArchiveCanvas').then((m) => ({ default: m.ArchiveCanvas })),
);

async function loadManifest(): Promise<ReleaseRecord[]> {
  const res = await fetch('/manifest.json');
  if (!res.ok) throw new Error('Failed to load manifest');
  return res.json() as Promise<ReleaseRecord[]>;
}

async function loadDvids(): Promise<DvidsEntry[]> {
  const res = await fetch('/dvids_videos.json');
  if (!res.ok) throw new Error('Failed to load video index');
  return res.json() as Promise<DvidsEntry[]>;
}

export default function App() {
  const [records, setRecords] = React.useState<ResolvedRecord[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [agency, setAgency] = React.useState<string>('all');
  const [rtype, setRtype] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<ResolvedRecord | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [manifest, dvidsRows] = await Promise.all([loadManifest(), loadDvids()]);
        if (cancelled) return;
        const lookup = buildVideoLookup(dvidsRows);
        const resolved = manifest.map((r, i) => resolveRecord(r, i, lookup));
        setRecords(resolved);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Load error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const agencies = React.useMemo(() => {
    const s = new Set(records.map((r) => r.record.agency));
    return ['all', ...[...s].sort()];
  }, [records]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (agency !== 'all' && r.record.agency !== agency) return false;
      if (rtype !== 'all' && r.record.type !== rtype) return false;
      if (!q) return true;
      const blob =
        `${r.record.title} ${r.record.description} ${r.record.incident_location}`.toLowerCase();
      return blob.includes(q);
    });
  }, [records, agency, rtype, query]);

  const counts = React.useMemo(() => {
    const c = { PDF: 0, VID: 0, IMG: 0 };
    for (const r of records) {
      const t = r.record.type;
      if (t in c) c[t as keyof typeof c]++;
    }
    return c;
  }, [records]);

  return (
    <div className="pursue">
      <header className="pursue__hero">
        <React.Suspense fallback={<div className="archive-canvas archive-canvas--loading" aria-hidden />}>
          <ArchiveCanvas />
        </React.Suspense>
        <div className="pursue__hero-inner">
          <motion.p
            className="pursue__eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            PURSUE · Release 01 (mirror)
          </motion.p>
          <motion.h1
            className="pursue__title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            Unidentified anomalous phenomena archive
          </motion.h1>
          <motion.p
            className="pursue__sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {records.length > 0 ? (
              <>
                Browse all <strong>{records.length}</strong> published records (PDFs, DVIDS video, and
                imagery). Media resolves from the public{' '}
                <a
                  href="https://huggingface.co/datasets/Blessespain/dow-ufo-release-01"
                  target="_blank"
                  rel="noreferrer"
                >
                  Hugging Face mirror
                </a>{' '}
                of the war.gov release (Akamai blocks scripted pulls from this environment).
              </>
            ) : (
              'Loading manifest…'
            )}
          </motion.p>
          {records.length > 0 && (
            <motion.div
              className="pursue__stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <span>
                PDF <strong>{counts.PDF}</strong>
              </span>
              <span>
                Video <strong>{counts.VID}</strong>
              </span>
              <span>
                Image <strong>{counts.IMG}</strong>
              </span>
              <a className="pursue__csv" href="/uap-csv.csv" target="_blank" rel="noreferrer">
                Master CSV
              </a>
            </motion.div>
          )}
        </div>
      </header>

      {error && <p className="pursue__error">{error}</p>}

      <section className="pursue__controls">
        <label className="pursue__field">
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, description, location…"
            autoComplete="off"
          />
        </label>
        <label className="pursue__field">
          <span>Agency</span>
          <select value={agency} onChange={(e) => setAgency(e.target.value)}>
            {agencies.map((a) => (
              <option key={a} value={a}>
                {a === 'all' ? 'All agencies' : a}
              </option>
            ))}
          </select>
        </label>
        <label className="pursue__field">
          <span>Type</span>
          <select value={rtype} onChange={(e) => setRtype(e.target.value)}>
            <option value="all">All types</option>
            <option value="PDF">PDF</option>
            <option value="VID">Video</option>
            <option value="IMG">Image</option>
          </select>
        </label>
        <p className="pursue__count">
          Showing <strong>{filtered.length}</strong> of {records.length}
        </p>
      </section>

      <motion.section
        className="pursue__grid"
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {filtered.map((item) => (
          <RecordCard
            key={item.record.title + item.index}
            item={item}
            layoutId={`card-${item.index}`}
            onOpen={() => setSelected(item)}
          />
        ))}
      </motion.section>

      <footer className="pursue__foot">
        <p>
          Source: U.S. Department of War PURSUE portal{' '}
          <a href="https://www.war.gov/UFO/" target="_blank" rel="noreferrer">
            war.gov/UFO
          </a>
          . Visualizations use Three.js and Framer Motion; document bodies stream from the mirror URLs.
        </p>
      </footer>

      <Inspector item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}

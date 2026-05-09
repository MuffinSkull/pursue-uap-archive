import * as React from 'react';
import Lenis from 'lenis';
import { motion } from 'framer-motion';
import type { DvidsEntry, ReleaseRecord } from './types';
import { buildVideoLookup } from './lib/videoLookup';
import { resolveRecord, type ResolvedRecord } from './lib/resolveRecord';
import { RecordCard } from './components/RecordCard';
import { Inspector } from './components/Inspector';
import { MapViewChrome } from './components/MapViewChrome';
import { CosmicBackdrop } from './components/CosmicBackdrop';
import { buildKnowledgeGraph } from './lib/buildKnowledgeGraph';
import { layoutKnowledgeGraphPositions } from './lib/layoutGraph3d';
import './pursue.css';

const ArchiveCanvas = React.lazy(() =>
  import('./components/ArchiveCanvas').then((m) => ({ default: m.ArchiveCanvas })),
);

const KnowledgeMapCanvas = React.lazy(() =>
  import('./components/KnowledgeMapScene').then((m) => ({ default: m.KnowledgeMapCanvas })),
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
  const [viewMode, setViewMode] = React.useState<'grid' | 'map'>('grid');
  const [mapSelectionId, setMapSelectionId] = React.useState<string | null>(null);
  const [showAllMapEdges, setShowAllMapEdges] = React.useState(false);

  React.useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.92,
    });
    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

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

  const knowledgeMap = React.useMemo(() => {
    if (records.length === 0) return null;
    const graph = buildKnowledgeGraph(records);
    const positions = layoutKnowledgeGraphPositions(graph.nodes, graph.edges);
    return { graph, positions };
  }, [records]);

  const mapSelectionSummary = React.useMemo(() => {
    if (!mapSelectionId || !knowledgeMap) return null;
    const n = knowledgeMap.graph.nodeById.get(mapSelectionId);
    return n ? `${n.kind}: ${n.label}` : null;
  }, [mapSelectionId, knowledgeMap]);

  return (
    <div className="pursue pursue--xeno">
      <CosmicBackdrop />
      <a className="pursue__skip" href="#archive-main">
        Skip to archive
      </a>
      <header className="pursue__hero">
        <React.Suspense fallback={<div className="archive-canvas archive-canvas--loading" aria-hidden />}>
          <ArchiveCanvas />
        </React.Suspense>
        <div className="pursue__hero-inner">
          <div className="pursue__hero-panel-shell">
            <div className="pursue__hero-panel">
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
              className="pursue__tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              Phase-indexed manifold · Observable parallels · Extradimensional telemetry
            </motion.p>
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
                <div className="pursue__stat">
                  <span className="pursue__stat-label">PDF</span>
                  <span className="pursue__stat-value">{counts.PDF}</span>
                </div>
                <div className="pursue__stat">
                  <span className="pursue__stat-label">Video</span>
                  <span className="pursue__stat-value">{counts.VID}</span>
                </div>
                <div className="pursue__stat">
                  <span className="pursue__stat-label">Image</span>
                  <span className="pursue__stat-value">{counts.IMG}</span>
                </div>
                <a className="pursue__csv" href="/uap-csv.csv" target="_blank" rel="noreferrer">
                  Master CSV
                </a>
              </motion.div>
            )}
            </div>
          </div>
        </div>
      </header>

      <main id="archive-main" className="pursue__main">
      <MapViewChrome
        viewMode={viewMode}
        onViewModeChange={(v) => setViewMode(v)}
        showAllEdges={showAllMapEdges}
        onShowAllEdgesChange={setShowAllMapEdges}
        selectionSummary={viewMode === 'map' ? mapSelectionSummary : null}
      />

      {error && <p className="pursue__error">{error}</p>}

      {viewMode === 'grid' && (
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
      )}

      {viewMode === 'map' && knowledgeMap && (
        <div className="pursue__map-wrap">
          <React.Suspense
            fallback={<div className="pursue__map-fallback" aria-busy="true">Loading 3D map…</div>}
          >
            <KnowledgeMapCanvas
              graph={knowledgeMap.graph}
              positions={knowledgeMap.positions}
              records={records}
              selectedId={mapSelectionId}
              onSelectNodeId={(id) => {
                setMapSelectionId(id);
                if (id?.startsWith('record:')) {
                  const idx = parseInt(id.replace(/^record:/, ''), 10);
                  if (!Number.isNaN(idx)) setSelected(records[idx] ?? null);
                } else {
                  setSelected(null);
                }
              }}
              showAllEdges={showAllMapEdges}
            />
          </React.Suspense>
        </div>
      )}

      {viewMode === 'grid' && (
      <motion.section
        className="pursue__grid"
        layout
        aria-label="Record cards"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {filtered.map((item) => (
          <RecordCard
            key={item.record.title + item.index}
            item={item}
            layoutId={`card-${item.index}`}
            onOpen={() => {
              setMapSelectionId(null);
              setSelected(item);
            }}
          />
        ))}
      </motion.section>
      )}
      </main>

      <footer className="pursue__foot">
        <p>
          Source: U.S. Department of War PURSUE portal{' '}
          <a href="https://www.war.gov/UFO/" target="_blank" rel="noreferrer">
            war.gov/UFO
          </a>
          . Visualizations use Three.js and Framer Motion; document bodies stream from the mirror URLs.
        </p>
      </footer>

      <Inspector
        item={selected}
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setMapSelectionId(null);
        }}
      />
    </div>
  );
}

import * as THREE from 'three';
import type { GraphEdge, GraphNode, GraphNodeKind } from './buildKnowledgeGraph';

function hash01(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Deterministic 3D layout: hubs on rings; each record is a weighted blend of its hub positions plus jitter. */
export function layoutKnowledgeGraphPositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, THREE.Vector3> {
  const pos = new Map<string, THREE.Vector3>();
  const nodeById = new Map<string, GraphNode>();
  for (const n of nodes) nodeById.set(n.id, n);

  const agencies = nodes.filter((n) => n.kind === 'agency').sort((a, b) => a.label.localeCompare(b.label));
  const years = nodes.filter((n) => n.kind === 'year').sort((a, b) => {
    if (a.label === 'Unknown') return 1;
    if (b.label === 'Unknown') return -1;
    const na = parseInt(a.label, 10);
    const nb = parseInt(b.label, 10);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.label.localeCompare(b.label);
  });
  const locations = nodes.filter((n) => n.kind === 'location').sort((a, b) => a.label.localeCompare(b.label));
  const medias = nodes.filter((n) => n.kind === 'media').sort((a, b) => a.label.localeCompare(b.label));

  /** Hub rings lifted into open air (no ground plane); vertical separation reads as “floating”. */
  const Y_AGENCY = 9.2;
  const Y_YEAR = 6.4;
  const Y_LOCATION = 3.8;
  const Y_MEDIA = 7.8;

  const Ra = 13;
  agencies.forEach((n, i) => {
    const t = (i / Math.max(agencies.length, 1)) * Math.PI * 2;
    pos.set(n.id, new THREE.Vector3(Ra * Math.cos(t), Y_AGENCY, Ra * Math.sin(t)));
  });

  const Ry = 10.5;
  years.forEach((n, i) => {
    const t = (i / Math.max(years.length, 1)) * Math.PI * 2 + 0.15;
    pos.set(n.id, new THREE.Vector3(Ry * Math.cos(t), Y_YEAR, Ry * Math.sin(t)));
  });

  const Rl = 15;
  locations.forEach((n, i) => {
    const t = (i / Math.max(locations.length, 1)) * Math.PI * 2 + 0.7;
    pos.set(n.id, new THREE.Vector3(Rl * Math.cos(t), Y_LOCATION, Rl * Math.sin(t)));
  });

  const Rm = 3.8;
  medias.forEach((n, i) => {
    const t = (i / Math.max(medias.length, 1)) * Math.PI * 2 + 1.2;
    pos.set(n.id, new THREE.Vector3(Rm * Math.cos(t), Y_MEDIA, Rm * Math.sin(t)));
  });

  const origin = new THREE.Vector3(0, 0, 0);

  const outFromRecord = new Map<string, Partial<Record<GraphNodeKind, string>>>();
  for (const e of edges) {
    const from = nodeById.get(e.from);
    const to = nodeById.get(e.to);
    if (!from || !to) continue;
    if (from.kind !== 'record') continue;
    if (to.kind === 'record') continue;
    const hubKind = to.kind;
    const row = outFromRecord.get(e.from) ?? {};
    row[hubKind] = e.to;
    outFromRecord.set(e.from, row);
  }

  const recordNodes = nodes.filter((n) => n.kind === 'record');
  for (const n of recordNodes) {
    const row = outFromRecord.get(n.id) ?? {};
    const pa = row.agency ? pos.get(row.agency) : origin;
    const py = row.year ? pos.get(row.year) : origin;
    const pl = row.location ? pos.get(row.location) : origin;
    const pm = row.media ? pos.get(row.media) : origin;

    const idx = n.recordIndex ?? 0;
    const jx = (hash01(idx, 1) - 0.5) * 4.8;
    const jy = (hash01(idx, 2) - 0.5) * 5.5;
    const jz = (hash01(idx, 3) - 0.5) * 4.8;

    const blend = new THREE.Vector3(0, 0, 0);
    if (pa) blend.add(pa.clone().multiplyScalar(0.34));
    if (py) blend.add(py.clone().multiplyScalar(0.26));
    if (pl) blend.add(pl.clone().multiplyScalar(0.26));
    if (pm) blend.add(pm.clone().multiplyScalar(0.14));
    if (blend.lengthSq() < 1e-6) blend.set(jx, jy, jz);
    else blend.add(new THREE.Vector3(jx * 0.35, jy * 0.35, jz * 0.35));

    pos.set(n.id, blend);
  }

  return pos;
}

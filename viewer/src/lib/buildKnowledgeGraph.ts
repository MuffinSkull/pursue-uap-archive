import type { ResolvedRecord } from './resolveRecord';
import type { ReleaseType } from '../types';
import { locationSlug, parseIncidentYear, yearBucket } from './parseIncidentMeta';

export type GraphNodeKind = 'record' | 'agency' | 'year' | 'media' | 'location';

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  recordIndex?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** record index -> node id */
  recordIdByIndex: Map<number, string>;
  nodeById: Map<string, GraphNode>;
}

function nid(kind: GraphNodeKind, key: string): string {
  return `${kind}:${key}`;
}

export function buildKnowledgeGraph(records: ResolvedRecord[]): KnowledgeGraph {
  const nodeById = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const recordIdByIndex = new Map<number, string>();

  const ensure = (n: GraphNode) => {
    if (!nodeById.has(n.id)) nodeById.set(n.id, n);
  };

  for (const item of records) {
    const rec = item.record;
    const idx = item.index;
    const rid = nid('record', String(idx));
    recordIdByIndex.set(idx, rid);

    ensure({
      id: rid,
      kind: 'record',
      label: rec.title.length > 80 ? `${rec.title.slice(0, 77)}…` : rec.title,
      recordIndex: idx,
    });

    const agencyKey = rec.agency.trim() || 'Unknown';
    const aid = nid('agency', agencyKey);
    ensure({ id: aid, kind: 'agency', label: agencyKey });

    const y = parseIncidentYear(rec.incident_date);
    const yLabel = yearBucket(y);
    const yid = nid('year', yLabel);
    ensure({ id: yid, kind: 'year', label: yLabel });

    const type = rec.type as ReleaseType;
    const mid = nid('media', type);
    ensure({ id: mid, kind: 'media', label: type });

    const loc = locationSlug(rec.incident_location);
    const lid = nid('location', loc.slug);
    ensure({ id: lid, kind: 'location', label: loc.display });

    const link = (to: string) => edges.push({ from: rid, to });

    link(aid);
    link(yid);
    link(mid);
    link(lid);
  }

  const nodes = [...nodeById.values()];
  return { nodes, edges, recordIdByIndex, nodeById };
}

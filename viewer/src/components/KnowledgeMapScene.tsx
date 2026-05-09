import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { GraphEdge, GraphNode, GraphNodeKind, KnowledgeGraph } from '../lib/buildKnowledgeGraph';
import type { ResolvedRecord } from '../lib/resolveRecord';

/**
 * Map semantics (3D knowledge graph — deep-space view)
 * ────────────────────────────────────────────────────
 * • Record nodes — small flying discs (PDF / VID / IMG silhouettes); agency adds a faint tint on the hull.
 * • Hub nodes — larger UFO hulls by dimension: lenticular saucer (agency), tower dome (year), wide plate (location), ring craft (media).
 * • Edges — neon-like links in space; vertex color = agency / year / location / media.
 *
 * Implementation follows patterns from the installed Cursor skills (`.cursor/skills/threejs-*`),
 * sourced from [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills/tree/main/skills):
 * fundamentals (renderer color space / tone mapping), geometry (lathe / torus / instancing),
 * materials (PBR + clearcoat hulls), lighting (three-point + rim), postprocessing (bloom stack),
 * interaction (raycaster tuning), animation (clock-driven motion).
 */

/** Archive record hull tint — light neutrals so discs read on starfield + fog. */
function recordSphereBaseColor(agency: string): THREE.Color {
  const c = new THREE.Color();
  switch (agency) {
    case 'FBI':
      c.setHex(0xf1f9ff);
      break;
    case 'NASA':
      c.setHex(0xfaf5ff);
      break;
    case 'Department of War':
      c.setHex(0xf0fdf4);
      break;
    case 'Department of State':
      c.setHex(0xfff7f7);
      break;
    default:
      c.setHex(0xffffff);
  }
  return c;
}

/** Non-uniform squash on a unit sphere → thin flying saucer in the XZ plane (Y = hull thickness). */
function recordDiscAspect(recordType: string): { x: number; y: number; z: number } {
  switch (recordType) {
    case 'PDF':
      return { x: 1, y: 0.1, z: 1 };
    case 'VID':
      return { x: 1.06, y: 0.24, z: 1.06 };
    case 'IMG':
      return { x: 1.22, y: 0.072, z: 1.22 };
    default:
      return { x: 1, y: 0.13, z: 1 };
  }
}

/** Lathe profile around Y — classic belly / dome silhouettes for hub craft. */
function createHubLathe(profile: 'lenticular' | 'wide' | 'tower'): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const segments = 42;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let y: number;
    let r: number;
    if (profile === 'lenticular') {
      y = -0.17 + t * 0.34;
      r = 0.52 * Math.sin(Math.PI * t);
    } else if (profile === 'wide') {
      y = -0.095 + t * 0.19;
      r = 0.56 * Math.pow(Math.sin(Math.PI * t), 0.85);
    } else {
      y = -0.24 + t * 0.5;
      r = 0.36 * Math.pow(Math.sin(Math.PI * t), 0.58);
    }
    pts.push(new THREE.Vector2(THREE.MathUtils.clamp(r, 0.04, 0.92), y));
  }
  return new THREE.LatheGeometry(pts, 46);
}

const HUB_GEO_AGENCY = createHubLathe('lenticular');
const HUB_GEO_YEAR = createHubLathe('tower');
const HUB_GEO_LOCATION = createHubLathe('wide');
const HUB_GEO_MEDIA = new THREE.TorusGeometry(0.46, 0.084, 14, 52);

function hubUfoGeometry(kind: GraphNodeKind): THREE.BufferGeometry {
  switch (kind) {
    case 'agency':
      return HUB_GEO_AGENCY;
    case 'year':
      return HUB_GEO_YEAR;
    case 'location':
      return HUB_GEO_LOCATION;
    case 'media':
      return HUB_GEO_MEDIA;
    case 'record':
    default:
      return HUB_GEO_AGENCY;
  }
}

function hubHex(kind: GraphNode['kind']): string {
  switch (kind) {
    case 'agency':
      return '#0891b2';
    case 'year':
      return '#ea580c';
    case 'location':
      return '#16a34a';
    case 'media':
      return '#9333ea';
    default:
      return '#64748b';
  }
}

/** Hub hull color — media hubs use label so the PDF cluster reads as bright paper. */
function hubSurfaceHex(node: GraphNode): string {
  if (node.kind === 'media') {
    const key = node.label.trim().toUpperCase();
    if (key === 'PDF') return '#fefce8';
    if (key === 'VID') return '#0ea5e9';
    if (key === 'IMG') return '#fb923c';
  }
  return hubHex(node.kind);
}

function hubEdgeColor(kind: GraphNodeKind): THREE.Color {
  const c = new THREE.Color();
  switch (kind) {
    case 'agency':
      c.setStyle('#22d3ee');
      break;
    case 'year':
      c.setStyle('#fb923c');
      break;
    case 'location':
      c.setStyle('#4ade80');
      break;
    case 'media':
      c.setStyle('#c084fc');
      break;
    default:
      c.setStyle('#94a3b8');
  }
  return c;
}

function phaseFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return ((h & 0xffff) / 0xffff) * Math.PI * 2;
}

function edgeVisible(e: GraphEdge, selectedId: string | null, showAll: boolean): boolean {
  if (showAll) return true;
  if (!selectedId) return false;
  return e.from === selectedId || e.to === selectedId;
}

function edgeRelationKind(e: GraphEdge, nodeById: Map<string, GraphNode>): GraphNodeKind | null {
  const a = nodeById.get(e.from);
  const b = nodeById.get(e.to);
  if (a?.kind === 'record' && b && b.kind !== 'record') return b.kind;
  if (b?.kind === 'record' && a && a.kind !== 'record') return a.kind;
  return null;
}

function buildHubToRecords(edges: GraphEdge[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  const add = (hub: string, rec: string) => {
    let s = m.get(hub);
    if (!s) {
      s = new Set();
      m.set(hub, s);
    }
    s.add(rec);
  };
  for (const e of edges) {
    if (e.from.startsWith('record:') && !e.to.startsWith('record:')) add(e.to, e.from);
    else if (e.to.startsWith('record:') && !e.from.startsWith('record:')) add(e.from, e.to);
  }
  return m;
}

const SPRING = 3.8;
const DAMPING = 0.93;
const MAX_DELTA = 1 / 30;
const CHILD_FOLLOW = 0.82;
const WANDER = 2.35;

function clampDelta(dt: number): number {
  return Math.min(dt, MAX_DELTA);
}

export type SimBuffers = {
  anchor: Map<string, THREE.Vector3>;
  current: Map<string, THREE.Vector3>;
  velocity: Map<string, THREE.Vector3>;
};

function clonePositionMap(src: Map<string, THREE.Vector3>): Map<string, THREE.Vector3> {
  const m = new Map<string, THREE.Vector3>();
  src.forEach((v, k) => m.set(k, v.clone()));
  return m;
}

type DragState = {
  active: boolean;
  id: string | null;
  button: number;
  plane: THREE.Plane;
  planeInit: boolean;
};

function PhysicsEngine({
  graph,
  layoutPositions,
  hubToRecords,
  selectedId,
  showAllEdges,
  activeEdgeIdsRef,
  controlsRef,
  livePositionsRef,
  dragStateRef,
  raycasterRef,
  pointerNdcRef,
}: {
  graph: KnowledgeGraph;
  layoutPositions: Map<string, THREE.Vector3>;
  hubToRecords: Map<string, Set<string>>;
  selectedId: string | null;
  showAllEdges: boolean;
  activeEdgeIdsRef: React.MutableRefObject<Set<string>>;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  livePositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  dragStateRef: React.MutableRefObject<DragState>;
  raycasterRef: React.MutableRefObject<THREE.Raycaster>;
  pointerNdcRef: React.MutableRefObject<THREE.Vector2>;
}) {
  const simRef = React.useRef<SimBuffers | null>(null);
  const tmp = React.useMemo(
    () => ({
      target: new THREE.Vector3(),
      pull: new THREE.Vector3(),
      hit: new THREE.Vector3(),
      v: new THREE.Vector3(),
    }),
    [],
  );

  React.useLayoutEffect(() => {
    const anchor = clonePositionMap(layoutPositions);
    const current = clonePositionMap(layoutPositions);
    const velocity = new Map<string, THREE.Vector3>();
    anchor.forEach((_v, k) => velocity.set(k, new THREE.Vector3()));
    simRef.current = { anchor, current, velocity };
  }, [layoutPositions]);

  const { camera, gl } = useThree();

  useFrame((state, delta) => {
    const sim = simRef.current;
    if (!sim) return;
    const dt = clampDelta(delta);
    const ds = dragStateRef.current;
    const raycaster = raycasterRef.current;
    const pointer = pointerNdcRef.current;

    raycaster.setFromCamera(pointer, camera);

    const draggingId = ds.active && ds.id ? ds.id : null;

    if (draggingId && ds.planeInit) {
      const ok = raycaster.ray.intersectPlane(ds.plane, tmp.hit);
      if (ok) {
        const cur = sim.current.get(draggingId);
        const vel = sim.velocity.get(draggingId);
        if (cur && vel) {
          cur.copy(tmp.hit);
          vel.multiplyScalar(0.25);
        }
      }
    }

    graph.nodes.forEach((node) => {
      const id = node.id;
      if (draggingId === id) return;

      const cur = sim.current.get(id);
      const vel = sim.velocity.get(id);
      const anc = sim.anchor.get(id);
      if (!cur || !vel || !anc) return;

      tmp.target.copy(anc);

      if (
        ds.button === 2 &&
        ds.active &&
        ds.id &&
        !ds.id.startsWith('record:') &&
        id.startsWith('record:') &&
        hubToRecords.get(ds.id)?.has(id)
      ) {
        const hubCur = sim.current.get(ds.id);
        const hubAnc = sim.anchor.get(ds.id);
        if (hubCur && hubAnc) {
          tmp.pull.copy(hubCur).sub(hubAnc).multiplyScalar(CHILD_FOLLOW);
          tmp.target.copy(anc).add(tmp.pull);
        }
      }

      tmp.v.copy(tmp.target).sub(cur).multiplyScalar(SPRING);
      tmp.v.addScaledVector(vel, -1.2);
      vel.addScaledVector(tmp.v, dt);
      vel.multiplyScalar(Math.pow(DAMPING, dt * 60));
      cur.addScaledVector(vel, dt);
    });

    const live = livePositionsRef.current;
    const t = state.clock.elapsedTime;

    graph.nodes.forEach((node) => {
      const id = node.id;
      const base = sim.current.get(id);
      if (!base) return;

      let p = live.get(id);
      if (!p) {
        p = new THREE.Vector3();
        live.set(id, p);
      }

      if (draggingId === id) {
        p.copy(base);
        return;
      }

      const ph = phaseFromId(id);
      const fx = Math.sin(t * 0.52 + ph) * 0.45 * WANDER;
      const fy = Math.sin(t * 0.71 + ph * 1.6) * 0.68 * WANDER;
      const fz = Math.cos(t * 0.44 + ph * 0.85) * 0.45 * WANDER;
      p.set(base.x + fx, base.y + fy, base.z + fz);
    });

    if (draggingId && controlsRef.current) controlsRef.current.enabled = false;
    else if (controlsRef.current) controlsRef.current.enabled = true;

    const edgeActive = activeEdgeIdsRef.current;
    edgeActive.clear();
    for (const e of graph.edges) {
      if (!edgeVisible(e, selectedId, showAllEdges)) continue;
      if (edgeRelationKind(e, graph.nodeById) == null) continue;
      if (draggingId && (e.from === draggingId || e.to === draggingId)) {
        edgeActive.add(`${e.from}|${e.to}`);
      }
    }
    if (draggingId && !draggingId.startsWith('record:')) {
      const kids = hubToRecords.get(draggingId);
      if (kids) {
        for (const rid of kids) {
          edgeActive.add(`${rid}|${draggingId}`);
          edgeActive.add(`${draggingId}|${rid}`);
        }
      }
    }
  }, -1);

  React.useEffect(() => {
    const el = gl.domElement;
    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointerNdcRef.current.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    };
    const onUp = () => {
      dragStateRef.current.active = false;
      dragStateRef.current.id = null;
      dragStateRef.current.planeInit = false;
    };
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, pointerNdcRef, dragStateRef]);

  return null;
}

function HubMeshes({
  hubNodes,
  livePositionsRef,
  pointerNdcRef,
  selectedId,
  onSelectNodeId,
  dragStateRef,
}: {
  hubNodes: GraphNode[];
  livePositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  pointerNdcRef: React.MutableRefObject<THREE.Vector2>;
  selectedId: string | null;
  onSelectNodeId: (id: string | null) => void;
  dragStateRef: React.MutableRefObject<DragState>;
}) {
  const { camera, gl } = useThree();
  const groupRefs = React.useRef<Map<string, THREE.Group>>(new Map());
  const meshRefs = React.useRef<Map<string, THREE.Mesh>>(new Map());
  const tmp = React.useMemo(() => ({ normal: new THREE.Vector3(), pos: new THREE.Vector3() }), []);

  const syncPointer = (clientX: number, clientY: number) => {
    const r = gl.domElement.getBoundingClientRect();
    pointerNdcRef.current.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  };

  const beginDrag = (nodeId: string, button: number, worldPos: THREE.Vector3) => {
    dragStateRef.current.active = true;
    dragStateRef.current.id = nodeId;
    dragStateRef.current.button = button;
    tmp.normal.copy(camera.position).sub(worldPos).normalize();
    dragStateRef.current.plane.setFromNormalAndCoplanarPoint(tmp.normal, worldPos);
    dragStateRef.current.planeInit = true;
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const live = livePositionsRef.current;
    for (const node of hubNodes) {
      const g = groupRefs.current.get(node.id);
      const p = live.get(node.id);
      if (g && p) {
        g.position.copy(p);
        const ph = phaseFromId(node.id);
        g.rotation.x = Math.sin(t * 0.42 + ph * 0.37) * 0.48;
        g.rotation.y = t * 0.68 + ph * 0.41;
        g.rotation.z = Math.cos(t * 0.39 + ph * 0.52) * 0.42;
      }
      const mesh = meshRefs.current.get(node.id);
      const mat = mesh?.material as THREE.MeshPhysicalMaterial | undefined;
      if (mat) {
        const base = new THREE.Color(hubSurfaceHex(node));
        const hsl = { h: 0, s: 0, l: 0 };
        base.getHSL(hsl);
        const isPdfHub = node.kind === 'media' && node.label.trim().toUpperCase() === 'PDF';
        if (isPdfHub) {
          hsl.l = THREE.MathUtils.clamp(0.96 + Math.sin(t * 0.28 + phaseFromId(node.id)) * 0.03, 0.92, 1);
          hsl.s = THREE.MathUtils.clamp(hsl.s * 0.45 + 0.04, 0.04, 0.14);
        } else {
          hsl.h = (hsl.h + Math.sin(t * 0.28 + phaseFromId(node.id)) * 0.07 + 1) % 1;
          hsl.s = Math.min(1, hsl.s + 0.08);
        }
        mat.color.setHSL(hsl.h, hsl.s, hsl.l);
        mat.emissive.copy(mat.color);
        mat.emissiveIntensity =
          selectedId === node.id ? (isPdfHub ? 1.15 : 1.05) : isPdfHub ? 0.72 : 0.55;
      }
    }
  });

  return (
    <>
      {hubNodes.map((node) => {
        const sel = selectedId === node.id;
        return (
          <group
            key={node.id}
            ref={(r) => {
              if (r) groupRefs.current.set(node.id, r);
              else groupRefs.current.delete(node.id);
            }}
          >
            <mesh
              geometry={hubUfoGeometry(node.kind)}
              ref={(r) => {
                if (r) meshRefs.current.set(node.id, r);
                else meshRefs.current.delete(node.id);
              }}
              scale={sel ? 1.48 : 1}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (e.button === 1) return;
                syncPointer(e.clientX, e.clientY);
                onSelectNodeId(node.id);
                const w = livePositionsRef.current.get(node.id);
                if (!w) return;
                tmp.pos.copy(w);
                beginDrag(node.id, e.button, tmp.pos);
                (e.target as Element).setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                try {
                  (e.target as Element).releasePointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                dragStateRef.current.active = false;
                dragStateRef.current.id = null;
                dragStateRef.current.planeInit = false;
              }}
            >
              <meshPhysicalMaterial
                color={hubSurfaceHex(node)}
                emissive={hubSurfaceHex(node)}
                emissiveIntensity={node.kind === 'media' && node.label.trim().toUpperCase() === 'PDF' ? 0.75 : 0.55}
                metalness={0.5}
                roughness={0.26}
                clearcoat={0.48}
                clearcoatRoughness={0.32}
                ior={1.45}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function RecordInstances({
  recordNodes,
  livePositionsRef,
  pointerNdcRef,
  records,
  selectedId,
  edges,
  onPickRecord,
  dragStateRef,
}: {
  recordNodes: GraphNode[];
  livePositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  pointerNdcRef: React.MutableRefObject<THREE.Vector2>;
  records: ResolvedRecord[];
  selectedId: string | null;
  edges: GraphEdge[];
  onPickRecord: (nodeId: string) => void;
  dragStateRef: React.MutableRefObject<DragState>;
}) {
  const geo = React.useMemo(() => new THREE.SphereGeometry(1, 22, 22), []);
  const mat = React.useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        metalness: 0.1,
        roughness: 0.42,
        emissive: '#e8eef5',
        emissiveIntensity: 0.38,
      }),
    [],
  );
  const count = recordNodes.length;
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const { camera, gl } = useThree();
  const tmp = React.useMemo(() => ({ normal: new THREE.Vector3(), pos: new THREE.Vector3() }), []);

  const syncPointer = (clientX: number, clientY: number) => {
    const r = gl.domElement.getBoundingClientRect();
    pointerNdcRef.current.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  };

  const linkedSet = React.useMemo(() => {
    if (!selectedId || selectedId.startsWith('record:')) return null;
    const s = new Set<string>();
    for (const e of edges) {
      if (e.from === selectedId && e.to.startsWith('record:')) s.add(e.to);
      if (e.to === selectedId && e.from.startsWith('record:')) s.add(e.from);
    }
    return s.size ? s : null;
  }, [edges, selectedId]);

  const beginDrag = (nodeId: string, button: number, worldPos: THREE.Vector3) => {
    dragStateRef.current.active = true;
    dragStateRef.current.id = nodeId;
    dragStateRef.current.button = button;
    tmp.normal.copy(camera.position).sub(worldPos).normalize();
    dragStateRef.current.plane.setFromNormalAndCoplanarPoint(tmp.normal, worldPos);
    dragStateRef.current.planeInit = true;
  };

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    const fill = new THREE.Color(0xffffff);
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, fill);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const live = livePositionsRef.current;

    recordNodes.forEach((node, i) => {
      const rec = records[node.recordIndex ?? 0];
      const idx = node.recordIndex ?? 0;
      const basePos = live.get(node.id);
      if (!basePos) return;

      const sel = selectedId === node.id;
      let scale = sel ? 0.3 : 0.21;
      const baseCol =
        rec.record.type === 'PDF'
          ? new THREE.Color(0xffffff)
          : recordSphereBaseColor(rec?.record.agency ?? '');
      const hsl = { h: 0, s: 0, l: 0 };
      baseCol.getHSL(hsl);
      hsl.l = THREE.MathUtils.clamp(0.94 + Math.sin(t * 0.33 + idx * 0.07) * 0.04, 0.88, 1);
      hsl.s =
        rec.record.type === 'PDF'
          ? THREE.MathUtils.clamp(hsl.s * 0.25 + 0.02, 0.02, 0.08)
          : THREE.MathUtils.clamp(hsl.s * 0.35 + 0.04, 0.02, 0.12);
      baseCol.setHSL(hsl.h, hsl.s, hsl.l);

      if (selectedId && !selectedId.startsWith('record:')) {
        const linked = linkedSet?.has(node.id);
        if (linked) {
          scale = 0.26;
          baseCol.offsetHSL(0, 0.02, 0.02);
        } else {
          scale = 0.14;
          baseCol.lerp(new THREE.Color(0xe2e8f0), 0.38);
          const dimHsl = { h: 0, s: 0, l: 0 };
          baseCol.getHSL(dimHsl);
          dimHsl.l = Math.max(dimHsl.l, 0.72);
          baseCol.setHSL(dimHsl.h, dimHsl.s, dimHsl.l);
        }
      }

      const asp = recordDiscAspect(rec.record.type);
      dummy.position.copy(basePos);
      dummy.scale.set(scale * asp.x, scale * asp.y, scale * asp.z);
      const fly = t * (0.62 + (idx % 7) * 0.028) + idx * 0.19;
      dummy.rotation.y = fly;
      dummy.rotation.x = Math.sin(t * 0.41 + idx * 0.37) * 0.32;
      dummy.rotation.z = Math.cos(t * 0.36 + idx * 0.29) * 0.26;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, baseCol);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, count]}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.button === 1) return;
        syncPointer(e.clientX, e.clientY);
        const id = e.instanceId;
        if (id === undefined || id < 0) return;
        const node = recordNodes[id];
        if (node?.recordIndex === undefined) return;
        onPickRecord(node.id);
        const w = livePositionsRef.current.get(node.id);
        if (!w) return;
        tmp.pos.copy(w);
        beginDrag(node.id, e.button, tmp.pos);
        (e.target as Element).setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        dragStateRef.current.active = false;
        dragStateRef.current.id = null;
        dragStateRef.current.planeInit = false;
      }}
    />
  );
}

function LiveEdgeSegments({
  visibleEdges,
  livePositionsRef,
  activeEdgeIdsRef,
}: {
  visibleEdges: { from: string; to: string; kind: GraphNodeKind }[];
  livePositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  activeEdgeIdsRef: React.MutableRefObject<Set<string>>;
}) {
  const geomRef = React.useMemo(() => new THREE.BufferGeometry(), []);
  const scratch = React.useMemo(() => new THREE.Color(), []);

  React.useLayoutEffect(() => {
    const n = visibleEdges.length;
    const posArr = new Float32Array(Math.max(1, n) * 6);
    const colArr = new Float32Array(Math.max(1, n) * 6);
    geomRef.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geomRef.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    for (let i = 0; i < n; i++) {
      scratch.copy(hubEdgeColor(visibleEdges[i].kind));
      const o = i * 6;
      colArr[o] = scratch.r;
      colArr[o + 1] = scratch.g;
      colArr[o + 2] = scratch.b;
      colArr[o + 3] = scratch.r;
      colArr[o + 4] = scratch.g;
      colArr[o + 5] = scratch.b;
    }
    geomRef.setDrawRange(0, n > 0 ? n * 2 : 0);
  }, [visibleEdges, geomRef, scratch]);

  useFrame(() => {
    if (visibleEdges.length === 0) return;
    const geom = geomRef;
    const live = livePositionsRef.current;
    const attr = geom.getAttribute('position') as THREE.BufferAttribute;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const active = activeEdgeIdsRef.current;
    let ai = 0;
    for (let i = 0; i < visibleEdges.length; i++) {
      const e = visibleEdges[i];
      const pa = live.get(e.from);
      const pb = live.get(e.to);
      if (!pa || !pb) continue;
      const key = `${e.from}|${e.to}`;
      const boost = active.has(key) ? 1.15 : 1;
      scratch.copy(hubEdgeColor(e.kind));
      scratch.multiplyScalar(boost);
      scratch.r = THREE.MathUtils.clamp(scratch.r, 0, 1);
      scratch.g = THREE.MathUtils.clamp(scratch.g, 0, 1);
      scratch.b = THREE.MathUtils.clamp(scratch.b, 0, 1);
      const o = ai * 6;
      arr[o] = pa.x;
      arr[o + 1] = pa.y;
      arr[o + 2] = pa.z;
      arr[o + 3] = pb.x;
      arr[o + 4] = pb.y;
      arr[o + 5] = pb.z;
      const co = ai * 6;
      const col = geom.getAttribute('color') as THREE.BufferAttribute;
      const carr = col.array as Float32Array;
      carr[co] = scratch.r;
      carr[co + 1] = scratch.g;
      carr[co + 2] = scratch.b;
      carr[co + 3] = scratch.r;
      carr[co + 4] = scratch.g;
      carr[co + 5] = scratch.b;
      ai++;
    }
    attr.needsUpdate = true;
    const cAttr = geom.getAttribute('color');
    if (cAttr) cAttr.needsUpdate = true;
    geom.setDrawRange(0, ai * 2);
  });

  if (visibleEdges.length === 0) return null;

  return (
    <lineSegments geometry={geomRef}>
      <lineBasicMaterial vertexColors transparent opacity={0.98} depthWrite={false} />
    </lineSegments>
  );
}

/** Background, fog, starfield, and layered lights (three-point + rim + accent). */
function SpaceEnvironment() {
  return (
    <>
      <color attach="background" args={['#010412']} />
      <fog attach="fog" args={['#030818', 28, 165]} />
      <Stars radius={340} depth={82} count={10000} factor={6.2} saturation={0} fade speed={0.4} />
      <ambientLight intensity={0.17} color="#64748b" />
      <hemisphereLight args={['#1e3a8a', '#020617', 0.42]} />
      <directionalLight position={[26, 40, 22]} intensity={0.76} color="#dbeafe" />
      <directionalLight position={[-28, 18, -36]} intensity={0.34} color="#c4b5fd" />
      <directionalLight position={[20, 14, -16]} intensity={0.26} color="#67e8f9" />
      <spotLight
        position={[0, 16, -50]}
        intensity={0.58}
        color="#a5f3fc"
        angle={0.72}
        penumbra={0.65}
        decay={2}
        distance={240}
      />
      <pointLight position={[0, 48, 28]} intensity={0.7} color="#38bdf8" distance={145} decay={2} />
    </>
  );
}

function SceneContent({
  graph,
  positions,
  records,
  selectedId,
  onSelectNodeId,
  showAllEdges,
}: {
  graph: KnowledgeGraph;
  positions: Map<string, THREE.Vector3>;
  records: ResolvedRecord[];
  selectedId: string | null;
  onSelectNodeId: (id: string | null) => void;
  showAllEdges: boolean;
}) {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const livePositionsRef = React.useRef<Map<string, THREE.Vector3>>(new Map());
  const dragStateRef = React.useRef<DragState>({
    active: false,
    id: null,
    button: 0,
    plane: new THREE.Plane(),
    planeInit: false,
  });
  const raycasterRef = React.useRef(new THREE.Raycaster());
  const pointerNdcRef = React.useRef(new THREE.Vector2());
  const activeEdgeIdsRef = React.useRef<Set<string>>(new Set());

  React.useLayoutEffect(() => {
    raycasterRef.current.params.Line.threshold = 0.1;
  }, []);

  const recordNodes = React.useMemo(
    () =>
      graph.nodes
        .filter((n) => n.kind === 'record')
        .sort((a, b) => (a.recordIndex ?? 0) - (b.recordIndex ?? 0)),
    [graph.nodes],
  );

  const hubNodes = React.useMemo(() => graph.nodes.filter((n) => n.kind !== 'record'), [graph.nodes]);

  const hubToRecords = React.useMemo(() => buildHubToRecords(graph.edges), [graph.edges]);

  const visibleEdges = React.useMemo(() => {
    const out: { from: string; to: string; kind: GraphNodeKind }[] = [];
    for (const e of graph.edges) {
      if (!edgeVisible(e, selectedId, showAllEdges)) continue;
      const kind = edgeRelationKind(e, graph.nodeById);
      if (!kind) continue;
      out.push({ from: e.from, to: e.to, kind });
    }
    return out;
  }, [graph.edges, graph.nodeById, selectedId, showAllEdges]);

  return (
    <>
      <SpaceEnvironment />

      <PhysicsEngine
        graph={graph}
        layoutPositions={positions}
        hubToRecords={hubToRecords}
        selectedId={selectedId}
        showAllEdges={showAllEdges}
        activeEdgeIdsRef={activeEdgeIdsRef}
        controlsRef={controlsRef}
        livePositionsRef={livePositionsRef}
        dragStateRef={dragStateRef}
        raycasterRef={raycasterRef}
        pointerNdcRef={pointerNdcRef}
      />

      <HubMeshes
        hubNodes={hubNodes}
        livePositionsRef={livePositionsRef}
        pointerNdcRef={pointerNdcRef}
        selectedId={selectedId}
        onSelectNodeId={onSelectNodeId}
        dragStateRef={dragStateRef}
      />

      <RecordInstances
        recordNodes={recordNodes}
        livePositionsRef={livePositionsRef}
        pointerNdcRef={pointerNdcRef}
        records={records}
        selectedId={selectedId}
        edges={graph.edges}
        onPickRecord={(nodeId) => onSelectNodeId(nodeId)}
        dragStateRef={dragStateRef}
      />

      <LiveEdgeSegments
        visibleEdges={visibleEdges}
        livePositionsRef={livePositionsRef}
        activeEdgeIdsRef={activeEdgeIdsRef}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={10}
        maxDistance={95}
        maxPolarAngle={Math.PI * 0.92}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.16} mipmapBlur intensity={0.92} radius={0.48} />
        <ChromaticAberration offset={[0.00045, 0.00065]} />
        <Vignette eskil={false} offset={0.32} darkness={0.62} />
      </EffectComposer>
    </>
  );
}

export type KnowledgeMapCanvasProps = {
  graph: KnowledgeGraph;
  positions: Map<string, THREE.Vector3>;
  records: ResolvedRecord[];
  selectedId: string | null;
  onSelectNodeId: (id: string | null) => void;
  showAllEdges: boolean;
};

export function KnowledgeMapCanvas({
  graph,
  positions,
  records,
  selectedId,
  onSelectNodeId,
  showAllEdges,
}: KnowledgeMapCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 11, 34], fov: 48, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerMissed={() => onSelectNodeId(null)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <SceneContent
        graph={graph}
        positions={positions}
        records={records}
        selectedId={selectedId}
        onSelectNodeId={onSelectNodeId}
        showAllEdges={showAllEdges}
      />
    </Canvas>
  );
}

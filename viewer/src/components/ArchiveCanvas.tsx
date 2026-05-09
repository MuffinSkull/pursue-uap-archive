import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Icosahedron,
  MeshDistortMaterial,
  OrbitControls,
  PerspectiveCamera,
  Sparkles,
  Stars,
  TorusKnot,
} from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useRef, type RefObject } from 'react';
import type { Group, Mesh } from 'three';

/** Alien lattice — outer torus + inner distorted core + secondary shard */
function XenotechLattice({ groupRef }: { groupRef: RefObject<Group | null> }) {
  const knotRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const shardRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = groupRef.current;
    if (g) {
      g.rotation.y = t * 0.06;
      g.rotation.x = Math.sin(t * 0.11) * 0.08;
    }
    const k = knotRef.current;
    if (k) {
      k.rotation.x = t * 0.09;
      k.rotation.z = t * 0.05;
    }
    const c = coreRef.current;
    if (c) {
      c.rotation.y = -t * 0.14;
      c.rotation.x = t * 0.07;
    }
    const s = shardRef.current;
    if (s) {
      s.rotation.z = t * 0.18;
      s.rotation.y = t * 0.09;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2.4} rotationIntensity={0.45} floatIntensity={0.65}>
        <TorusKnot ref={knotRef} args={[1.05, 0.14, 96, 16]}>
          <meshStandardMaterial
            color="#0e7490"
            emissive="#06b6d4"
            emissiveIntensity={1.15}
            metalness={0.92}
            roughness={0.18}
            wireframe
          />
        </TorusKnot>
      </Float>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.62, 2]} />
        <MeshDistortMaterial
          color="#312e81"
          emissive="#a78bfa"
          emissiveIntensity={0.85}
          metalness={0.85}
          roughness={0.25}
          distort={0.42}
          speed={3.2}
          radius={1}
        />
      </mesh>

      <mesh ref={shardRef} position={[1.35, 0.55, -0.4]} scale={0.42}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#064e3b"
          emissive="#4ade80"
          emissiveIntensity={0.95}
          metalness={0.75}
          roughness={0.28}
          wireframe
        />
      </mesh>

      <mesh position={[-1.2, -0.35, 0.7]} scale={0.28}>
        <Icosahedron args={[1, 0]}>
          <meshStandardMaterial
            color="#581c87"
            emissive="#e879f9"
            emissiveIntensity={1.1}
            metalness={0.8}
            roughness={0.22}
          />
        </Icosahedron>
      </mesh>
    </group>
  );
}

function Scene() {
  const rootRef = useRef<Group>(null);

  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 14, 52]} />

      <ambientLight intensity={0.22} color="#64748b" />
      <pointLight position={[8, 6, 8]} intensity={2.4} color="#22d3ee" distance={45} decay={2} />
      <pointLight position={[-7, -3, 6]} intensity={1.6} color="#a78bfa" distance={40} decay={2} />
      <pointLight position={[0, -8, -4]} intensity={1.1} color="#4ade80" distance={35} decay={2} />
      <directionalLight position={[12, 18, 10]} intensity={0.55} color="#f0f9ff" />

      <Stars radius={120} depth={52} count={6500} factor={3.8} saturation={0} fade speed={0.65} />
      <Sparkles count={420} scale={14} size={4} speed={0.55} color="#67e8f9" opacity={0.85} />
      <Sparkles count={180} scale={11} size={2.5} speed={0.35} color="#c084fc" opacity={0.65} />

      <XenotechLattice groupRef={rootRef} />

      <PerspectiveCamera makeDefault position={[0, 0.35, 6.2]} fov={46} />
      <OrbitControls
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.42}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 5}
      />

      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.35} radius={0.55} />
        <ChromaticAberration offset={[0.00085, 0.00115]} radialModulation modulationOffset={0.12} />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
      </EffectComposer>
    </>
  );
}

export function ArchiveCanvas() {
  return (
    <div className="archive-canvas">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

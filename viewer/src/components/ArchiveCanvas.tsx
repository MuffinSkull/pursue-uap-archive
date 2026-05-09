import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Icosahedron,
  OrbitControls,
  PerspectiveCamera,
  Sparkles,
  Stars,
} from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';

function DataCore() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.x = t * 0.07;
    m.rotation.y = t * 0.11;
  });
  return (
    <Float speed={2} rotationIntensity={0.35} floatIntensity={0.5}>
      <Icosahedron ref={ref} args={[1.15, 1]}>
        <meshStandardMaterial
          color="#312e81"
          wireframe
          emissive="#5b21b6"
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.35}
        />
      </Icosahedron>
    </Float>
  );
}

export function ArchiveCanvas() {
  return (
    <div className="archive-canvas">
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.35} />
        <pointLight position={[8, 6, 10]} intensity={1.5} color="#c4b5fd" />
        <pointLight position={[-6, -4, -4]} intensity={0.6} color="#38bdf8" />
        <Stars radius={80} depth={40} count={4500} factor={3.5} fade speed={0.4} />
        <Sparkles count={80} scale={10} size={3} speed={0.25} color="#a78bfa" />
        <DataCore />
        <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={48} />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.35}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}

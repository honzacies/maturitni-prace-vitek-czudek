"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import type { Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { CASE, FIXTURES, PARTS, SLOTS, type Part, type Vec3 } from "@/lib/parts";
import styles from "./thesis.module.css";

const GOLD = "#d8a13f";
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Slides a part between its installed and exploded position. */
function Assembly({
  part,
  exploded,
  active,
  onHover,
}: {
  part: Part;
  exploded: boolean;
  active: boolean;
  onHover: (id: string | null) => void;
}) {
  const group = useRef<Group>(null);
  // hovering slides a part part-way out, so you see both it and the slot it left
  const travel = exploded ? 1 : active ? 0.16 : 0;
  const target = part.explode.map((d) => d * travel) as Vec3;

  useFrame((_, delta) => {
    if (!group.current) return;
    const ease = 1 - Math.pow(0.001, delta);
    group.current.position.x += (target[0] - group.current.position.x) * ease;
    group.current.position.y += (target[1] - group.current.position.y) * ease;
    group.current.position.z += (target[2] - group.current.position.z) * ease;
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(part.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      {part.boxes.map((box, i) => (
        <mesh key={i} position={box.at} castShadow receiveShadow>
          <boxGeometry args={box.size} />
          <meshStandardMaterial
            color={active ? GOLD : part.color}
            emissive={active ? GOLD : "#000000"}
            emissiveIntensity={active ? 0.4 : 0}
            metalness={0.18}
            roughness={0.58}
          />
          <Edges color={active ? GOLD : "#4a5a55"} />
        </mesh>
      ))}
    </group>
  );
}

/** The connector a part plugs into — lit only while that part is hovered. */
function SlotMarker({ slot, lit }: { slot: (typeof SLOTS)[number]; lit: boolean }) {
  const material = useRef<MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (!material.current) return;
    const goal = lit ? 1 : 0;
    material.current.emissiveIntensity +=
      (goal - material.current.emissiveIntensity) * (1 - Math.pow(0.002, delta));
    material.current.opacity = 0.25 + material.current.emissiveIntensity * 0.75;
  });

  return (
    <mesh position={slot.at}>
      <boxGeometry args={slot.size} />
      <meshStandardMaterial
        ref={material}
        color={GOLD}
        emissive={GOLD}
        emissiveIntensity={0}
        transparent
        opacity={0.25}
      />
    </mesh>
  );
}

/** Eases a material's opacity towards a goal. */
function fade(mesh: Mesh | null, goal: number, delta: number) {
  const material = mesh?.material as MeshStandardMaterial | undefined;
  if (!material) return;
  material.opacity += (goal - material.opacity) * (1 - Math.pow(0.002, delta));
}

/**
 * Case shell. The glass side clears further while a part is hovered, and the
 * lid comes off while exploded, since that is the way the parts travel out.
 */
function Enclosure({ revealing, exploded }: { revealing: boolean; exploded: boolean }) {
  const side = useRef<Mesh>(null);
  const lid = useRef<Mesh>(null);
  const { width: w, height: h, depth: d, wall } = CASE;
  const panels: { size: Vec3; at: Vec3 }[] = [
    { size: [w, wall, d], at: [0, 0, 0] },
    { size: [w, h, wall], at: [0, h / 2, -d / 2] },
    { size: [wall, h, d], at: [-w / 2, h / 2, 0] },
  ];

  useFrame((_, delta) => {
    fade(side.current, revealing ? 0.03 : 0.1, delta);
    fade(lid.current, exploded ? 0 : 1, delta);
  });

  return (
    <group>
      {panels.map((panel, i) => (
        <mesh key={i} position={panel.at} receiveShadow>
          <boxGeometry args={panel.size} />
          <meshStandardMaterial color="#20272b" metalness={0.15} roughness={0.7} />
          <Edges color="#3b4a46" />
        </mesh>
      ))}

      <mesh ref={lid} position={[0, h, 0]} receiveShadow>
        <boxGeometry args={[w, wall, d]} />
        <meshStandardMaterial
          color="#20272b"
          transparent
          opacity={1}
          metalness={0.15}
          roughness={0.7}
        />
      </mesh>

      <mesh ref={side} position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[wall, h, d]} />
        <meshStandardMaterial
          color="#7fb4c8"
          transparent
          opacity={0.1}
          metalness={0.1}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

/** Pulls the camera back and lifts its aim when the parts rise out of the case. */
function CameraRig({ exploded }: { exploded: boolean }) {
  useFrame((state, delta) => {
    const controls = state.controls as { target: Vector3; update: () => void } | null;
    if (!controls) return;
    const ease = 1 - Math.pow(0.02, delta);
    controls.target.y += ((exploded ? 3.0 : 0) - controls.target.y) * ease;

    const from = state.camera.position.clone().sub(controls.target);
    const distance = from.length();
    const goal = exploded ? 19.5 : 12.7;
    state.camera.position
      .copy(controls.target)
      .addScaledVector(from.normalize(), distance + (goal - distance) * ease);
    controls.update();
  });
  return null;
}

function Scene({
  hovered,
  exploded,
  onHover,
}: {
  hovered: string | null;
  exploded: boolean;
  onHover: (id: string | null) => void;
}) {
  const litSlot = PARTS.find((p) => p.id === hovered)?.slot;

  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#bcd0e8", "#2e2822", 0.7]} />
      <directionalLight position={[7, 11, 6]} intensity={2.2} color="#fff2df" castShadow />
      <directionalLight position={[-8, 4, -6]} intensity={0.9} color="#8fb8ff" />
      <pointLight position={[1.5, 2.6, 1.5]} intensity={6} distance={7} color={GOLD} />

      <group position={[0, -2.2, 0]}>
        <Enclosure revealing={hovered !== null} exploded={exploded} />

        {FIXTURES.map((fixture, i) => (
          <mesh key={i} position={fixture.at}>
            <boxGeometry args={fixture.size} />
            <meshStandardMaterial color={fixture.color} metalness={0.15} roughness={0.65} />
          </mesh>
        ))}

        {SLOTS.map((slot, i) => (
          <SlotMarker key={i} slot={slot} lit={litSlot === slot.id} />
        ))}

        {PARTS.map((part) => (
          <Assembly
            key={part.id}
            part={part}
            exploded={exploded}
            active={hovered === part.id}
            onHover={onHover}
          />
        ))}
      </group>
    </>
  );
}

export function Build3D({
  hovered,
  onHover,
}: {
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const [exploded, setExploded] = useState(false);

  return (
    <div className={styles.stage}>
      <div className={styles.stageCanvas}>
      <Canvas
        shadows
        camera={{ position: [10.4, 2.9, 5.6], fov: 32 }}
        onPointerMissed={() => onHover(null)}
      >
        <Scene hovered={hovered} exploded={exploded} onHover={onHover} />
        <CameraRig exploded={exploded} />
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={7}
          maxDistance={30}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2}
          /* keep the viewer on the open side of the case */
          minAzimuthAngle={-0.35}
          maxAzimuthAngle={1.9}
        />
      </Canvas>
      </div>

      <div className={styles.stageBar}>
        <span>Táhni myší = otoč · kolečko = přiblíž</span>
        <button type="button" onClick={() => setExploded(!exploded)} aria-pressed={exploded}>
          {exploded ? "Složit sestavu" : "Rozložit sestavu"}
        </button>
      </div>
    </div>
  );
}

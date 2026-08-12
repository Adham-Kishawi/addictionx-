"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

// ============================================================
// PRODUCT360 — the real 360° turntable (wave 11, R3F).
//
// One 6×6 strip (`public/uploads/360/strip.jpg`, 36 cells of a
// full rotation extracted from walid's turntable video) is loaded
// once as a single GPU texture. A plane with a custom shader
// samples the CURRENT cell (NearestFilter → no bleeding) and
// crossfades between it and the NEXT cell inside the fragment
// shader — so the turn is buttery with zero DOM <img> swapping.
//
// Drive: the scroll story (progressRef, 0..1 from the 300vh
// showcase) walks the base angle 0→35; a horizontal pointer drag
// adds a persistent offset on top (the customer can spin the
// bottle by hand). The wrapper uses `mix-blend-screen` so the
// studio black background vanishes and the bottle glows over the
// page — the same visual language as the old <img> turn.
//
// `prefers-reduced-motion` or no WebGL → static poster image.
// ============================================================

const STRIP_SRC = "/uploads/360/strip.jpg";
const COLS = 6;
const ROWS = 6;
const TOTAL = COLS * ROWS; // 36

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uCell;
  uniform vec2 uGrid;
  varying vec2 vUv;

  void main() {
    float total = uGrid.x * uGrid.y;
    float cell = mod(uCell, total);
    float i = floor(cell);
    float f = fract(cell);
    float j = mod(i + 1.0, total);

    vec2 c1 = vec2(mod(i, uGrid.x), floor(i / uGrid.x));
    vec2 c2 = vec2(mod(j, uGrid.x), floor(j / uGrid.x));

    vec3 a = texture2D(uTex, (vUv + c1) / uGrid).rgb;
    vec3 b = texture2D(uTex, (vUv + c2) / uGrid).rgb;

    gl_FragColor = vec4(mix(a, b, f), 1.0);
  }
`;

function TurntablePlane({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    offset: 0,
  });
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const viewport = useThree((s) => s.viewport);

  // Load the strip once. No mipmaps / no filtering — the shader does its
  // own cell sampling and crossfade, so interpolated sampling would bleed
  // across cells.
  useEffect(() => {
    let disposed = false;
    const tex = new THREE.TextureLoader().load(
      STRIP_SRC,
      (t) => {
        t.minFilter = THREE.NearestFilter;
        t.magFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.needsUpdate = true;
        if (!disposed) setTexture(t);
      },
      undefined,
      () => setTexture(null),
    );
    return () => {
      disposed = true;
      tex.dispose();
    };
  }, []);

  // Scroll base + drag offset → the shader cell (fractional = crossfade).
  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    const base = progressRef.current ?? 0;
    mat.uniforms.uCell.value = base * (TOTAL - 1) + dragRef.current.offset;
  });

  // Plane sized to the visible 16:9 frame, kept inside the container.
  const aspect = 16 / 9;
  let h = viewport.height * 0.82;
  let w = h * aspect;
  if (w > viewport.width * 0.92) {
    w = viewport.width * 0.92;
    h = w / aspect;
  }

  if (!texture) return null;

  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTex: { value: texture },
          uCell: { value: 0 },
          uGrid: { value: new THREE.Vector2(COLS, ROWS) },
        }}
      />
    </mesh>
  );
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function Product360({
  progressRef,
  poster,
  name,
  className,
}: {
  progressRef: React.RefObject<number>;
  poster: string;
  name: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [webgl] = useState(isWebGLAvailable);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startOffset: 0,
    offset: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  if (reduce || !webgl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt={name}
        draggable={false}
        className={`h-full w-full select-none object-contain ${className ?? ""}`}
      />
    );
  }

  const onDown = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    dragRef.current.active = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startOffset = dragRef.current.offset;
    el.style.cursor = "grabbing";
  };
  const onMove = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el || !dragRef.current.active) return;
    const w = el.clientWidth || window.innerWidth;
    // One full turn across the container width.
    dragRef.current.offset =
      dragRef.current.startOffset +
      ((e.clientX - dragRef.current.startX) / w) * TOTAL;
  };
  const onUp = () => {
    const el = containerRef.current;
    if (el) el.style.cursor = "grab";
    dragRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 5], fov: 35 }}
      >
        <TurntablePlane progressRef={progressRef} />
      </Canvas>
    </div>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Line } from '@react-three/drei';

function Stars({ count = 1500, spread = 3000 }) {
  const mesh = React.useRef();
  const positions = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Répartition sur un grand carré centré (spread = largeur totale, donc -spread/2 à +spread/2)
      arr.push((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, -10);
    }
    return new Float32Array(arr);
  }, [count, spread]);
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={0xffffff} size={0.7} />
    </points>
  );
}

// --- Solar System Data (distances réalistes, Terre=42) ---
const BASE_PLANETS = [
  { name: 'Mercure', color: '#b5b5b5', orbit: 16.4, size: 0.6, speed: 0.036, gravityInfluence: 3, ecc: 0.206 },
  { name: 'Vénus', color: '#e0c16c', orbit: 30.2, size: 1.1, speed: 0.028, gravityInfluence: 5, ecc: 0.007 },
  { name: 'Terre', color: '#1e90ff', orbit: 42, size: 1.2, speed: 0.022, gravityInfluence: 8, ecc: 0.017, moons: [
    { name: 'Lune', color: '#ccc', orbit: 3.5, size: 0.35, speed: 0.08, gravityInfluence: 2, ecc: 0.055 }
  ] },
  { name: 'Mars', color: '#d14d29', orbit: 63.8, size: 0.9, speed: 0.018, gravityInfluence: 4, ecc: 0.093, moons: [
    { name: 'Phobos', color: '#aaa', orbit: 2.5, size: 0.15, speed: 0.18, gravityInfluence: 0.8, ecc: 0.015 },
    { name: 'Deimos', color: '#bbb', orbit: 4.2, size: 0.10, speed: 0.10, gravityInfluence: 0.5, ecc: 0.0002 }
  ] },
  { name: 'Jupiter', color: '#eab676', orbit: 218.4, size: 2.6, speed: 0.009, gravityInfluence: 24, ecc: 0.049, moons: [
    { name: 'Io', color: '#e5c97d', orbit: 8.5, size: 0.25, speed: 0.13, gravityInfluence: 1.5, ecc: 0.004 },
    { name: 'Europe', color: '#b4d2e7', orbit: 12, size: 0.22, speed: 0.10, gravityInfluence: 1.3, ecc: 0.009 },
    { name: 'Ganymède', color: '#d8c7a7', orbit: 16, size: 0.30, speed: 0.08, gravityInfluence: 1.6, ecc: 0.0013 },
    { name: 'Callisto', color: '#b5b5b5', orbit: 21, size: 0.28, speed: 0.06, gravityInfluence: 1.2, ecc: 0.007 }
  ], rings: [
    { innerRadius: 3.5, outerRadius: 4.2, color: '#eab676', opacity: 0.22, tilt: 0.13 }
  ] },
  { name: 'Saturne', color: '#e7d9a7', orbit: 402.4, size: 2.1, speed: 0.007, gravityInfluence: 14, ecc: 0.056, moons: [
    { name: 'Mimas', color: '#bbb', orbit: 3.9, size: 0.11, speed: 0.18, gravityInfluence: 0.3, ecc: 0.020 },
    { name: 'Encelade', color: '#e0f6ff', orbit: 6.2, size: 0.13, speed: 0.16, gravityInfluence: 0.4, ecc: 0.0047 },
    { name: 'Téthys', color: '#eaeaea', orbit: 8.7, size: 0.14, speed: 0.14, gravityInfluence: 0.5, ecc: 0.0001 },
    { name: 'Dioné', color: '#e6e6e6', orbit: 11.2, size: 0.16, speed: 0.13, gravityInfluence: 0.6, ecc: 0.0022 },
    { name: 'Rhéa', color: '#e0e0e0', orbit: 15.3, size: 0.18, speed: 0.11, gravityInfluence: 0.7, ecc: 0.001 },
    { name: 'Titan', color: '#e0b96c', orbit: 20, size: 0.28, speed: 0.07, gravityInfluence: 1.1, ecc: 0.028 },
    { name: 'Japet', color: '#cfcfcf', orbit: 35.5, size: 0.19, speed: 0.04, gravityInfluence: 0.4, ecc: 0.0283 }
  ], rings: [
    { innerRadius: 2.5, outerRadius: 3.2, color: '#e7d9a7', opacity: 0.44, tilt: 0.48 },
    { innerRadius: 3.3, outerRadius: 3.5, color: '#fff6c7', opacity: 0.22, tilt: 0.48 }
  ] },
  { name: 'Uranus', color: '#7de3f4', orbit: 805.6, size: 1.7, speed: 0.005, gravityInfluence: 9, ecc: 0.046, moons: [
    { name: 'Miranda', color: '#d6f6ff', orbit: 5.1, size: 0.09, speed: 0.21, gravityInfluence: 0.2, ecc: 0.0013 },
    { name: 'Ariel', color: '#e3f6ff', orbit: 7.5, size: 0.13, speed: 0.16, gravityInfluence: 0.3, ecc: 0.0012 },
    { name: 'Umbriel', color: '#c4d2e6', orbit: 10.4, size: 0.12, speed: 0.13, gravityInfluence: 0.3, ecc: 0.0039 },
    { name: 'Titania', color: '#eaeaea', orbit: 14.2, size: 0.17, speed: 0.10, gravityInfluence: 0.4, ecc: 0.0011 },
    { name: 'Obéron', color: '#b5b5b5', orbit: 18.0, size: 0.16, speed: 0.08, gravityInfluence: 0.4, ecc: 0.0014 }
  ], rings: [
    { innerRadius: 1.5, outerRadius: 2.0, color: '#7de3f4', opacity: 0.30, tilt: 1.1 }
  ] },
  { name: 'Neptune', color: '#4166f6', orbit: 1262.9, size: 1.7, speed: 0.004, gravityInfluence: 8, ecc: 0.010, moons: [
    { name: 'Triton', color: '#e0e0e0', orbit: 14.3, size: 0.18, speed: 0.09, gravityInfluence: 0.6, ecc: 0.000016 },
    { name: 'Protée', color: '#b5b5b5', orbit: 4.8, size: 0.10, speed: 0.18, gravityInfluence: 0.2, ecc: 0.0005 },
    { name: 'Néréide', color: '#b4d2e7', orbit: 223, size: 0.07, speed: 0.004, gravityInfluence: 0.1, ecc: 0.7512 }
  ], rings: [
    { innerRadius: 1.2, outerRadius: 1.5, color: '#4166f6', opacity: 0.17, tilt: 0.4 }
  ] },
];

// Utilitaire : position ellipse réaliste (même formule que debug)
function getEllipsePosition(cx, cy, a, e, phase, theta) {
  // Centre (cx,cy), demi-grand axe a, excentricité e, phase initiale
  // theta = angle orbital (0 = départ)
  const r = a*(1-e*e)/(1+e*Math.cos(theta));
  const x = cx + Math.cos(theta+phase)*r - a*e*Math.cos(phase);
  const y = cy + Math.sin(theta+phase)*r - a*e*Math.sin(phase);
  return [x, y];
}

function getEllipseFociOffset(a, e, phase) {
  // Décalage du foyer : le Soleil est au foyer à +ae (et non -ae) dans la direction de la phase
  return [a * e * Math.cos(phase), a * e * Math.sin(phase)];
}

function Orbit({ cx=0, cy=0, radius, color = "#888", opacity = 0.4, ecc = 0, phase = 0 }) {
  // Trace l’ellipse réaliste centrée sur cx,cy
  const points = [];
  const N = 128;
  for (let i = 0; i <= N; ++i) {
    const theta = (i / N) * Math.PI * 2;
    const [x, y] = getEllipsePosition(cx, cy, radius, ecc, phase, theta);
    points.push(new THREE.Vector3(x, y, 0));
  }
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p=>[p.x,p.y,p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}

function GravityField({ x, y, influence, color }) {
  // Cercle dégradé radial pour la zone d'influence gravitationnelle
  const texture = React.useMemo(
    () => createRadialGradientTexture(
      `rgba(${color},0.25)`, // centre plus intense
      `rgba(${color},0)`,    // bord transparent
      256
    ),
    [color]
  );
  return (
    <mesh position={[x, y, -0.4]}>
      <circleGeometry args={[influence, 64]} />
      <meshBasicMaterial map={texture} transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}

function Moon({ planetPos, moon, time, phase, labelOpacity = 1, showLabels = true, gravityInfluence = 0 }) {
  const angle = moon.speed * time + phase;
  const ecc = moon.ecc || 0;
  const a = moon.orbit;
  const r = a * (1 - ecc * ecc) / (1 + ecc * Math.cos(angle));
  const [cx, cy] = getEllipseFociOffset(a, ecc, phase);
  const x = planetPos[0] + Math.cos(angle) * r - cx;
  const y = planetPos[1] + Math.sin(angle) * r - cy;
  // Couleur champ gravitationnel
  let gravColor = '220,220,220';
  if (moon.color === '#e5c97d') gravColor = '229,201,125';
  if (moon.color === '#b4d2e7') gravColor = '180,210,231';
  if (moon.color === '#d8c7a7') gravColor = '216,199,167';
  if (moon.color === '#b5b5b5') gravColor = '181,181,181';
  if (moon.color === '#e0b96c') gravColor = '224,185,108';
  return (
    <>
      {/* Champ gravitationnel de la lune */}
      {gravityInfluence > 0 && (
        <GravityField x={x} y={y} influence={gravityInfluence} color={gravColor} />
      )}
      <Orbit radius={moon.orbit} color="#aaa" opacity={0.2} />
      <mesh position={[x, y, 0]}>
        <circleGeometry args={[moon.size, 20]} />
        <meshBasicMaterial color={moon.color} />
      </mesh>
      {showLabels && (
        <Html position={[x, y + moon.size + 0.5, 0]} center style={{ color: '#fff', fontSize: '0.7rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', pointerEvents: 'none' }}>{moon.name}</Html>
      )}
    </>
  );
}

function PlanetRing({ x, y, innerRadius, outerRadius, color = '#fff', opacity = 0.45, tilt = 0 }) {
  // Génère un anneau simple (cercle épais)
  return (
    <mesh position={[x, y, 0.01]} rotation={[tilt, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 80]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={2} />
    </mesh>
  );
}

function Planet({ color, orbit, size, speed, time, label, phase, moons = [], moonPhases = [], labelOpacity = 1, showLabels = true, gravityInfluence = 0, ecc, rings, spin = 0 }) {
  // Mouvement orbital avec phase initiale
  const angle = speed * time + phase;
  // Correction : utiliser la vraie excentricité
  const e = typeof ecc === 'number' ? ecc : 0;
  const a = orbit;
  // Centre du système = (0,0)
  const [x, y] = getEllipsePosition(0, 0, a, e, phase || 0, angle-phase);
  // Couleur d'atmosphère (bleu pour Terre, orange pour Mars, etc.)
  let atmColor = 'rgba(30,144,255,0.4)';
  let atmOuter = 'rgba(30,144,255,0)';
  if (color === '#d14d29') { atmColor = 'rgba(255,120,80,0.25)'; atmOuter = 'rgba(255,120,80,0)'; }
  if (color === '#e1b07e') { atmColor = 'rgba(255,220,150,0.18)'; atmOuter = 'rgba(255,220,150,0)'; }
  if (color === '#e7d9a7') { atmColor = 'rgba(255,255,200,0.18)'; atmOuter = 'rgba(255,255,200,0)'; }
  if (color === '#7de3f4') { atmColor = 'rgba(120,220,255,0.18)'; atmOuter = 'rgba(120,220,255,0)'; }
  if (color === '#4166f6') { atmColor = 'rgba(80,120,255,0.18)'; atmOuter = 'rgba(80,120,255,0)'; }
  // Texture de dégradé radial pour l'atmosphère
  const atmTexture = React.useMemo(() => createRadialGradientTexture(atmColor, atmOuter, 128), [atmColor, atmOuter]);
  // Couleur pour le champ gravitationnel (format RGB)
  let gravColor = '255,255,255';
  if (color === '#1e90ff') gravColor = '30,144,255'; // Terre
  if (color === '#d14d29') gravColor = '255,120,80'; // Mars
  if (color === '#e1b07e') gravColor = '255,220,150'; // Jupiter
  if (color === '#e7d9a7') gravColor = '255,255,200'; // Saturne
  if (color === '#7de3f4') gravColor = '120,220,255'; // Uranus
  if (color === '#4166f6') gravColor = '80,120,255'; // Neptune
  return (
    <>
      {/* Champ gravitationnel */}
      {gravityInfluence > 0 && (
        <GravityField x={x} y={y} influence={gravityInfluence} color={gravColor} />
      )}
      {/* Atmosphère dégradée */}
      <mesh position={[x, y, -0.2]}>
        <circleGeometry args={[size * 1.18, 40]} />
        <meshBasicMaterial map={atmTexture} transparent opacity={1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Planète avec rotation dynamique */}
      <mesh position={[x, y, 0]} rotation={[0, 0, spin]}>
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Anneaux */}
      {Array.isArray(rings) && rings.map((ring, i) => (
        <PlanetRing key={i} x={x} y={y} {...ring} />
      ))}
      {/* Label */}
      {showLabels && (
        <Html position={[x, y + size + 0.7, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.85rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', pointerEvents: 'none' }}>{label}</Html>
      )}
      {/* Lunes */}
      {moons.map((moon, i) => (
        <Moon key={moon.name || i} planetPos={[x, y]} moon={moon} time={time} phase={moonPhases[i]} labelOpacity={labelOpacity} showLabels={showLabels} gravityInfluence={moon.gravityInfluence} />
      ))}
    </>
  );
}

// Génère une texture de dégradé radial (canvas) pour halo ou atmosphère
function createRadialGradientTexture(innerColor, outerColor, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.05,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function SunGlow() {
  // Jaune/blanc transparent
  const texture = React.useMemo(() => createRadialGradientTexture('rgba(255,255,200,0.7)', 'rgba(255,255,200,0)', 256), []);
  return (
    <mesh position={[0, 0, -0.5]}>
      <circleGeometry args={[8, 64]} />
      <meshBasicMaterial map={texture} transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}

// --- Gravitational constant and masses (realistic units, but scaled for gameplay) ---
const G = 0.002;
const SUN_MASS = 333000;
const PLANET_MASS_BOOST = 120; // Facteur multiplicatif pour renforcer la gravité des planètes
const MOON_MASS_BOOST = 400;   // Facteur multiplicatif pour renforcer la gravité des lunes
const PLANET_MASSES = {
  'Mercure': 0.055 * PLANET_MASS_BOOST,
  'Vénus': 0.815 * PLANET_MASS_BOOST,
  'Terre': 1 * PLANET_MASS_BOOST,
  'Mars': 0.107 * PLANET_MASS_BOOST,
  'Jupiter': 317.8 * PLANET_MASS_BOOST,
  'Saturne': 95.2 * PLANET_MASS_BOOST,
  'Uranus': 14.5 * PLANET_MASS_BOOST,
  'Neptune': 17.1 * PLANET_MASS_BOOST,
};

function computeGravityForce(x, y, planets) {
  let fx = 0, fy = 0;
  // Gravité du Soleil (force attractive massive)
  const distSqSun = x*x + y*y;
  if (distSqSun > 0.01) {
    const dist = Math.sqrt(distSqSun);
    const force = G * SUN_MASS / distSqSun;
    fx += force * (-x) / dist;
    fy += force * (-y) / dist;
  }
  // Planètes (masse boostée)
  for (const p of planets) {
    const px = p.x, py = p.y;
    // Correction : utiliser p.gravityInfluence si défini, sinon PLANET_MASSES[p.name]
    const mass = (typeof p.gravityInfluence === 'number' && p.gravityInfluence > 0)
      ? p.gravityInfluence * PLANET_MASS_BOOST * 1.8 // compromis : x1.8
      : PLANET_MASSES[p.name] * 1.8 || 1.8 * PLANET_MASS_BOOST;
    const dx = px - x, dy = py - y;
    const distSq = dx*dx + dy*dy;
    if (distSq < 0.01) continue;
    const dist = Math.sqrt(distSq);
    const force = G * mass / distSq;
    fx += force * dx / dist;
    fy += force * dy / dist;
    // Lunes (masse boostée)
    if (p.moons) {
      for (const moon of p.moons) {
        const mx = moon.x, my = moon.y;
        // Correction : utiliser moon.gravityInfluence si défini, sinon MOON_MASS_BOOST
        const mboost = (typeof moon.gravityInfluence === 'number' && moon.gravityInfluence > 0)
          ? moon.gravityInfluence * MOON_MASS_BOOST * 2.5 // compromis : x2.5
          : 0.001 * MOON_MASS_BOOST * 2.5;
        const mdx = mx - x, mdy = my - y;
        const mdistSq = mdx*mdx + mdy*mdy;
        if (mdistSq < 0.01) continue;
        const mdist = Math.sqrt(mdistSq);
        const mforce = G * mboost / mdistSq;
        fx += mforce * mdx / mdist;
        fy += mforce * mdy / mdist;
      }
    }
  }
  return [fx, fy];
}

function Explosion({ position, color = '#fff', onEnd }) {
  // Sécurité : vérifie que position est bien un tableau [x, y]
  const safePos = Array.isArray(position) && position.length === 2 && typeof position[0] === 'number' && typeof position[1] === 'number'
    ? position : [0, 0];
  const [particles, setParticles] = React.useState(() => {
    // Génère 24 particules avec directions et vitesses aléatoires
    return Array.from({ length: 24 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 2;
      return {
        x: safePos[0],
        y: safePos[1],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0
      };
    });
  });
  const [age, setAge] = React.useState(0);
  useFrame((_, delta) => {
    setAge(a => a + delta);
    setParticles(ps => ps.map(p => ({
      ...p,
      x: p.x + p.vx * delta,
      y: p.y + p.vy * delta,
      life: p.life + delta
    })));
    if (age > 0.7 && onEnd) onEnd();
  });
  return (
    <>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0.2]}>
          <circleGeometry args={[0.28 * (1.1 - p.life), 8]} />
          <meshBasicMaterial color={color} transparent opacity={1 - p.life * 1.1} />
        </mesh>
      ))}
    </>
  );
}

function Asteroid({ initial, color = '#fff', trailColor = '#ff0', planets, timeSpeed, paused, labelOpacity = 1, name, systemRadius = 300, onEscape, onExplode }) {
  const [pos, setPos] = React.useState(initial.pos);
  const [vel, setVel] = React.useState(initial.vel);
  const [trail, setTrail] = React.useState([initial.pos]);
  const [escaped, setEscaped] = React.useState(false);
  const [exploding, setExploding] = React.useState(false);
  const hasExplodedRef = React.useRef(false);
  const impactPosRef = React.useRef(null);
  const bornAt = initial.bornAt || Date.now();
  // Simulation physique
  useFrame((_, delta) => {
    if (paused || escaped || exploding || hasExplodedRef.current) return;
    let dt = delta * 2 * timeSpeed;
    let [fx, fy] = computeGravityForce(pos[0], pos[1], planets);
    let newVel = [vel[0] + fx * dt, vel[1] + fy * dt];
    let newPos = [pos[0] + newVel[0] * dt, pos[1] + newVel[1] * dt];
    setVel(newVel);
    setPos(newPos);
    setTrail(trail => {
      const t = [...trail, newPos];
      if (t.length < 2) return [trail[trail.length-1] || newPos, newPos];
      return t.slice(-150);
    });
    // Sortie système solaire
    if (newPos[0]*newPos[0] + newPos[1]*newPos[1] > systemRadius*systemRadius && onEscape) {
      setEscaped(true);
      setTimeout(onEscape, 0);
    }
    // Collision avec le Soleil (rayon 4)
    if (!exploding && !hasExplodedRef.current && newPos[0]*newPos[0] + newPos[1]*newPos[1] < 4*4) {
      hasExplodedRef.current = true;
      impactPosRef.current = [...newPos];
      setExploding(true);
    }
    // Collision avec une planète
    for (let p of planets) {
      const dx = newPos[0] - p.x;
      const dy = newPos[1] - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (!exploding && !hasExplodedRef.current && dist < p.size + 0.36) {
        hasExplodedRef.current = true;
        impactPosRef.current = [...newPos];
        setExploding(true);
        break;
      }
    }
  });
  React.useEffect(() => {
    if (exploding && impactPosRef.current && onExplode) {
      onExplode(impactPosRef.current, color);
    }
  }, [exploding]);
  if (escaped || hasExplodedRef.current) return null;
  if (exploding) {
    return <Explosion position={impactPosRef.current || pos} color={color} onEnd={() => {}} />;
  }
  return (
    <>
      {trail.length > 1 && (
        <Line
          points={trail.map(([x, y]) => [x, y, 0.05])}
          color={trailColor}
          lineWidth={1.2}
          dashed={false}
          transparent
          opacity={0.9}
          depthTest={false}
          depthWrite={false}
        />
      )}
      <mesh position={[pos[0], pos[1], 0.1]}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {name && (
        <Html position={[pos[0], pos[1] + 1, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.8rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', pointerEvents: 'none' }}>{name}</Html>
      )}
    </>
  );
}

function generateAsteroidInnerSystem() {
  // Rayon entre 20 et 60 unités
  const angle = Math.random() * Math.PI * 2;
  const radius = 20 + Math.random() * 40;
  const px = Math.cos(angle) * radius;
  const py = Math.sin(angle) * radius;
  // Vitesse tangentielle CIRCULAIRE pour orbite autour du Soleil
  const r = Math.sqrt(px*px + py*py);
  const v_circ = Math.sqrt(G * SUN_MASS / r); // vitesse circulaire locale
  // direction tangentielle (perpendiculaire au rayon)
  const vx = -py / r * v_circ;
  const vy = px / r * v_circ;
  const colors = ['#ff9','#9ff','#f99','#0ff','#f0a','#fa0','#0fa','#a0f','#fff','#ff0'];
  const idx = Math.floor(Math.random() * colors.length);
  return {
    pos: [px, py],
    vel: [vx, vy],
    color: colors[idx],
    trailColor: colors[(idx*3+2) % colors.length],
    destroyed: false,
    bornAt: Date.now()
  };
}

function generateAsteroids(n = 20) {
  const arr = [];
  for (let i = 0; i < n; ++i) {
    // Angle de départ dispersé
    const angle = Math.random() * Math.PI * 2 + (i * Math.PI * 2 / n) * 0.35;
    // Nouvelle répartition : 5% ceinture intérieure (20-60), 60% ceinture principale (80-350), 35% transneptuniens (400-1250)
    let radius;
    const p = Math.random();
    if (p < 0.05) {
      // Ceinture intérieure (près de Mars)
      radius = 20 + Math.random() * 40;
    } else if (p < 0.65) {
      // Ceinture principale (entre Mars et Jupiter, jusqu’à Saturne)
      radius = 80 + Math.random() * 270; // 80 à 350
    } else {
      // Astéroïdes lointains (au-delà de Saturne)
      radius = 400 + Math.random() * 850; // 400 à 1250 (jusqu’à Neptune)
    }
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    // Vitesse tangentielle circulaire
    const r = Math.sqrt(px*px + py*py);
    const v_circ = Math.sqrt(G * SUN_MASS / r);
    const vx = -py / r * v_circ;
    const vy = px / r * v_circ;
    const colors = ['#ff9','#9ff','#f99','#0ff','#f0a','#fa0','#0fa','#a0f','#fff','#ff0'];
    const idx = Math.floor(Math.random() * colors.length);
    arr.push({
      pos: [px, py],
      vel: [vx, vy],
      color: colors[idx],
      trailColor: colors[(idx*3+2) % colors.length],
      destroyed: false,
      bornAt: Date.now()
    });
  }
  return arr;
}

function RealAsteroid({ a, e, phi, color, trailColor, t, name, systemRadius = 300, onEscape, onExplode, showLabels = true, labelOpacity = 1 }) {
  // Mouvement elliptique autour du soleil
  const n = 0.25 / Math.pow(a, 1.5);
  const theta = t * n + phi;
  const r = a * (1 - e*e) / (1 + e * Math.cos(theta));
  const x = Math.cos(theta) * r;
  const y = Math.sin(theta) * r;
  // Pas de queue (aucun point)
  const trail = [];
  // On n'affiche pas de <line> si trail.length === 0
  return (
    <>
      {trail.length > 0 && (
        <Line
          points={trail.map(([x, y]) => [x, y, 0.05])}
          color={trailColor}
          lineWidth={3}
          dashed={false}
          transparent
          opacity={0.9}
          depthTest={false}
          depthWrite={false}
        />
      )}
      <mesh position={[x, y, 0.1]}>
        <circleGeometry args={[0.45, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Nom de l'astéroïde permanent, en couleur */}
      {name && showLabels && labelOpacity > 0.01 && (
        <Html position={[x, y + 0.7, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.85rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity, userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none', pointerEvents: 'none' }}>{name}</Html>
      )}
    </>
  );
}

function SolarSystemView({ zoom, showLabels, timeSpeed, paused, asteroids, setAsteroids }) {
  const [time, setTime] = React.useState(0);
  const [explosions, setExplosions] = React.useState([]);
  const planets = React.useMemo(() => {
    return BASE_PLANETS.map(p => ({
      ...p,
      phase: Math.random() * Math.PI * 2,
      moonPhases: p.moons ? p.moons.map(() => Math.random() * Math.PI * 2) : [],
    }));
  }, []);
  const [planetSpins, setPlanetSpins] = React.useState(() =>
    BASE_PLANETS.map(p => ({ spin: Math.random() * Math.PI * 2, spinSpeed: 0.015 + Math.random() * 0.01 }))
  );
  useFrame((_, delta) => {
    if (!paused) setTime(t => t + delta * timeSpeed);
    // --- Ajout : mise à jour des spins dynamiques ---
    if (!paused) {
      setPlanetSpins(spins => spins.map((spinObj, i) => {
        const planet = BASE_PLANETS[i];
        const targetSync = computeTidalSyncSpeed(planet);
        const tidalFactor = computeTidalFactor(planet);
        // La vitesse de rotation tend vers la synchronisation
        const newSpinSpeed = spinObj.spinSpeed + (- (spinObj.spinSpeed - targetSync) * tidalFactor * delta);
        // Mise à jour de l'angle
        let newSpin = spinObj.spin + newSpinSpeed * delta * timeSpeed;
        // Garde l'angle entre 0 et 2PI
        if (newSpin > Math.PI * 2) newSpin -= Math.PI * 2;
        if (newSpin < 0) newSpin += Math.PI * 2;
        return { spin: newSpin, spinSpeed: newSpinSpeed };
      }));
    }
  });
  const planetsWithPos = React.useMemo(() => {
    const result = planets.map(p => {
      const angle = p.speed * time + p.phase;
      const ecc = p.ecc || 0;
      const a = p.orbit;
      const [x, y] = getEllipsePosition(0, 0, a, ecc, p.phase || 0, angle - p.phase);
      let moons = [];
      if (p.moons) {
        moons = p.moons.map((moon, i) => {
          const mangle = moon.speed * time + p.moonPhases[i];
          const mecc = moon.ecc || 0;
          const ma = moon.orbit;
          const [mx, my] = getEllipsePosition(x, y, ma, mecc, p.moonPhases[i], mangle - p.moonPhases[i]);
          return { ...moon, x: mx, y: my, phase: p.moonPhases[i], time };
        });
      }
      return { ...p, x, y, time, moons, ecc: p.ecc };
    });
    result.forEach(p => {
      const angle = p.speed * time + p.phase;
      const ecc = p.ecc || 0;
      const a = p.orbit;
      const [x, y] = getEllipsePosition(0, 0, a, ecc, p.phase || 0, angle - (p.phase || 0));
      p.x = x;
      p.y = y;
      if (p.moons) {
        p.moons.forEach((moon, idx) => {
          const mangle = moon.speed * time + p.moonPhases[idx];
          const mecc = moon.ecc || 0;
          const ma = moon.orbit;
          const [mx, my] = getEllipsePosition(x, y, ma, mecc, p.moonPhases[idx], mangle - p.moonPhases[idx]);
          moon.x = mx;
          moon.y = my;
        });
      }
    });
    return result;
  }, [planets, time]);
  const labelOpacity = Math.max(0, Math.min(1, (zoom - 0.35) / 0.65));

  // Nouvelle gestion : callbacks pour signaler une explosion ou une sortie d’astéroïde
  function handleAsteroidExplode(idx, pos, color) {
    setExplosions(expls => [...expls, { pos, color, id: Math.random() }]);
    setAsteroids(asts => {
      const arr = [...asts];
      arr[idx] = { ...arr[idx], destroyed: true };
      return arr;
    });
  }
  function handleAsteroidEscape(idx) {
    setAsteroids(asts => {
      const arr = [...asts];
      arr[idx] = { ...arr[idx], destroyed: true };
      return arr;
    });
  }

  return (
    <>
      <SunGlow />
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshBasicMaterial color="#ffe066" />
      </mesh>
      {planetsWithPos.map((p, idx) => (
        <React.Fragment key={p.name}>
          {/* Affiche l'orbite uniquement si la planète est Mercure, Vénus, Terre, Mars, Jupiter, Saturne, Uranus ou Neptune */}
          {['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune'].includes(p.name) && (
            <Orbit cx={0} cy={0} radius={p.orbit} ecc={p.ecc} phase={p.phase} />
          )}
          {/* Ajout : passage de la rotation dynamique */}
          <Planet {...p} time={time} label={p.name} labelOpacity={labelOpacity} showLabels={showLabels} spin={planetSpins[idx]?.spin || 0} />
        </React.Fragment>
      ))}
      {/* Astéroïdes dynamiques */}
      {asteroids.map((ast, idx) => !ast.destroyed && (
        <Asteroid
          key={idx}
          initial={ast}
          color={ast.color}
          trailColor={ast.trailColor}
          planets={planetsWithPos}
          timeSpeed={timeSpeed}
          paused={paused}
          labelOpacity={labelOpacity}
          name={null}
          onEscape={() => handleAsteroidEscape(idx)}
          onExplode={(pos, color) => handleAsteroidExplode(idx, pos, color)}
        />
      ))}
      {/* Astéroïdes réels */}
      {REAL_ASTEROIDS.map((ast, idx) => (
        <RealAsteroid key={ast.name || idx} {...ast} t={time} showLabels={showLabels} labelOpacity={labelOpacity} />
      ))}
      {/* Explosions */}
      {explosions.map(e => (
        <Explosion key={e.id} position={e.pos} color={e.color} onEnd={() => {}} />
      ))}
    </>
  );
}

// --- Astéroïdes réels sur orbite elliptique autour du Soleil ---
// Quelques vrais astéroïdes du système solaire (orbites simplifiées)
const REAL_ASTEROIDS = [
  // (1036) Ganymed : a=142, e=0.534, i=26.7°
  { name: 'Ganymed', a: 142, e: 0.534, phi: 0, color: '#ff9', trailColor: '#ff0' },
  // (433) Eros : a=101, e=0.223, i=10.8°
  { name: 'Eros', a: 101, e: 0.223, phi: Math.PI/3, color: '#9ff', trailColor: '#0ff' },
  // (1) Cérès : a=130, e=0.08, i=10.6°
  { name: 'Cérès', a: 130, e: 0.08, phi: Math.PI/2, color: '#f99', trailColor: '#f0a' },
  // (2) Pallas : a=138, e=0.23, i=34.8°
  { name: 'Pallas', a: 138, e: 0.23, phi: Math.PI/1.5, color: '#fa0', trailColor: '#0fa' },
  // (4) Vesta : a=110, e=0.09, i=7.1°
  { name: 'Vesta', a: 110, e: 0.09, phi: Math.PI/4, color: '#a0f', trailColor: '#fff' },
];

// Ajustement de l’échelle d’affichage pour que tout rentre à l’écran
// (zoom initial et limites de la caméra)
const MIN_ZOOM = 0.002; // permet de dézoomer jusqu'à voir tout le système solaire même sur petit écran
const MAX_ZOOM = 6;

// --- Utilitaire pour obtenir la position monde de chaque planète à l’instant t ---
function getPlanetsWorldPositions(time) {
  return BASE_PLANETS.map(p => {
    const angle = p.speed * time + (p.phase || 0);
    const e = typeof p.ecc === 'number' ? p.ecc : 0;
    const a = p.orbit;
    const [x, y] = getEllipsePosition(0, 0, a, e, p.phase || 0, angle - (p.phase || 0));
    return { ...p, x, y };
  });
}

// --- Ajout effet Voie Lactée : bande d’étoiles dense et allongée ---
function MilkyWay({ count = 2000, length = 3200, width = 420, angle = Math.PI/6 }) {
  // Génère une bande elliptique inclinée
  const mesh = React.useRef();
  const positions = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Coordonnées dans ellipse centrée
      let t = 2 * Math.PI * Math.random();
      let r = Math.sqrt(Math.random());
      let x = Math.cos(t) * r * length/2;
      let y = Math.sin(t) * r * width/2;
      // Ajout d’un flou gaussien pour la densité centrale
      y += (Math.random()-0.5) * width * 0.25;
      // Rotation de l’ellipse (voie lactée inclinée)
      const rot = angle;
      const xr = x * Math.cos(rot) - y * Math.sin(rot);
      const yr = x * Math.sin(rot) + y * Math.cos(rot);
      arr.push(xr, yr, -9.5 + Math.random()*1.5);
    }
    return new Float32Array(arr);
  }, [count, length, width, angle]);
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color={0xffffff} size={1.15} opacity={0.56} transparent />
    </points>
  );
}

// --- Panneau d’options UI pour les astéroïdes dynamiques ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log error if needed
    if (window && window.console) {
      console.error('SolarSystemOptions Error:', error, info);
    }
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="ui-error">
          Erreur dans les options du système solaire.<br />
          <span className="ui-error-message">
            {this.state.error && (this.state.error.message || this.state.error.toString())}
            {this.state.error && this.state.error.stack && (
              <details className="ui-error-stack">
                <summary>Stack</summary>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
            {this.state.info && this.state.info.componentStack && (
              <details className="ui-error-component-stack">
                <summary>React Component Stack</summary>
                <pre>{this.state.info.componentStack}</pre>
              </details>
            )}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

function SolarSystemOptions({ asteroids, onAddAsteroid, onRemoveAsteroid, startAddAsteroid, stopAddAsteroid, showLabels, onToggleLabels }) {
  // DEBUG: Log props to diagnose error
  if (typeof window !== 'undefined' && window.console) {
    // console.log('[SolarSystemOptions] props:', { asteroids, onAddAsteroid, onRemoveAsteroid, startAddAsteroid, stopAddAsteroid, showLabels, onToggleLabels });
  }
  return (
    <div className="ui-options">
      <div className="ui-options-row">
        <div className="ui-btn-add-wrapper">
          <button
            className="ui-btn ui-btn-add"
            onMouseDown={startAddAsteroid}
            onMouseUp={stopAddAsteroid}
            onMouseLeave={stopAddAsteroid}
            onTouchStart={startAddAsteroid}
            onTouchEnd={stopAddAsteroid}
            onClick={onAddAsteroid}
            title="Ajouter un astéroïde"
            aria-label="Ajouter un astéroïde"
          >
            <span className="ui-btn-icon">💫</span>
          </button>
          <span className="ui-badge ui-badge-count">
            x{Array.isArray(asteroids) ? asteroids.filter(ast => !ast.destroyed).length : 0}
          </span>
        </div>
        <button
          className="ui-btn ui-btn-remove"
          onClick={onRemoveAsteroid}
          title="Retirer un astéroïde"
          aria-label="Retirer un astéroïde"
        >
          <span className="ui-btn-icon">🗑️</span>
        </button>
      </div>
    </div>
  );
}

// --- Ajout : Hook pour griser/transparenter le menu après 5s sans survol sur desktop ---
function useUiFade(timeout = 5000) {
  const [faded, setFaded] = React.useState(false);
  const timer = React.useRef();

  React.useEffect(() => {
    // Ne rien faire sur mobile
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const ui = document.getElementById('ui');
    if (!ui) return;
    function resetFade() {
      setFaded(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFaded(true), timeout);
    }
    function cancelFade() {
      setFaded(false);
      clearTimeout(timer.current);
    }
    resetFade();
    ui.addEventListener('mouseenter', resetFade);
    ui.addEventListener('mousemove', resetFade);
    ui.addEventListener('mouseleave', resetFade);
    ui.addEventListener('mousedown', cancelFade);
    ui.addEventListener('touchstart', cancelFade);
    return () => {
      clearTimeout(timer.current);
      ui.removeEventListener('mouseenter', resetFade);
      ui.removeEventListener('mousemove', resetFade);
      ui.removeEventListener('mouseleave', resetFade);
      ui.removeEventListener('mousedown', cancelFade);
      ui.removeEventListener('touchstart', cancelFade);
    };
  }, [timeout]);
  return faded;
}

// --- Ripple effect util ---
function addRipple(e) {
  const btn = e.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const rect = btn.getBoundingClientRect();
  circle.className = 'ripple-effect';
  circle.style.width = circle.style.height = diameter + 'px';
  circle.style.left = (e.clientX - rect.left - diameter / 2) + 'px';
  circle.style.top = (e.clientY - rect.top - diameter / 2) + 'px';
  btn.appendChild(circle);
  circle.addEventListener('animationend', () => circle.remove());
}

// --- Gestion du zoom continu sur appui long ---
function useContinuousAction(action, delay = 120) {
  const interval = React.useRef();
  const start = React.useCallback(() => {
    action();
    if (interval.current) clearInterval(interval.current);
    interval.current = setInterval(action, delay);
  }, [action, delay]);
  const stop = React.useCallback(() => {
    if (interval.current) clearInterval(interval.current);
  }, []);
  React.useEffect(() => () => stop(), [stop]);
  return [start, stop];
}

// --- Ajout pour rotation dynamique réaliste des planètes ---
function computeTidalSyncSpeed(planet) {
  // Vitesse de rotation synchrone (1 rotation par révolution)
  // = vitesse orbitale (rad/frame)
  return planet.speed;
}
function computeTidalFactor(planet) {
  // Facteur de synchronisation : plus la planète est proche du Soleil, plus la synchronisation est rapide
  // On utilise une formule simplifiée : factor ∝ 1 / (distance^6) (effet de marée)
  // On ajoute un facteur multiplicatif pour ajuster la vitesse de convergence
  const a = planet.orbit;
  return 0.0004 / Math.pow(a, 6);
}

export default function App() {
  const [zoom, setZoom] = React.useState(1.5); // Zoom initial plus large (planètes telluriques visibles)
  const [cameraCenter, setCameraCenter] = React.useState({ x: 0, y: 0 }); // Centrer sur l'orbite de la Terre
  const [showLabels, setShowLabels] = React.useState(true);
  const [timeSpeed, setTimeSpeed] = React.useState(1); // 1 = normal, 0 = pause
  const [paused, setPaused] = React.useState(false);
  const [isUiHovered, setIsUiHovered] = React.useState(false);
  const dragging = React.useRef(false);
  const lastMouse = React.useRef({ x: 0, y: 0 });
  // Limites de zoom
  const MIN_ZOOM = 0.002; // Zoom encore plus large pour TOUT voir
  const MAX_ZOOM = 6;

  // Gestion du zoom centré sur la souris
  React.useEffect(() => {
    function onWheel(e) {
      e.preventDefault();
      const rect = document.body.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Coordonnées monde avant zoom
      const aspect = window.innerWidth / window.innerHeight;
      const viewWidth = 80 * zoom;
      const viewHeight = 80 * zoom;
      const worldX = cameraCenter.x + (mouseX / window.innerWidth - 0.5) * viewWidth * aspect;
      const worldY = cameraCenter.y - (mouseY / window.innerHeight - 0.5) * viewHeight;
      // Appliquer zoom
      let newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom - e.deltaY * 0.0025));
      // Coordonnées monde après zoom
      const newViewWidth = 80 * newZoom;
      const newViewHeight = 80 * newZoom;
      // Calculer nouveau centre pour garder le point sous la souris fixe
      const newCenterX = worldX - (mouseX / window.innerWidth - 0.5) * newViewWidth * aspect;
      const newCenterY = worldY + (mouseY / window.innerHeight - 0.5) * newViewHeight;
      setZoom(newZoom);
      setCameraCenter({ x: newCenterX, y: newCenterY });
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [zoom, cameraCenter]);

  // Drag (pan)
  React.useEffect(() => {
    function onDown(e) {
      if (isUiHovered) return;
      dragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
    function onMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      // Adapter le déplacement à l’échelle monde
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      const viewWidth = 80 * zoom;
      const viewHeight = 80 * zoom;
      setCameraCenter(center => ({
        x: center.x - dx / w * viewWidth * aspect,
        y: center.y + dy / h * viewHeight
      }));
    }
    function onUp() { dragging.current = false; }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [zoom, isUiHovered]);

  function handleZoomIn() {
    setZoom(z => Math.max(MIN_ZOOM, z * 0.8));
  }
  function handleZoomOut() {
    setZoom(z => Math.min(MAX_ZOOM, z / 0.8)); // Correction : dézoomer
  }

  // Contrôle du temps
  const DAY_SECONDS = 86400; // 1 jour = 86400 s

  function getSimulatedDaysPerSecond(timeSpeed) {
    return Number(timeSpeed).toFixed(1);
  }

  function handleSliderChange(e) {
    const v = Number(e.target.value);
    setTimeSpeed(v);
    if (v === 0) setPaused(true);
    else setPaused(false);
  }

  const [globalTime, setGlobalTime] = React.useState(0);
  React.useEffect(() => {
    let anim;
    function loop() {
      setGlobalTime(t => t + 0.016);
      anim = requestAnimationFrame(loop);
    }
    anim = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(anim);
  }, []);
  const planetsWithPos = getPlanetsWorldPositions(globalTime);

  // --- Astéroïdes dynamiques partagés entre UI et Vue 3D ---
  const [asteroids, setAsteroids] = React.useState(() => generateAsteroids());

  function handleAddAsteroid() {
    const now = Date.now();
    let newAst;
    let safe = false;
    let tries = 0;
    while (!safe && tries < 10) {
      newAst = generateAsteroids(1)[0];
      newAst.destroyed = false;
      newAst.bornAt = now;
      // Vérifie que la position initiale n'est pas trop près du Soleil (0,0) ou d'une planète
      const [x, y] = newAst.pos;
      const r = Math.sqrt(x*x + y*y);
      safe = r > 8; // au moins 8 unités du Soleil
      // TODO: on pourrait aussi vérifier la distance à chaque planète
      tries++;
    }
    setAsteroids(asts => [...asts, newAst]);
  }
  function handleRemoveAsteroid() {
    setAsteroids(asts => {
      const idx = asts.findIndex(ast => !ast.destroyed);
      if (idx === -1) return asts;
      const arr = [...asts];
      arr[idx] = { ...arr[idx], destroyed: true };
      return arr;
    });
  }

  // Time speed control with left/right arrows
  function handleDecreaseTimeSpeed() {
    setTimeSpeed(v => Math.max(0, v / 2));
    setPaused(false);
  }
  function handleIncreaseTimeSpeed() {
    setTimeSpeed(v => Math.min(256, v === 0 ? 0.05 : v * 2));
    setPaused(false);
  }

  // --- Ajout : Utiliser le hook pour griser/transparenter le menu après 5s sans survol sur desktop ---
  const uiFaded = useUiFade(5000);

  const [startZoomIn, stopZoomIn] = useContinuousAction(handleZoomIn, 90);
  const [startZoomOut, stopZoomOut] = useContinuousAction(handleZoomOut, 90);
  const [startAddAsteroid, stopAddAsteroid] = useContinuousAction(handleAddAsteroid, 110);

  return (
    <>
      <div
        id="ui"
        onMouseEnter={() => setIsUiHovered(true)}
        onMouseLeave={() => setIsUiHovered(false)}
        onTouchStart={() => setIsUiHovered(true)}
        onTouchEnd={() => setIsUiHovered(false)}
        className={`ui-main-panel${uiFaded ? ' ui-faded' : ''}`}
      >
        <div className="ui-toolbar">
          <button
            className="ui-btn ui-btn-decrease"
            onClick={handleDecreaseTimeSpeed}
            title="Diminuer la vitesse du temps"
            aria-label="Diminuer la vitesse du temps"
          >
            ⇠
          </button>
          <input
            type="range"
            min="0.05"
            max="256"
            step="0.01"
            value={timeSpeed}
            onChange={handleSliderChange}
            className="ui-slider"
          />
          <button
            className="ui-btn ui-btn-increase"
            onClick={handleIncreaseTimeSpeed}
            title="Augmenter la vitesse du temps"
            aria-label="Augmenter la vitesse du temps"
          >
            ⇢
          </button>
          {/* BADGES VITESSE */}
          <span className="ui-badge">
            {getSimulatedDaysPerSecond(timeSpeed)} j/s
          </span>
          <button
            className={`ui-btn ui-btn-pause${paused ? ' paused' : ''}`}
            onClick={() => setPaused(p => !p)}
            title="Pause / Lecture"
            aria-label="Pause / Lecture"
          >⏏︎</button>
          <button
            className="ui-btn ui-btn-reset"
            title="Réinitialiser la vitesse"
            aria-label="Vitesse normale"
            onClick={() => { setTimeSpeed(1); setPaused(false); }}
          >
            ♻︎
          </button>
        </div>
        <ErrorBoundary>
          <SolarSystemOptions
            asteroids={asteroids}
            onAddAsteroid={handleAddAsteroid}
            onRemoveAsteroid={handleRemoveAsteroid}
            startAddAsteroid={startAddAsteroid}
            stopAddAsteroid={stopAddAsteroid}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels(v => !v)}
          />
        </ErrorBoundary>
      </div>
      {/* --- BOUTONS ZOOM EN BAS À GAUCHE --- */}
      <div className="zoom-fab">
        <button
          className="ripple zoom-in"
          onMouseDown={e => { startZoomIn(); addRipple(e); }}
          onMouseUp={stopZoomIn}
          onMouseLeave={stopZoomIn}
          onTouchStart={e => { startZoomIn(); addRipple(e); }}
          onTouchEnd={stopZoomIn}
          aria-label="Zoomer"
          title="Zoomer"
        >
          ＋
        </button>
        <button
          className="ripple zoom-out"
          onMouseDown={e => { startZoomOut(); addRipple(e); }}
          onMouseUp={stopZoomOut}
          onMouseLeave={stopZoomOut}
          onTouchStart={e => { startZoomOut(); addRipple(e); }}
          onTouchEnd={stopZoomOut}
          aria-label="Dézoomer"
          title="Dézoomer"
        >
          －
        </button>
      </div>
      {/* --- BOTTOM RIGHT FLOATING BUTTON --- */}
      <div className="labels-fab">
        <button
          className={`ui-btn ui-btn-labels${showLabels ? ' show-labels' : ''}`}
          title={showLabels ? "Cacher les noms des astres" : "Afficher les noms des astres"}
          aria-label={showLabels ? "Cacher les noms des astres" : "Afficher les noms des astres"}
          onClick={() => setShowLabels(v => !v)}
        >
          {showLabels ? '👁️' : '🙈'}
        </button>
      </div>
      <Canvas
        style={{ width: '100vw', height: '100vh', cursor: dragging.current ? 'grabbing' : 'grab' }}
        onPointerDown={e => {
          if (isUiHovered) return;
          dragging.current = true;
          lastMouse.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerOut={() => { dragging.current = false; }}
        onPointerMove={e => {
          if (dragging.current && !isUiHovered) {
            setCameraCenter(c => ({
              x: c.x - (e.movementX * zoom * 0.06),
              y: c.y + (e.movementY * zoom * 0.06)
            }));
          }
        }}
      >
        <OrthographicCamera
          makeDefault
          position={[0, 0, 100]}
          left={-window.innerWidth / window.innerHeight * 40 * zoom + cameraCenter.x}
          right={window.innerWidth / window.innerHeight * 40 * zoom + cameraCenter.x}
          top={40 * zoom + cameraCenter.y}
          bottom={-40 * zoom + cameraCenter.y}
          near={0.1}
          far={1000}
        />
        <Stars count={1000} spread={3000} />
        <MilkyWay count={2000} length={3200} width={420} angle={Math.PI/6} />
        <SolarSystemView
          zoom={zoom}
          showLabels={showLabels}
          timeSpeed={timeSpeed}
          paused={paused}
          asteroids={asteroids}
          setAsteroids={setAsteroids}
        />
      </Canvas>
    </>
  );
}

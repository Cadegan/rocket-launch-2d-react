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
  ] },
  { name: 'Saturne', color: '#e7d9a7', orbit: 402.4, size: 2.1, speed: 0.007, gravityInfluence: 14, ecc: 0.056, moons: [
    { name: 'Titan', color: '#e0b96c', orbit: 20, size: 0.28, speed: 0.07, gravityInfluence: 1.1, ecc: 0.028 }
  ] },
  { name: 'Uranus', color: '#7de3f4', orbit: 805.6, size: 1.7, speed: 0.005, gravityInfluence: 9, ecc: 0.046 },
  { name: 'Neptune', color: '#4166f6', orbit: 1262.9, size: 1.7, speed: 0.004, gravityInfluence: 8, ecc: 0.010 }
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
        <Html position={[x, y + moon.size + 0.5, 0]} center style={{ color: '#fff', fontSize: '0.7rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity }}>{moon.name}</Html>
      )}
    </>
  );
}

function Planet({ color, orbit, size, speed, time, label, phase, moons = [], moonPhases = [], labelOpacity = 1, showLabels = true, gravityInfluence = 0, ecc }) {
  // Mouvement orbital avec phase initiale
  const angle = speed * time + phase;
  // Correction : utiliser la vraie excentricité
  const e = typeof ecc === 'number' ? ecc : 0;
  const a = orbit;
  // Centre du système = (0,0)
  const [x, y] = getEllipsePosition(0, 0, a, e, phase, angle-phase);
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
      {/* Planète */}
      <mesh position={[x, y, 0]}>
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color={color} transparent opacity={1} depthWrite={true} side={THREE.FrontSide} />
      </mesh>
      {/* Nom de la planète, en couleur */}
      {showLabels && (
        <Html position={[x, y + size + 0.7, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.85rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity }}>{label}</Html>
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
        <Html position={[pos[0], pos[1] + 1, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.8rem', textShadow: '1px 1px 3px #000', opacity: labelOpacity }}>{name}</Html>
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
    destroyed: false // <-- Correction : toujours false à la création
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
      destroyed: false // <-- Correction : toujours false à la création
    });
  }
  return arr;
}

function RealAsteroid({ a, e, phi, color, trailColor, t, name, systemRadius = 300, onEscape, onExplode }) {
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
      {name && (
        <Html position={[x, y + 0.7, 0]} center style={{ color: color, fontWeight: 'bold', fontSize: '0.85rem', textShadow: '1px 1px 3px #000', opacity: 1 }}>{name}</Html>
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
  useFrame((_, delta) => {
    if (!paused) setTime(t => t + delta * timeSpeed);
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
      const [x, y] = getEllipsePosition(0, 0, a, ecc, p.phase || 0, angle - p.phase);
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
      {planetsWithPos.map((p) => (
        <React.Fragment key={p.name}>
          <Orbit cx={0} cy={0} radius={p.orbit} ecc={p.ecc} phase={p.phase} />
          <Planet {...p} time={time} label={p.name} labelOpacity={labelOpacity} showLabels={showLabels} />
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
        <RealAsteroid key={ast.name || idx} {...ast} t={time} />
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
function SolarSystemOptions({ asteroids, onAddAsteroid, onRemoveAsteroid }) {
  // Style homogène avec le panneau principal UI
  return (
    <div style={{
      background: 'rgba(20,24,36,0.85)',
      borderRadius: 12,
      padding: '12px 18px 10px 18px',
      boxShadow: '0 4px 24px #0008',
      display: 'flex',
      alignItems: 'center',
      minWidth: 0,
      color: '#fff',
      fontSize: '1.08rem',
      fontFamily: 'inherit',
      userSelect: 'none',
      gap: 12,
      margin: 0
    }}>
      <span style={{ marginRight: 10 }}>Astéroïdes dynamiques :</span>
      <button
        onClick={onAddAsteroid}
        style={{
          fontSize: '1.2rem',
          margin: '0 2px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(90deg,#2a2,#4ad07a 80%)',
          color: '#fff',
          width: 32,
          height: 32,
          cursor: 'pointer',
          boxShadow: '0 1px 4px #0006',
          transition: 'background .2s'
        }}
        title="Ajouter un astéroïde"
        aria-label="Ajouter un astéroïde"
      >+
      </button>
      <button
        onClick={onRemoveAsteroid}
        style={{
          fontSize: '1.2rem',
          margin: '0 2px',
          borderRadius: 8,
          border: 'none',
          background: 'linear-gradient(90deg,#a22,#e05a5a 80%)',
          color: '#fff',
          width: 32,
          height: 32,
          cursor: 'pointer',
          boxShadow: '0 1px 4px #0006',
          transition: 'background .2s'
        }}
        title="Retirer un astéroïde"
        aria-label="Retirer un astéroïde"
      >-
      </button>
      <span style={{ marginLeft: 10, fontSize: '1.08rem', fontWeight: 600, minWidth: 18, textAlign: 'center', letterSpacing: 0.5 }}>{Array.isArray(asteroids) ? asteroids.filter(ast => !ast.destroyed).length : 0}</span>
    </div>
  );
}

export default function App() {
  const [status, setStatus] = React.useState('Appuyez sur "Lancer la fusée"');
  const [launched, setLaunched] = React.useState(false);
  const velocity = React.useRef(new THREE.Vector2(0, 0));
  // Système de zoom et pan
  const [zoom, setZoom] = React.useState(0.012); // valeur ultra-basse pour tout voir
  const [cameraCenter, setCameraCenter] = React.useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = React.useState(true);
  const [timeSpeed, setTimeSpeed] = React.useState(1); // 1 = normal, 0 = pause
  const [paused, setPaused] = React.useState(false);
  const [isUiHovered, setIsUiHovered] = React.useState(false);
  const dragging = React.useRef(false);
  const lastMouse = React.useRef({ x: 0, y: 0 });
  // Limites de zoom
  const MIN_ZOOM = 0.002; // Zoom encore plus large pour TOUT voir
  const MAX_ZOOM = 6; // Zoom encore plus loin

  // Gestion du zoom centré sur la souris
  React.useEffect(() => {
    function onWheel(e) {
      e.preventDefault();
      const rect = document.body.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Coordonnées monde avant zoom
      const aspect = w / h;
      const viewWidth = 80 * zoom;
      const viewHeight = 80 * zoom;
      const worldX = cameraCenter.x + (mouseX / w - 0.5) * viewWidth * aspect;
      const worldY = cameraCenter.y - (mouseY / h - 0.5) * viewHeight;
      // Appliquer zoom
      let newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom - e.deltaY * 0.0025));
      // Coordonnées monde après zoom
      const newViewWidth = 80 * newZoom;
      const newViewHeight = 80 * newZoom;
      // Calculer nouveau centre pour garder le point sous la souris fixe
      const newCenterX = worldX - (mouseX / w - 0.5) * newViewWidth * aspect;
      const newCenterY = worldY + (mouseY / h - 0.5) * newViewHeight;
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
    setZoom(z => Math.max(MIN_ZOOM, z / 1.25)); // Pour dézoomer (réduire le zoom)
  }

  function resetRocket() {
    setLaunched(false);
    setStatus('Appuyez sur "Lancer la fusée"');
  }
  function launchRocket() {
    if (!launched) {
      velocity.current.set(0, 0.6 + Math.random() * 0.2);
      setLaunched(true);
      setStatus('Fusée lancée !');
    }
  }
  function onOrbit() {
    setStatus('Bravo ! Orbite atteinte ?!');
    setLaunched(false);
  }

  // Contrôle du temps
  const DAY_SECONDS = 86400; // 1 jour = 86400 s

  function getSimulatedDaysPerSecond(timeSpeed) {
    return Number(timeSpeed).toFixed(2);
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
    // Correction : s’assurer que destroyed=false sur tout nouvel astéroïde
    const newAst = generateAsteroids(1)[0];
    newAst.destroyed = false;
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

  return (
    <>
      <div
        id="ui"
        onMouseEnter={() => setIsUiHovered(true)}
        onMouseLeave={() => setIsUiHovered(false)}
      >
        <h1>Rocket Launch 2D</h1>
        <button onClick={launchRocket}>Lancer la fusée</button>
        <p id="status">{status}</p>
        <div style={{marginTop:8}}>
          <button onClick={handleZoomIn} style={{marginRight:8}}>Zoom +</button>
          <button onClick={handleZoomOut}>Zoom -</button>
        </div>
        <div style={{marginTop:8}}>
          <button onClick={() => setShowLabels(v => !v)}>
            {showLabels ? 'Cacher les noms' : 'Afficher les noms'}
          </button>
        </div>
        <div style={{marginTop:16, display:'flex', gap:8, alignItems:'center'}}>
          <span style={{color:'#fff', fontSize:'1.2em', marginRight:6}}>⏪</span>
          <input type="range" min="0.05" max="64" step="0.01" value={timeSpeed}
            onChange={handleSliderChange} style={{width:120}} />
          <span style={{color:'#fff', fontSize:'1.2em', marginLeft:6}}>⏩</span>
          <button onClick={() => setPaused(p => !p)}>{paused ? '▶️' : '⏸️'}</button>
          <button title="Réinitialiser la vitesse" aria-label="Vitesse normale"
            onClick={() => { setTimeSpeed(1); setPaused(false); }}
            style={{fontWeight:'bold', fontSize:'1.1em'}}>
            🔄
          </button>
          <span style={{minWidth:60, color:'#fff', alignSelf:'center'}}>x{timeSpeed.toFixed(2)}</span>
          <span style={{color:'#7fd', fontSize:'1em', marginLeft:8}}>
            {getSimulatedDaysPerSecond(timeSpeed)} j/s
          </span>
        </div>
        {/* --- Panneau d’options astéroïdes dynamiques --- */}
        <div style={{marginTop:18}}>
          <SolarSystemOptions
            asteroids={asteroids}
            onAddAsteroid={handleAddAsteroid}
            onRemoveAsteroid={handleRemoveAsteroid}
          />
        </div>
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
              x: c.x - (e.movementX * zoom * 0.06), // drag encore plus doux
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

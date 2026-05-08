/**
 * configurador.js — Three.js 3D tag scene
 * Loaded as type="module". Uses Three.js r165 via CDN import map.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ─── Constants ─────────────────────────────────── */
const SIZES = {
  compacto: { w: 58, h: 58, d: 4 },
  grande:   { w: 70, h: 70, d: 4 }
};

const SCALE = 1 / 14; // mm → Three.js units

const PRESET_COLORS = {
  blanco:   '#F5F5F0',
  negro:    '#1A1A1A',
  gris:     '#8A8A8A',
  dorado:   '#C8A84B',
  plateado: '#B0B0B8',
  rojo:     '#C0392B'
};

/* ─── Scene Setup ────────────────────────────────── */
const canvas  = document.getElementById('cfg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#EAEAEE');

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 1.8, 6.5);

/* ─── Controls ───────────────────────────────────── */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enableZoom = false;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 2;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;

// Hide hint after first drag
let hintHidden = false;
controls.addEventListener('start', () => {
  if (!hintHidden) {
    hintHidden = true;
    document.querySelector('.cfg-preview-hint')?.classList.add('hidden');
  }
});

/* ─── Lighting ───────────────────────────────────── */
// Ambient
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// Key light (top-left)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(-4, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

// Fill light (opposite)
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(4, 4, -3);
scene.add(fillLight);

// Rim light (backlit glow)
const rimLight = new THREE.DirectionalLight(0xeef0ff, 0.4);
rimLight.position.set(0, -3, -6);
scene.add(rimLight);

/* ─── Ground shadow plane ────────────────────────── */
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.18, transparent: true })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -2.5;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

/* ─── Tag Group ──────────────────────────────────── */
const tagGroup = new THREE.Group();
scene.add(tagGroup);

let bodyMesh = null;
let engraveMesh = null;
let brandMesh = null;
let nfcMesh = null;

/* ─── Helpers ────────────────────────────────────── */
function hexToColor(hex) {
  return new THREE.Color(hex);
}

function darkenColor(hex, amount = 0.18) {
  const c = new THREE.Color(hex);
  const h = { r: 0, g: 0, b: 0 };
  c.getHSL(h);
  return new THREE.Color().setHSL(h.h, h.s, Math.max(0, h.l - amount));
}

/* Build a CanvasTexture with text or image */
function buildEngraveTexture(config) {
  const SIZE = 512;
  const offscreen = document.createElement('canvas');
  offscreen.width = SIZE;
  offscreen.height = SIZE;
  const ctx = offscreen.getContext('2d');

  // Background (transparent — the mesh material colour shows through)
  ctx.clearRect(0, 0, SIZE, SIZE);

  const hasPaint = config.paint && config.paintColor;
  const fillColor = hasPaint ? config.paintColor : '#00000033';

  if (config.logoMode === 'imagen' && config.logoImage) {
    // Draw uploaded image centred
    ctx.drawImage(config.logoImage, SIZE * 0.1, SIZE * 0.1, SIZE * 0.8, SIZE * 0.72);
  } else if ((config.logoMode === 'texto' || config.logoMode === 'imagen') && config.textoPersonalizado) {
    // Draw personalised text
    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = SIZE * 0.85;
    let fontSize = 88;
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;

    // Shrink to fit
    while (ctx.measureText(config.textoPersonalizado).width > maxWidth && fontSize > 20) {
      fontSize -= 4;
      ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    }

    ctx.fillText(config.textoPersonalizado, SIZE / 2, SIZE * 0.42);
    ctx.restore();
  }

  // Brand line at bottom
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.font = '500 26px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const brand = config.linkNegocio ? shortenUrl(config.linkNegocio) : 'revuTags.com';
  ctx.fillText(brand, SIZE / 2, SIZE * 0.88);
  ctx.restore();

  const tex = new THREE.CanvasTexture(offscreen);
  tex.needsUpdate = true;
  return tex;
}

function shortenUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 22);
  }
}

/* Build opaque engraving texture (solid colour for paint mode) */
function buildEngraveBackground(config) {
  const hasPaint = config.paint && config.paintColor;
  if (!hasPaint) return null;
  return null; // We use the material colour for the base
}

/* ─── Build / Rebuild Tag ────────────────────────── */
function buildTag(config) {
  // Remove old meshes
  tagGroup.clear();

  const sz = SIZES[config.tamano] || SIZES.grande;
  const W = sz.w * SCALE;
  const H = sz.h * SCALE;
  const D = sz.d * SCALE;
  const radius = 0.22; // corner radius in scene units

  const filamentColor = new THREE.Color(config.filamentColor || '#1A1A1A');

  /* Body */
  const bodyGeo = new RoundedBoxGeometry(W, D, H, 4, radius);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: filamentColor,
    roughness: 0.55,
    metalness: 0.08,
  });
  // Metallic overrides for special colours
  if (['#C8A84B', '#B0B0B8'].includes(config.filamentColor)) {
    bodyMat.metalness = 0.55;
    bodyMat.roughness = 0.3;
  }
  bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  tagGroup.add(bodyMesh);

  /* Engraved face plane */
  const engraveW = W * 0.82;
  const engraveH = H * 0.82;
  const engraveGeo = new THREE.PlaneGeometry(engraveW, engraveH);

  const hasPaint = config.paint && config.paintColor;
  const engraveBaseColor = hasPaint
    ? new THREE.Color(config.paintColor)
    : darkenColor(config.filamentColor || '#1A1A1A', 0.16);

  const engraveMat = new THREE.MeshStandardMaterial({
    color: engraveBaseColor,
    roughness: 0.7,
    metalness: 0.0,
    transparent: true,
    opacity: hasPaint ? 1.0 : 0.55,
  });
  engraveMesh = new THREE.Mesh(engraveGeo, engraveMat);
  engraveMesh.rotation.x = -Math.PI / 2;
  engraveMesh.position.set(0, D / 2 + 0.001, 0);
  tagGroup.add(engraveMesh);

  /* Text / logo overlay */
  const tex = buildEngraveTexture(config);
  const overlayMat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const overlayMesh = new THREE.Mesh(engraveGeo.clone(), overlayMat);
  overlayMesh.rotation.x = -Math.PI / 2;
  overlayMesh.position.set(0, D / 2 + 0.003, 0);
  tagGroup.add(overlayMesh);

  /* NFC indicator dot (subtle circle on bottom face) */
  const nfcGeo = new THREE.CircleGeometry(W * 0.12, 32);
  const nfcMat = new THREE.MeshStandardMaterial({
    color: darkenColor(config.filamentColor || '#1A1A1A', 0.12),
    roughness: 0.8,
    transparent: true,
    opacity: 0.4,
  });
  nfcMesh = new THREE.Mesh(nfcGeo, nfcMat);
  nfcMesh.rotation.x = Math.PI / 2;
  nfcMesh.position.set(0, -D / 2 - 0.001, 0);
  tagGroup.add(nfcMesh);

  // Subtle tilt for visual interest
  tagGroup.rotation.x = 0.12;
}

/* ─── Update existing tag (no rebuild) ──────────── */
function updateTagMaterials(config) {
  if (!bodyMesh) return;

  const filamentColor = new THREE.Color(config.filamentColor || '#1A1A1A');
  bodyMesh.material.color.set(filamentColor);
  if (['#C8A84B', '#B0B0B8'].includes(config.filamentColor)) {
    bodyMesh.material.metalness = 0.55;
    bodyMesh.material.roughness = 0.3;
  } else {
    bodyMesh.material.metalness = 0.08;
    bodyMesh.material.roughness = 0.55;
  }
  bodyMesh.material.needsUpdate = true;
}

/* ─── Public API ─────────────────────────────────── */
let currentConfig = {
  tamano: 'grande',
  filamentColor: '#1A1A1A',
  paint: false,
  paintColor: '#FFFFFF',
  logoMode: 'no',
  logoImage: null,
  logoFileName: '',
  textoPersonalizado: '',
  linkNegocio: ''
};

let rebuildQueued = false;
let textureQueued = false;

export function updateTag(patch) {
  const prev = { ...currentConfig };
  Object.assign(currentConfig, patch);

  const needsRebuild = prev.tamano !== currentConfig.tamano;
  const needsTexture = !needsRebuild;

  if (needsRebuild && !rebuildQueued) {
    rebuildQueued = true;
    requestAnimationFrame(() => {
      rebuildQueued = false;
      buildTag(currentConfig);
    });
  } else if (needsTexture && !textureQueued) {
    textureQueued = true;
    requestAnimationFrame(() => {
      textureQueued = false;
      // Rebuild for simplicity (fast enough)
      buildTag(currentConfig);
    });
  }
}

export function getScreenshot() {
  // Force render before capture
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

/* ─── Resize Handler ─────────────────────────────── */
function onResize() {
  const el = canvas.parentElement;
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const ro = new ResizeObserver(onResize);
ro.observe(canvas.parentElement);
onResize();

/* ─── Render Loop ────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ─── Init ───────────────────────────────────────── */
buildTag(currentConfig);
animate();

// Signal ready
document.querySelector('.cfg-loading')?.classList.add('done');
setTimeout(() => document.querySelector('.cfg-loading')?.remove(), 600);

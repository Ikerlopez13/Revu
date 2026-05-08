/**
 * configurador.js — Three.js 3D tag scene using real STL model
 * Loads the actual printed tag STL, applies physical materials and
 * projects text/logo as a canvas texture on the top face.
 */
import * as THREE from 'three';
import { OrbitControls }  from 'three/addons/controls/OrbitControls.js';
import { STLLoader }      from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ─── Canvas & Renderer ─────────────────────────── */
const canvas   = document.getElementById('cfg-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true   // needed for screenshot
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.outputColorSpace   = THREE.SRGBColorSpace;
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

/* ─── Scene ──────────────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color('#DDDDE2');

/* ─── Environment (RoomEnvironment = studio reflections) ── */
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const roomEnv = new RoomEnvironment(renderer);
const envTexture = pmremGenerator.fromScene(roomEnv).texture;
scene.environment = envTexture;   // reflections on physical material
scene.background  = new THREE.Color('#DDDDE2');
roomEnv.dispose();
pmremGenerator.dispose();

/* ─── Camera ─────────────────────────────────────── */
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
camera.position.set(0, 60, 160);

/* ─── Controls ───────────────────────────────────── */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping    = true;
controls.dampingFactor    = 0.07;
controls.enableZoom       = false;
controls.enablePan        = false;
controls.minPolarAngle    = Math.PI / 8;
controls.maxPolarAngle    = Math.PI / 2.1;
controls.autoRotate       = true;
controls.autoRotateSpeed  = 1.0;
controls.target.set(0, 5, 0);

controls.addEventListener('start', () => {
  document.querySelector('.cfg-preview-hint')?.classList.add('hidden');
});

/* ─── Lighting ───────────────────────────────────── */
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
keyLight.position.set(-60, 120, 80);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near   = 1;
keyLight.shadow.camera.far    = 400;
keyLight.shadow.camera.left   = -120;
keyLight.shadow.camera.right  = 120;
keyLight.shadow.camera.top    = 120;
keyLight.shadow.camera.bottom = -120;
keyLight.shadow.bias          = -0.0004;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xeeeeff, 0.6);
fillLight.position.set(80, 60, -60);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xfff0dd, 0.35);
rimLight.position.set(0, -40, -100);
scene.add(rimLight);

/* ─── Ground shadow plane ────────────────────────── */
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.ShadowMaterial({ opacity: 0.22, transparent: true })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.5;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

/* ─── State ──────────────────────────────────────── */
let currentConfig = {
  filamentColor:    '#F5F5F0',
  paint:            false,
  paintColor:       '#FFFFFF',
  logoMode:         'no',
  logoImage:        null,
  logoFileName:     '',
  textoPersonalizado: '',
  linkNegocio:      ''
};

/* ─── Tag Group ──────────────────────────────────── */
const tagGroup = new THREE.Group();
scene.add(tagGroup);

let tagMesh       = null;   // the STL body mesh
let overlayMesh   = null;   // canvas texture plane on top face
let tagBBox       = null;   // bounding box after loading

/* ─── Material helpers ───────────────────────────── */
function makeTagMaterial(hex) {
  const color = new THREE.Color(hex);

  // Detect metallic presets
  const isGold    = hex === '#C8A84B';
  const isSilver  = hex === '#B0B0B8';
  const isMetallic = isGold || isSilver;

  return new THREE.MeshPhysicalMaterial({
    color,
    roughness:    isMetallic ? 0.25 : 0.50,
    metalness:    isMetallic ? 0.70 : 0.05,
    clearcoat:    isMetallic ? 0.20 : 0.40,      // plastic sheen
    clearcoatRoughness: 0.35,
    reflectivity: 0.4,
    envMapIntensity: isMetallic ? 1.2 : 0.7,
  });
}

/* ─── Canvas texture for text / logo overlay ──────── */
function shortenUrl(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch { return url.slice(0, 24); }
}

function buildOverlayTexture(config, faceWidthMM, faceHeightMM) {
  const PX = 1024;
  const PY = Math.round(PX * (faceHeightMM / faceWidthMM));

  const off = document.createElement('canvas');
  off.width  = PX;
  off.height = PY;
  const ctx  = off.getContext('2d');

  ctx.clearRect(0, 0, PX, PY);

  const hasPaint = config.paint && config.paintColor;
  const inkColor = hasPaint ? config.paintColor : 'rgba(0,0,0,0.55)';

  // ── Logo / texto centrado ──────────────────────────
  if (config.logoMode === 'imagen' && config.logoImage) {
    // Draw uploaded image, centred, scaled to 70% of face
    const imgW = PX * 0.70;
    const imgH = PY * 0.60;
    const imgX = (PX - imgW) / 2;
    const imgY = (PY - imgH) / 2 - PY * 0.04;

    ctx.globalAlpha = hasPaint ? 1.0 : 0.6;
    ctx.drawImage(config.logoImage, imgX, imgY, imgW, imgH);
    ctx.globalAlpha = 1.0;

  } else if (config.textoPersonalizado) {
    ctx.save();
    ctx.fillStyle  = inkColor;
    ctx.textAlign  = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor   = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur    = 6;
    ctx.shadowOffsetY = 3;

    const maxW    = PX * 0.84;
    let fontSize  = 140;
    ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(config.textoPersonalizado).width > maxW && fontSize > 28) {
      fontSize -= 6;
      ctx.font = `800 ${fontSize}px Inter, system-ui, sans-serif`;
    }
    ctx.fillText(config.textoPersonalizado, PX / 2, PY * 0.43);
    ctx.restore();
  }

  // ── Brand link at bottom ───────────────────────────
  const brand = config.linkNegocio ? shortenUrl(config.linkNegocio) : 'revuTags.com';
  ctx.save();
  ctx.fillStyle    = inkColor;
  ctx.font         = `500 ${Math.round(PX * 0.042)}px Inter, system-ui, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha  = 0.55;
  ctx.fillText(brand, PX / 2, PY * 0.88);
  ctx.restore();

  const tex = new THREE.CanvasTexture(off);
  tex.needsUpdate = true;
  return tex;
}

/* ─── Overlay mesh (canvas plane on top face) ─────── */
function buildOverlayMesh(config) {
  if (!tagBBox) return;

  // Remove existing overlay
  if (overlayMesh) { tagGroup.remove(overlayMesh); overlayMesh.geometry.dispose(); }

  const size   = tagBBox.getSize(new THREE.Vector3());
  const center = tagBBox.getCenter(new THREE.Vector3());

  // Face width/height in scene units → pass same ratio to texture
  const faceW = size.x * 0.82;
  const faceH = size.z * 0.82;

  const tex = buildOverlayTexture(config, faceW, faceH);

  const hasPaint = config.paint && config.paintColor;

  const mat = new THREE.MeshBasicMaterial({
    map:         tex,
    transparent: true,
    depthWrite:  false,
    opacity:     hasPaint ? 1.0 : 0.85,
  });

  const geo = new THREE.PlaneGeometry(faceW, faceH);
  overlayMesh = new THREE.Mesh(geo, mat);
  overlayMesh.rotation.x = -Math.PI / 2;
  overlayMesh.position.set(
    center.x,
    tagBBox.max.y + 0.3,   // slightly above top face
    center.z
  );
  overlayMesh.renderOrder = 1;
  tagGroup.add(overlayMesh);
}

/* ─── Load STL ───────────────────────────────────── */
function loadSTL() {
  const loader = new STLLoader();

  loader.load(
    '/assets/tag-revu.stl',

    (geometry) => {
      // Centre geometry at origin
      geometry.computeBoundingBox();
      const box    = geometry.boundingBox;
      const centre = box.getCenter(new THREE.Vector3());
      geometry.translate(-centre.x, -box.min.y, -centre.z);   // sit on Y=0

      geometry.computeVertexNormals();

      const mat  = makeTagMaterial(currentConfig.filamentColor);
      tagMesh = new THREE.Mesh(geometry, mat);
      tagMesh.castShadow    = true;
      tagMesh.receiveShadow = true;

      tagGroup.add(tagMesh);

      // Store bounding box in world space (after translation)
      geometry.computeBoundingBox();
      tagBBox = geometry.boundingBox.clone();

      // Adjust camera & controls target based on model height
      const size = tagBBox.getSize(new THREE.Vector3());
      const maxD = Math.max(size.x, size.y, size.z);
      camera.position.set(0, maxD * 0.9, maxD * 2.8);
      controls.target.set(0, size.y * 0.4, 0);
      controls.update();

      // Build text overlay
      buildOverlayMesh(currentConfig);

      // Signal ready
      const loading = document.getElementById('cfg-loading');
      if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => loading.remove(), 500);
      }
    },

    // Progress
    (xhr) => {
      const pct = Math.round((xhr.loaded / xhr.total) * 100);
      const txt = document.querySelector('.cfg-loading-text');
      if (txt) txt.textContent = `Cargando modelo 3D… ${pct}%`;
    },

    // Error
    (err) => {
      console.error('STL load error:', err);
      const txt = document.querySelector('.cfg-loading-text');
      if (txt) txt.textContent = 'Error al cargar el modelo. Recarga la página.';
    }
  );
}

/* ─── Public API ─────────────────────────────────── */
let overlayDebounce;

export function updateTag(patch) {
  Object.assign(currentConfig, patch);

  // Update body material colour immediately
  if (tagMesh) {
    const mat = makeTagMaterial(currentConfig.filamentColor);
    tagMesh.material.dispose();
    tagMesh.material = mat;
  }

  // Debounce overlay rebuild (canvas ops can be slow)
  clearTimeout(overlayDebounce);
  overlayDebounce = setTimeout(() => buildOverlayMesh(currentConfig), 80);
}

export function getScreenshot() {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

/* ─── Resize ─────────────────────────────────────── */
function onResize() {
  const el = canvas.parentElement;
  const w  = el.clientWidth;
  const h  = el.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(onResize).observe(canvas.parentElement);
onResize();

/* ─── Render loop ────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ─── Init ───────────────────────────────────────── */
loadSTL();
animate();

/**
 * configurador.js — STL loader + engraving area detection (fixed)
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ─── Renderer ───────────────────────────────────── */
const canvas = document.getElementById('cfg-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

/* ─── Scene + Environment ────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color('#DDDDE2');

const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const roomEnv = new RoomEnvironment(renderer);
scene.environment = pmrem.fromScene(roomEnv).texture;
roomEnv.dispose();
pmrem.dispose();

/* ─── Camera ─────────────────────────────────────── */
const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 500);
camera.position.set(0, 60, 160);

/* ─── Controls ───────────────────────────────────── */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enableZoom = false;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 8;
controls.maxPolarAngle = Math.PI / 2.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;
controls.addEventListener('start', () =>
  document.querySelector('.cfg-preview-hint')?.classList.add('hidden'));

/* ─── Lighting ───────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(-60, 120, 80);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -120;
key.shadow.camera.right = key.shadow.camera.top = 120;
key.shadow.camera.far = 400;
key.shadow.bias = -0.0004;
scene.add(key);

const fill = new THREE.DirectionalLight(0xeeeeff, 0.6);
fill.position.set(80, 60, -60);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xfff0dd, 0.35);
rim.position.set(0, -40, -100);
scene.add(rim);

/* ─── Ground ─────────────────────────────────────── */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(600, 600),
  new THREE.ShadowMaterial({ opacity: 0.22, transparent: true })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

/* ─── State ──────────────────────────────────────── */
let cfg = {
  filamentColor: '#1A1A1A',
  paint: false,
  paintColor: '#1565C0',
  logoMode: 'no',
  logoImage: null,
  logoFileName: '',
  textoPersonalizado: '',
  linkNegocio: ''
};

/* ─── Tag group ──────────────────────────────────── */
const tagGroup = new THREE.Group();
scene.add(tagGroup);

let tagMesh = null;
let paintMesh = null;
let overlayMesh = null;
let engravingInfo = null;

/* ─── Detect engraving area (FIXED) ─────────────────
 * Only looks at the TOP face (y > 70% of maxY) to avoid
 * detecting the NFC hole on the back face.
 * Also excludes the outer border/frame area by requiring
 * vertices to be within the inner 80% of XZ bounds.
 * The result is the star engraving zone, centered on top.
 ─────────────────────────────────────────────────── */
function detectEngraving(geometry) {
  const pos = geometry.attributes.position;
  const bbox = new THREE.Box3().setFromBufferAttribute(pos);
  const maxY = bbox.max.y;
  const tagW = bbox.max.x - bbox.min.x;
  const tagD = bbox.max.z - bbox.min.z;

  // Inner 80% of XZ — excludes border/frame vertices
  const xMargin = tagW * 0.10;
  const zMargin = tagD * 0.10;
  const xMin = bbox.min.x + xMargin;
  const xMax = bbox.max.x - xMargin;
  const zMin = bbox.min.z + zMargin;
  const zMax = bbox.max.z - zMargin;

  // Only consider top 40% of tag height to exclude back face features
  const yThreshold = maxY * 0.60;

  const RECESS_MIN = 0.05;
  const RECESS_MAX = 3.5;

  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  let floorY = -Infinity;
  let count = 0;

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);

    // Must be on the top face
    if (y < yThreshold) continue;

    const depth = maxY - y;
    if (depth < RECESS_MIN || depth > RECESS_MAX) continue;

    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Must be inside the inner area (not on the border)
    if (x < xMin || x > xMax || z < zMin || z > zMax) continue;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
    if (y > floorY) floorY = y;
    count++;
  }

  if (count < 10) return null;

  return {
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    w: maxX - minX,
    h: maxZ - minZ,
    y: floorY + 0.12
  };
}

/* ─── Material ───────────────────────────────────── */
function makeMat(hex) {
  const c = new THREE.Color(hex);
  const metallic = ['#C8A84B', '#B0B0B8'].includes(hex);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: metallic ? 0.25 : 0.50,
    metalness: metallic ? 0.70 : 0.05,
    clearcoat: 0.40,
    clearcoatRoughness: 0.35,
    envMapIntensity: metallic ? 1.2 : 0.7,
  });
}

/* ─── Canvas texture ─────────────────────────────── */
function shortenUrl(url) {
  try { return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, ''); }
  catch { return url.slice(0, 24); }
}

function buildCanvas(config, wUnits, hUnits) {
  const PX = 1024;
  const PY = Math.max(64, Math.round(PX * (hUnits / Math.max(wUnits, 0.01))));
  const c = document.createElement('canvas');
  c.width = PX;
  c.height = PY;
  const ctx = c.getContext('2d');

  const hasPaint = config.paint && config.paintColor;
  const inkColor = hasPaint ? contrastColor(config.paintColor) : 'rgba(255,255,255,0.85)';

  if (hasPaint) {
    ctx.fillStyle = config.paintColor;
    ctx.fillRect(0, 0, PX, PY);
  }

  // Logo ocupa la zona superior (~75% de altura), bien centrado
  if (config.logoMode === 'imagen' && config.logoImage) {
    const padX = PX * 0.06;
    const padY = PY * 0.05;
    const imgH = PY * 0.70;
    const imgW = PX - padX * 2;
    // Draw image maintaining aspect ratio, centered
    const imgAspect = config.logoImage.naturalWidth / config.logoImage.naturalHeight;
    const boxAspect = imgW / imgH;
    let dw, dh, dx, dy;
    if (imgAspect > boxAspect) {
      dw = imgW; dh = imgW / imgAspect;
      dx = padX; dy = padY + (imgH - dh) / 2;
    } else {
      dh = imgH; dw = imgH * imgAspect;
      dx = (PX - dw) / 2; dy = padY;
    }
    ctx.globalAlpha = 1.0;
    ctx.drawImage(config.logoImage, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  } else if (config.textoPersonalizado) {
    ctx.save();
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    let fs = 160;
    ctx.font = `800 ${fs}px Inter, system-ui, sans-serif`;
    while (ctx.measureText(config.textoPersonalizado).width > PX * 0.86 && fs > 28) {
      fs -= 6;
      ctx.font = `800 ${fs}px Inter, system-ui, sans-serif`;
    }
    ctx.fillText(config.textoPersonalizado, PX / 2, PY * 0.43);
    ctx.restore();
  }

  // Brand / link — parte inferior del overlay
  const brand = config.linkNegocio ? shortenUrl(config.linkNegocio) : 'revuTags.com';
  ctx.save();
  ctx.fillStyle = inkColor;
  ctx.font = `500 ${Math.round(PX * 0.044)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = hasPaint ? 0.75 : 0.55;
  ctx.fillText(brand, PX / 2, PY * 0.90);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function contrastColor(hex) {
  const c = new THREE.Color(hex);
  const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return lum > 0.45 ? '#111111' : '#FFFFFF';
}

/* ─── Build / update overlay meshes ─────────────── */
function rebuildOverlay() {
  if (!engravingInfo) return;

  const ei = engravingInfo;

  if (paintMesh) { tagGroup.remove(paintMesh); paintMesh.geometry.dispose(); paintMesh.material.dispose(); }
  if (overlayMesh) { tagGroup.remove(overlayMesh); overlayMesh.geometry.dispose(); overlayMesh.material.map?.dispose(); overlayMesh.material.dispose(); }

  // Use full detected engraving bounds
  const W = ei.w;
  const H = ei.h;

  // Paint fill
  if (cfg.paint && cfg.paintColor) {
    const paintMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.paintColor),
      roughness: 0.55,
      metalness: 0.0,
    });
    paintMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), paintMat);
    paintMesh.rotation.x = -Math.PI / 2;
    paintMesh.position.set(ei.cx, ei.y, ei.cz);
    paintMesh.renderOrder = 1;
    tagGroup.add(paintMesh);
  } else {
    paintMesh = null;
  }

  // Logo / text overlay — same position and size as engraving
  const tex = buildCanvas(cfg, W, H);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
  overlayMesh.rotation.x = -Math.PI / 2;
  overlayMesh.position.set(ei.cx, ei.y + 0.08, ei.cz);
  overlayMesh.renderOrder = 2;
  tagGroup.add(overlayMesh);
}

/* ─── Load STL ───────────────────────────────────── */
function loadSTL() {
  new STLLoader().load(
    '/assets/tag-revu.stl',
    (geo) => {
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      const cx = (box.min.x + box.max.x) / 2;
      const cz = (box.min.z + box.max.z) / 2;
      geo.translate(-cx, -box.min.y, -cz);

      geo.computeVertexNormals();

      tagMesh = new THREE.Mesh(geo, makeMat(cfg.filamentColor));
      tagMesh.castShadow = tagMesh.receiveShadow = true;
      tagGroup.add(tagMesh);

      geo.computeBoundingBox();
      const b = geo.boundingBox;
      const size = b.getSize(new THREE.Vector3());

      // Try to detect engraving — fallback to safe inner top area
      engravingInfo = detectEngraving(geo) || {
        cx: 0,
        cz: 0,
        w: size.x * 0.68,
        h: size.z * 0.68,
        y: b.max.y - 0.5
      };

      // Fit camera
      const d = Math.max(size.x, size.y, size.z);
      camera.position.set(0, d * 0.9, d * 2.8);
      controls.target.set(0, size.y * 0.4, 0);
      controls.update();

      rebuildOverlay();

      const el = document.getElementById('cfg-loading');
      if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }
    },
    (xhr) => {
      const txt = document.querySelector('.cfg-loading-text');
      if (txt && xhr.total) txt.textContent = `Cargando modelo… ${Math.round(xhr.loaded / xhr.total * 100)}%`;
    },
    (err) => {
      console.error(err);
      const txt = document.querySelector('.cfg-loading-text');
      if (txt) txt.textContent = 'Error al cargar el modelo.';
    }
  );
}

/* ─── Public API ─────────────────────────────────── */
let overlayTimer;
export function updateTag(patch) {
  Object.assign(cfg, patch);

  if (tagMesh) {
    tagMesh.material.dispose();
    tagMesh.material = makeMat(cfg.filamentColor);
  }

  clearTimeout(overlayTimer);
  overlayTimer = setTimeout(rebuildOverlay, 80);
}

export function getScreenshot() {
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
}

/* ─── Resize ─────────────────────────────────────── */
function onResize() {
  const { clientWidth: w, clientHeight: h } = canvas.parentElement;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(onResize).observe(canvas.parentElement);
onResize();

/* ─── Loop ───────────────────────────────────────── */
(function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); })();

loadSTL();
# Campus Guide Code Bundle

## index.html

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover"
    />
    <title>文化祭 校内案内図 | WebGL</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <aside class="info-panel">
        <div class="panel-glow" aria-hidden="true"></div>
        <header class="hero">
          <p class="eyebrow">Cultural Festival / 3D Campus Guide</p>
          <h1>文化祭 校内案内図</h1>
          <p class="hero-copy">
            提供された平面図をもとに、各階を立体的に積層した案内サイトです。
            WebGL を使って自由に回転・拡大しながら、見たいフロアや企画場所を確認できます。
          </p>
        </header>

        <section class="panel-section" aria-labelledby="view-heading">
          <div class="section-head">
            <h2 id="view-heading">視点操作</h2>
            <div class="section-actions">
              <button id="topView" type="button" class="ghost-button">
                真上から見る
              </button>
              <button id="resetView" type="button" class="ghost-button">
                視点を戻す
              </button>
            </div>
          </div>
          <p class="section-note">
            3D 上のフロアや教室の場所を直接クリックすると、その場所の案内を表示します。
          </p>
        </section>

        <section class="panel-section" aria-labelledby="control-heading">
          <h2 id="control-heading">表示設定</h2>
          <div class="toggle-grid">
            <label class="toggle-card">
              <input id="explodeToggle" type="checkbox" checked />
              <span>階を分離表示</span>
              <small>各フロアを離して見やすく表示</small>
            </label>
            <label class="toggle-card">
              <input id="pinsToggle" type="checkbox" checked />
              <span>案内ピンを表示</span>
              <small>受付・飲食・展示などを強調</small>
            </label>
            <label class="toggle-card">
              <input id="labelsToggle" type="checkbox" checked />
              <span>ラベルを表示</span>
              <small>フロア名と案内名を常時表示</small>
            </label>
          </div>
        </section>

        <section class="panel-section current-floor" aria-labelledby="current-heading">
          <h2 id="current-heading">選択した場所</h2>
          <div id="floorSummary" class="summary-card"></div>
          <div id="poiList" class="poi-list" role="list"></div>
        </section>

        <section class="panel-section legend-section" aria-labelledby="legend-heading">
          <h2 id="legend-heading">凡例</h2>
          <div id="legend" class="legend"></div>
          <p class="caption">
            ドラッグで回転、ホイールで拡大縮小、地図上の教室や案内場所をクリックで説明を表示します。
          </p>
        </section>

        <footer class="panel-footer">
          OpenGL 系の Web 表示はブラウザ上では <strong>WebGL</strong> で実行しています。
        </footer>
      </aside>

      <main class="scene-panel">
        <div class="scene-toolbar">
          <span class="status-dot" aria-hidden="true"></span>
          <span>WebGL / Three.js (MIT)</span>
          <span class="toolbar-divider" aria-hidden="true"></span>
          <span id="selectionHint">1階を表示中</span>
        </div>
        <div id="canvasHost" class="canvas-host" aria-label="3D 校内案内図"></div>
        <div id="hoverCard" class="hover-card is-hidden" role="status" aria-live="polite"></div>
      </main>
    </div>

    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.176.0/build/three.module.js",
          "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/"
        }
      }
    </script>
    <script type="module" src="./src/main.js"></script>
  </body>
</html>
```

## styles.css

```css
:root {
  color-scheme: light;
  --paper: #f6efdf;
  --paper-strong: #fffaf2;
  --ink: #1d1a17;
  --ink-soft: rgba(29, 26, 23, 0.72);
  --line: rgba(29, 26, 23, 0.12);
  --card: rgba(255, 250, 242, 0.84);
  --card-strong: rgba(255, 252, 247, 0.96);
  --accent-red: #d94b3d;
  --accent-green: #2a8c63;
  --accent-blue: #386ef2;
  --accent-gold: #d59a1a;
  --accent-purple: #6e5494;
  --shadow: 0 28px 60px rgba(27, 22, 16, 0.14);
  --ui-font: "BIZ UDPGothic", "Yu Gothic UI", "Yu Gothic", "Meiryo",
    sans-serif;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  font-family: var(--ui-font);
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(217, 75, 61, 0.14), transparent 28rem),
    radial-gradient(circle at bottom right, rgba(42, 140, 99, 0.16), transparent 26rem),
    linear-gradient(160deg, #f4ebd9 0%, #f8f4eb 42%, #e9efe7 100%);
}

body {
  overflow: hidden;
}

.page-shell {
  display: grid;
  grid-template-columns: minmax(18rem, 24rem) 1fr;
  min-height: 100vh;
}

.info-panel {
  position: relative;
  overflow: auto;
  padding: 1.5rem;
  border-right: 1px solid rgba(29, 26, 23, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 251, 246, 0.92), rgba(247, 239, 224, 0.88)),
    repeating-linear-gradient(
      -35deg,
      rgba(217, 75, 61, 0.06),
      rgba(217, 75, 61, 0.06) 1px,
      transparent 1px,
      transparent 18px
    );
  backdrop-filter: blur(10px);
}

.panel-glow {
  position: absolute;
  inset: 0 auto auto 0;
  width: 15rem;
  height: 15rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(213, 154, 26, 0.24), transparent 72%);
  pointer-events: none;
}

.hero {
  position: relative;
  z-index: 1;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--accent-red);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.78rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.9rem, 3vw, 2.6rem);
  line-height: 1.05;
}

.hero-copy {
  margin: 0.85rem 0 0;
  line-height: 1.75;
  color: var(--ink-soft);
  font-size: 0.97rem;
}

.panel-section {
  position: relative;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 1.1rem;
  background: linear-gradient(180deg, var(--card-strong), rgba(249, 241, 230, 0.82));
  box-shadow: 0 12px 28px rgba(32, 25, 17, 0.08);
}

.panel-section h2 {
  margin: 0 0 0.85rem;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
}

.section-head h2 {
  margin: 0;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.55rem;
}

.section-note {
  margin: 0;
  color: var(--ink-soft);
  line-height: 1.7;
  font-size: 0.92rem;
}

.ghost-button {
  border: 1px solid rgba(29, 26, 23, 0.14);
  border-radius: 999px;
  padding: 0.65rem 0.9rem;
  background: rgba(255, 255, 255, 0.68);
  color: var(--ink);
  font: inherit;
  font-size: 0.86rem;
  cursor: pointer;
  transition:
    transform 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease;
}

.ghost-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(29, 26, 23, 0.22);
}

.toggle-grid {
  display: grid;
  gap: 0.7rem;
}

.toggle-card {
  display: grid;
  gap: 0.25rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.56);
  cursor: pointer;
}

.toggle-card span {
  font-weight: 700;
}

.toggle-card small {
  color: var(--ink-soft);
  line-height: 1.55;
}

.toggle-card input {
  margin: 0 0 0.3rem;
  accent-color: var(--accent-red);
}

.summary-card {
  padding: 1rem;
  border-radius: 1rem;
  background:
    linear-gradient(135deg, rgba(217, 75, 61, 0.12), rgba(255, 255, 255, 0.92)),
    rgba(255, 255, 255, 0.92);
}

.summary-card h3 {
  margin: 0.45rem 0 0.35rem;
  font-size: 1.05rem;
}

.summary-card p {
  margin: 0;
  color: var(--ink-soft);
  line-height: 1.7;
  font-size: 0.92rem;
  white-space: pre-line;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  font-size: 0.78rem;
  font-weight: 700;
}

.summary-pill::before {
  content: "";
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--accent-red);
}

.poi-list {
  display: grid;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.poi-item {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.56);
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.poi-item:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 110, 242, 0.26);
  box-shadow: 0 14px 24px rgba(21, 42, 86, 0.08);
}

.poi-item.is-active {
  border-color: rgba(56, 110, 242, 0.38);
  background:
    linear-gradient(180deg, rgba(56, 110, 242, 0.12), rgba(255, 255, 255, 0.88)),
    rgba(255, 255, 255, 0.88);
}

.poi-item h3 {
  margin: 0;
  font-size: 0.97rem;
}

.poi-item p {
  margin: 0;
  color: var(--ink-soft);
  line-height: 1.55;
  font-size: 0.88rem;
  white-space: pre-line;
}

.poi-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  font-weight: 700;
}

.tag::before {
  content: "";
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 50%;
  background: var(--tag-color, var(--accent-red));
}

.poi-meta strong {
  font-size: 0.75rem;
  color: var(--ink-soft);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.caption {
  margin: 0.85rem 0 0;
  font-size: 0.88rem;
  line-height: 1.65;
  color: var(--ink-soft);
}

.panel-footer {
  padding: 0 0.4rem 2rem;
  line-height: 1.6;
  color: rgba(29, 26, 23, 0.66);
  font-size: 0.84rem;
}

.scene-panel {
  position: relative;
  overflow: hidden;
}

.scene-panel::before,
.scene-panel::after {
  content: "";
  position: absolute;
  inset: auto;
  pointer-events: none;
}

.scene-panel::before {
  top: -6rem;
  right: -6rem;
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 75, 61, 0.16), transparent 72%);
}

.scene-panel::after {
  bottom: -8rem;
  left: -8rem;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 110, 242, 0.14), transparent 70%);
}

.scene-toolbar {
  position: absolute;
  top: 1.1rem;
  left: 1.1rem;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(29, 26, 23, 0.08);
  border-radius: 999px;
  background: rgba(255, 251, 245, 0.78);
  backdrop-filter: blur(12px);
  box-shadow: 0 16px 28px rgba(27, 22, 16, 0.08);
  font-size: 0.88rem;
}

.status-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: linear-gradient(180deg, #2a8c63, #1d5d43);
  box-shadow: 0 0 0 0.22rem rgba(42, 140, 99, 0.18);
}

.toolbar-divider {
  width: 1px;
  height: 1.1rem;
  background: rgba(29, 26, 23, 0.14);
}

.canvas-host,
.canvas-host canvas,
.label-renderer {
  width: 100%;
  height: 100%;
}

.canvas-host {
  position: relative;
  min-height: 100vh;
}

.canvas-host canvas {
  display: block;
  cursor: grab;
}

.canvas-host canvas:active {
  cursor: grabbing;
}

.label-renderer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hover-card {
  position: absolute;
  z-index: 5;
  max-width: min(18rem, calc(100vw - 2rem));
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  border: 1px solid rgba(29, 26, 23, 0.08);
  background: rgba(255, 252, 247, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow);
  transform: translate3d(0, 0, 0);
  pointer-events: none;
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.hover-card strong {
  display: block;
  margin-bottom: 0.2rem;
}

.hover-card p {
  margin: 0;
  line-height: 1.55;
  color: var(--ink-soft);
  font-size: 0.86rem;
  white-space: pre-line;
}

.hover-card.is-hidden {
  opacity: 0;
  transform: translate3d(0, 0.35rem, 0);
}

.label-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.38rem 0.62rem;
  border: 1px solid rgba(29, 26, 23, 0.12);
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.94);
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 10px 18px rgba(18, 16, 12, 0.1);
}

.label-badge::before {
  content: "";
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--accent, var(--accent-red));
}

.label-badge.is-floor {
  padding: 0.48rem 0.72rem;
  font-size: 0.8rem;
  background: rgba(29, 26, 23, 0.84);
  color: #fff7ef;
  border-color: rgba(255, 255, 255, 0.12);
}

.label-badge.is-floor::before {
  box-shadow: 0 0 0 0.22rem rgba(255, 255, 255, 0.12);
}

.label-badge.is-muted {
  opacity: 0.46;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(0.85rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero,
.panel-section {
  animation: floatIn 560ms ease both;
}

.panel-section:nth-of-type(2) {
  animation-delay: 80ms;
}

.panel-section:nth-of-type(3) {
  animation-delay: 140ms;
}

.panel-section:nth-of-type(4) {
  animation-delay: 200ms;
}

@media (max-width: 980px) {
  body {
    overflow: auto;
  }

  .page-shell {
    grid-template-columns: 1fr;
  }

  .info-panel {
    border-right: 0;
    border-bottom: 1px solid rgba(29, 26, 23, 0.08);
  }

  .scene-panel {
    min-height: 72vh;
  }

  .canvas-host {
    min-height: 72vh;
  }
}

@media (max-width: 720px) {
  .info-panel {
    padding: 1rem;
  }

  .scene-toolbar {
    left: 0.8rem;
    right: 0.8rem;
    width: auto;
    justify-content: space-between;
    border-radius: 1rem;
  }

  .panel-section,
  .summary-card,
  .poi-item,
  .toggle-card {
    border-radius: 0.95rem;
  }

  .scene-panel {
    min-height: 64vh;
  }

  .canvas-host {
    min-height: 64vh;
  }
}
```

## src/main.js

```js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

import { CATEGORY_META, FLOOR_DATA } from "./floorData.js";

const config = {
  floorScale: 0.0155,
  floorGapExploded: 3.15,
  floorGapStacked: 1.28,
  slabThickness: 0.3,
  baseCameraPosition: new THREE.Vector3(11.6, 10.6, 15.2),
};

const dom = {
  canvasHost: document.querySelector("#canvasHost"),
  floorSummary: document.querySelector("#floorSummary"),
  poiList: document.querySelector("#poiList"),
  legend: document.querySelector("#legend"),
  hoverCard: document.querySelector("#hoverCard"),
  selectionHint: document.querySelector("#selectionHint"),
  topView: document.querySelector("#topView"),
  resetView: document.querySelector("#resetView"),
  explodeToggle: document.querySelector("#explodeToggle"),
  pinsToggle: document.querySelector("#pinsToggle"),
  labelsToggle: document.querySelector("#labelsToggle"),
};

const state = {
  selectedFloorId: FLOOR_DATA[0].id,
  selectedPoiKey: null,
  hoveredInteractive: null,
  exploded: true,
  showPins: true,
  showLabels: true,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4ebd9");
scene.fog = new THREE.Fog("#f4ebd9", 17, 36);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.copy(config.baseCameraPosition);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#f4ebd9", 0);
dom.canvasHost.append(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = "label-renderer";
dom.canvasHost.append(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 7;
controls.maxDistance = 30;
controls.minPolarAngle = THREE.MathUtils.degToRad(0.1);
controls.maxPolarAngle = THREE.MathUtils.degToRad(86);
controls.target.set(0, 1.5, 0);

const raycaster = new THREE.Raycaster();
raycaster.params.Sprite.threshold = 0.4;

const clock = new THREE.Clock();
const pointer = new THREE.Vector2();
const sceneFocus = new THREE.Vector3();
const cameraTarget = new THREE.Vector3(0, 1.5, 0);
const pointerWorld = new THREE.Vector3();
const loader = new THREE.TextureLoader();
const interactiveObjects = [];
const floorInstances = [];
const poiLookup = new Map();
const pinTextureCache = new Map();

addSceneScaffolding();
buildStaticUi();
wireUi();
void init();

async function init() {
  try {
    const textures = await Promise.all(
      FLOOR_DATA.map(async (floor) => {
        const texture = await loader.loadAsync(floor.imageUrl);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return { floor, texture };
      }),
    );

    textures.forEach(({ floor, texture }, index) => {
      const instance = createFloorGroup(floor, texture, index);
      floorInstances.push(instance);
    });

    updateSidebar();
    resize();
    renderer.setAnimationLoop(animate);
  } catch (error) {
    console.error(error);
    dom.selectionHint.textContent = "初期化に失敗しました";
    dom.floorSummary.innerHTML =
      "<h3>読み込みエラー</h3><p>画像または Three.js の読み込みに失敗しました。ローカルサーバー経由で開いているか確認してください。</p>";
  }
}

function addSceneScaffolding() {
  const hemisphere = new THREE.HemisphereLight("#fff6e8", "#cfc0a2", 1.4);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight("#fff7e0", 1.8);
  keyLight.position.set(6.5, 11.5, 8.2);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight("#bfd9ff", 0.8);
  fillLight.position.set(-7.5, 6.5, -8.2);
  scene.add(fillLight);

  const floorGlow = new THREE.Mesh(
    new THREE.CircleGeometry(18, 80),
    new THREE.MeshBasicMaterial({
      color: "#efe4cf",
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
    }),
  );
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.y = -0.96;
  scene.add(floorGlow);

  const grid = new THREE.GridHelper(34, 34, "#d94b3d", "#b7ac99");
  grid.position.y = -0.94;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);

  const ringGeometry = new THREE.TorusGeometry(0.52, 0.02, 12, 48);
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? "#d94b3d" : "#386ef2",
        transparent: true,
        opacity: 0.28,
      }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = index * 3.12 + 0.15;
    scene.add(ring);
  }
}

function createFloorGroup(floor, texture, index) {
  const width = floor.dimensions.width * config.floorScale;
  const depth = floor.dimensions.height * config.floorScale;
  const anchorOffset = computeAnchorOffset(floor);
  const group = new THREE.Group();
  group.position.set(anchorOffset.x, index * config.floorGapExploded, anchorOffset.z);
  group.userData.kind = "floor-group";
  scene.add(group);

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: floor.slabColor,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  });

  const bottomMaterial = sideMaterial.clone();
  bottomMaterial.color.offsetHSL(0, -0.02, -0.16);

  const topMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    color: "#ffffff",
    roughness: 0.88,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(width, config.slabThickness, depth),
    [
      sideMaterial,
      sideMaterial,
      topMaterial,
      bottomMaterial,
      sideMaterial,
      sideMaterial,
    ],
  );
  slab.userData.kind = "floor";
  slab.userData.floorId = floor.id;
  slab.userData.floor = floor;
  group.add(slab);
  interactiveObjects.push(slab);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.93, depth * 0.93),
    new THREE.MeshBasicMaterial({
      color: floor.slabColor,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -(config.slabThickness / 2) - 0.03;
  group.add(glow);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(width, config.slabThickness, depth)),
    new THREE.LineBasicMaterial({
      color: "#312b22",
      transparent: true,
      opacity: 0.24,
    }),
  );
  group.add(edge);

  const floorLabel = createLabelBadge(floor.label, floor.slabColor, true);
  const floorLabelObject = new CSS2DObject(floorLabel);
  floorLabelObject.position.set(width / 2 + 0.85, config.slabThickness / 2 + 0.85, 0);
  group.add(floorLabelObject);

  const pois = floor.points.map((point) => {
    const pointGroup = new THREE.Group();
    const pointPixel = getPointPixel(point);
    const localPosition = imagePointToLocal(floor, pointPixel.x, pointPixel.y);
    const areaSize = getPointAreaSize(point);
    pointGroup.position.copy(localPosition);
    pointGroup.userData.kind = "poi";
    pointGroup.userData.floorId = floor.id;
    pointGroup.userData.poiId = point.id;
    pointGroup.userData.poi = point;
    pointGroup.userData.floor = floor;
    group.add(pointGroup);

    const category = CATEGORY_META[point.category];
    const hotspot = new THREE.Mesh(
      new THREE.PlaneGeometry(areaSize.width, areaSize.height),
      new THREE.MeshBasicMaterial({
        color: category.color,
        transparent: true,
        opacity: 0.001,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    hotspot.rotation.x = -Math.PI / 2;
    hotspot.position.y = 0.022;
    hotspot.renderOrder = 4;
    hotspot.userData.kind = "poi";
    hotspot.userData.floorId = floor.id;
    hotspot.userData.poiId = point.id;
    hotspot.userData.poi = point;
    hotspot.userData.floor = floor;
    pointGroup.add(hotspot);
    interactiveObjects.push(hotspot);

    const hotspotFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(areaSize.width, areaSize.height)),
      new THREE.LineBasicMaterial({
        color: category.color,
        transparent: true,
        opacity: 0,
      }),
    );
    hotspotFrame.rotation.x = -Math.PI / 2;
    hotspotFrame.position.y = 0.024;
    hotspotFrame.renderOrder = 5;
    pointGroup.add(hotspotFrame);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.48, 10),
      new THREE.MeshStandardMaterial({
        color: category.color,
        roughness: 0.35,
        metalness: 0.18,
      }),
    );
    stem.position.y = 0.28;
    pointGroup.add(stem);

    const base = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.03, 12, 28),
      new THREE.MeshBasicMaterial({
        color: category.color,
        transparent: true,
        opacity: 0.65,
      }),
    );
    base.rotation.x = Math.PI / 2;
    base.position.y = 0.05;
    pointGroup.add(base);

    const pin = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: getPinTexture(category.color),
        transparent: true,
        depthWrite: false,
      }),
    );
    pin.scale.set(0.8, 0.8, 0.8);
    pin.position.y = 0.78;
    pin.userData.kind = "poi";
    pin.userData.floorId = floor.id;
    pin.userData.poiId = point.id;
    pin.userData.poi = point;
    pin.userData.floor = floor;
    pointGroup.add(pin);
    interactiveObjects.push(pin);

    const label = createLabelBadge(point.label, category.color, false);
    const labelObject = new CSS2DObject(label);
    const labelOffset = getPointLabelOffset(point);
    labelObject.position.set(labelOffset.x, labelOffset.y, labelOffset.z);
    pointGroup.add(labelObject);

    const poiKey = buildPoiKey(floor.id, point.id);
    const instance = {
      key: poiKey,
      point,
      floor,
      group: pointGroup,
      hotspot,
      hotspotFrame,
      pin,
      base,
      stem,
      label: labelObject,
      labelElement: label,
      baseLocalY: localPosition.y,
    };

    poiLookup.set(poiKey, instance);
    return instance;
  });

  return {
    floor,
    index,
    group,
    slab,
    materials: {
      top: topMaterial,
      side: sideMaterial,
      bottom: bottomMaterial,
    },
    edge,
    glow,
    label: floorLabelObject,
    labelElement: floorLabel,
    anchorOffset,
    pois,
    width,
    depth,
    emphasis: 0,
  };
}

function buildStaticUi() {
  dom.legend.innerHTML = "";
  Object.values(CATEGORY_META).forEach((category) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.style.setProperty("--tag-color", category.color);
    tag.textContent = category.label;
    dom.legend.append(tag);
  });
}

function wireUi() {
  dom.topView.addEventListener("click", setTopView);
  dom.resetView.addEventListener("click", resetView);

  dom.explodeToggle.addEventListener("change", (event) => {
    state.exploded = event.currentTarget.checked;
  });

  dom.pinsToggle.addEventListener("change", (event) => {
    state.showPins = event.currentTarget.checked;
  });

  dom.labelsToggle.addEventListener("change", (event) => {
    state.showLabels = event.currentTarget.checked;
  });

  renderer.domElement.addEventListener("pointermove", (event) => {
    handlePointerMove(event);
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    state.hoveredInteractive = null;
    dom.hoverCard.classList.add("is-hidden");
  });

  renderer.domElement.addEventListener("click", (event) => {
    const clickedInteractive = pickInteractive(event) ?? state.hoveredInteractive;
    if (!clickedInteractive) {
      return;
    }

    if (clickedInteractive.userData.kind === "floor") {
      focusFloor(clickedInteractive.userData.floorId);
      return;
    }

    if (clickedInteractive.userData.kind === "poi") {
      focusPoi(
        clickedInteractive.userData.floorId,
        clickedInteractive.userData.poiId,
      );
    }
  });

  window.addEventListener("resize", resize);
}

function updateSidebar() {
  const floor = getFloorById(state.selectedFloorId);
  const activePoi = state.selectedPoiKey ? poiLookup.get(state.selectedPoiKey) : null;

  dom.floorSummary.hidden = !activePoi;
  dom.floorSummary.innerHTML = activePoi
    ? `
      <span class="summary-pill">${floor.label}</span>
      <h3>${activePoi.point.label}</h3>
      <p>${activePoi.point.detail}</p>
    `
    : "";

  dom.poiList.innerHTML = "";
  floor.points.forEach((point) => {
    const category = CATEGORY_META[point.category];
    const item = document.createElement("button");
    item.type = "button";
    item.className = "poi-item";
    item.classList.toggle(
      "is-active",
      buildPoiKey(floor.id, point.id) === state.selectedPoiKey,
    );
    item.innerHTML = `
      <div class="poi-meta">
        <span class="tag" style="--tag-color: ${category.color}">${category.label}</span>
        <strong>${floor.label}</strong>
      </div>
      <h3>${point.label}</h3>
      <p>${point.summary ?? point.detail}</p>
    `;
    item.addEventListener("click", () => {
      focusPoi(floor.id, point.id);
    });
    dom.poiList.append(item);
  });

  dom.selectionHint.textContent = activePoi
    ? `${floor.label} / ${activePoi.point.label}`
    : `${floor.label} を表示中`;
}

function focusFloor(floorId) {
  state.selectedFloorId = floorId;
  state.selectedPoiKey = null;
  updateSidebar();
}

function focusPoi(floorId, poiId) {
  state.selectedFloorId = floorId;
  state.selectedPoiKey = buildPoiKey(floorId, poiId);
  updateSidebar();
}

function resetView() {
  camera.position.copy(config.baseCameraPosition);
  controls.target.set(0, 1.5, 0);
  sceneFocus.set(0, 1.5, 0);
  cameraTarget.set(0, 1.5, 0);
  controls.update();
}

function setTopView() {
  const activeFloor = floorInstances.find(
    (instance) => instance.floor.id === state.selectedFloorId,
  );
  if (!activeFloor) {
    return;
  }

  if (state.selectedPoiKey) {
    const activePoi = poiLookup.get(state.selectedPoiKey);
    activePoi.group.getWorldPosition(pointerWorld);
    cameraTarget.copy(pointerWorld);
  } else {
    cameraTarget.set(0, activeFloor.group.position.y, 0);
  }

  const distance = Math.max(activeFloor.width, activeFloor.depth, 12) * 1.18;
  sceneFocus.copy(cameraTarget);
  controls.target.copy(cameraTarget);
  camera.position.set(
    cameraTarget.x + 0.01,
    cameraTarget.y + distance,
    cameraTarget.z + 0.01,
  );
  controls.update();
}

function animate(time) {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  const selectedFloorIndex = FLOOR_DATA.findIndex(
    (floor) => floor.id === state.selectedFloorId,
  );
  const hoveredPoiKey =
    state.hoveredInteractive?.userData.kind === "poi"
      ? buildPoiKey(
          state.hoveredInteractive.userData.floorId,
          state.hoveredInteractive.userData.poiId,
        )
      : null;

  floorInstances.forEach((instance) => {
    const targetY = instance.index * (state.exploded ? config.floorGapExploded : config.floorGapStacked);
    instance.group.position.y = THREE.MathUtils.damp(
      instance.group.position.y,
      targetY,
      7.5,
      delta,
    );

    const isActiveFloor = state.selectedFloorId === instance.floor.id;
    const isAboveSelectedFloor = instance.index > selectedFloorIndex;
    const emphasisTarget = isActiveFloor ? 1 : state.exploded ? 0.76 : 0.58;
    instance.emphasis = THREE.MathUtils.damp(instance.emphasis, emphasisTarget, 7.5, delta);

    instance.materials.top.opacity = isAboveSelectedFloor
      ? 0.12
      : 0.48 + instance.emphasis * 0.52;
    instance.materials.side.opacity = isAboveSelectedFloor
      ? 0.1
      : 0.52 + instance.emphasis * 0.44;
    instance.materials.bottom.opacity = isAboveSelectedFloor
      ? 0.08
      : 0.44 + instance.emphasis * 0.32;
    instance.edge.material.opacity = isAboveSelectedFloor
      ? 0.06
      : 0.16 + instance.emphasis * 0.24;
    instance.glow.material.opacity = isAboveSelectedFloor
      ? 0.02
      : 0.04 + instance.emphasis * 0.12;
    instance.label.visible = state.showLabels && !isAboveSelectedFloor;
    instance.labelElement.classList.toggle("is-muted", !isActiveFloor);

    instance.pois.forEach((poi, poiIndex) => {
      const key = buildPoiKey(instance.floor.id, poi.point.id);
      const isSelected = state.selectedPoiKey === key;
      const isHovered = hoveredPoiKey === key;
      const isAreaVisible =
        !isAboveSelectedFloor && (state.exploded || isActiveFloor || isSelected);
      const areMarkersVisible = state.showPins && isAreaVisible;
      const bob = Math.sin(elapsed * 2.3 + poiIndex * 0.8) * 0.05;
      poi.group.visible = isAreaVisible;
      poi.group.position.y = poi.baseLocalY + bob + (isSelected ? 0.08 : 0);
      poi.hotspot.visible = isAreaVisible;
      poi.hotspot.material.opacity = isSelected ? 0.18 : isHovered ? 0.08 : 0.001;
      poi.hotspotFrame.visible = isAreaVisible;
      poi.hotspotFrame.material.opacity = isSelected ? 0.82 : isHovered ? 0.42 : 0;
      poi.stem.visible = areMarkersVisible;
      poi.base.visible = areMarkersVisible;
      poi.pin.visible = areMarkersVisible;
      poi.label.visible =
        state.showLabels && areMarkersVisible && (isSelected || isHovered);
      poi.labelElement.classList.toggle("is-muted", !isSelected && !isHovered);
      poi.pin.scale.setScalar(isSelected ? 1.05 : isHovered ? 0.92 : 0.78);
      poi.pin.material.opacity = isSelected || isHovered ? 1 : 0.78;
      poi.base.material.opacity = isSelected ? 0.95 : isHovered ? 0.8 : 0.58;
      poi.stem.material.emissive.set(
        isSelected ? CATEGORY_META[poi.point.category].color : "#000000",
      );
    });
  });

  updateFocusTarget(delta);
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function updateFocusTarget(delta) {
  if (state.selectedPoiKey) {
    const activePoi = poiLookup.get(state.selectedPoiKey);
    activePoi.group.getWorldPosition(pointerWorld);
    cameraTarget.set(pointerWorld.x, pointerWorld.y - 0.2, pointerWorld.z);
  } else {
    const activeFloor = floorInstances.find(
      (instance) => instance.floor.id === state.selectedFloorId,
    );
    cameraTarget.set(0, activeFloor ? activeFloor.group.position.y : 0, 0);
  }

  sceneFocus.x = THREE.MathUtils.damp(sceneFocus.x, cameraTarget.x, 5.5, delta);
  sceneFocus.y = THREE.MathUtils.damp(sceneFocus.y, cameraTarget.y, 5.5, delta);
  sceneFocus.z = THREE.MathUtils.damp(sceneFocus.z, cameraTarget.z, 5.5, delta);
  controls.target.copy(sceneFocus);
}

function handlePointerMove(event) {
  const hovered = pickInteractive(event);
  state.hoveredInteractive = hovered;
  renderer.domElement.style.cursor = hovered ? "pointer" : "grab";

  if (!hovered) {
    dom.hoverCard.classList.add("is-hidden");
    return;
  }

  const isPoi = hovered.userData.kind === "poi";
  const title = isPoi ? hovered.userData.poi.label : hovered.userData.floor.label;
  const detail = isPoi ? hovered.userData.poi.summary ?? hovered.userData.poi.detail : "";

  dom.hoverCard.innerHTML = detail
    ? `<strong>${title}</strong><p>${detail}</p>`
    : `<strong>${title}</strong>`;
  dom.hoverCard.classList.remove("is-hidden");

  const rect = dom.canvasHost.getBoundingClientRect();
  const cardWidth = 280;
  const left = Math.min(event.clientX - rect.left + 18, rect.width - cardWidth - 18);
  const top = Math.max(event.clientY - rect.top + 18, 18);
  dom.hoverCard.style.left = `${left}px`;
  dom.hoverCard.style.top = `${top}px`;
}

function pickInteractive(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster
    .intersectObjects(interactiveObjects, false)
    .filter(({ object }) => isObjectVisible(object));
  if (intersections.length === 0) {
    return null;
  }

  return intersections[0].object;
}

function resize() {
  const { clientWidth, clientHeight } = dom.canvasHost;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  labelRenderer.setSize(clientWidth, clientHeight);
}

function imagePointToLocal(floor, pixelX, pixelY) {
  const width = floor.dimensions.width * config.floorScale;
  const depth = floor.dimensions.height * config.floorScale;
  return new THREE.Vector3(
    (pixelX / floor.dimensions.width - 0.5) * width,
    config.slabThickness / 2,
    (pixelY / floor.dimensions.height - 0.5) * depth,
  );
}

function getPointPixel(point) {
  if (point.pixel) {
    return point.pixel;
  }

  return point.area
    ? { x: point.area.x, y: point.area.y }
    : { x: 0, y: 0 };
}

function getPointAreaSize(point) {
  if (!point.area) {
    return { width: 0.9, height: 0.9 };
  }

  return {
    width: point.area.width * config.floorScale,
    height: point.area.height * config.floorScale,
  };
}

function getPointLabelOffset(point) {
  return {
    x: point.labelOffset?.x ?? 0,
    y: point.labelOffset?.y ?? 1.32,
    z: point.labelOffset?.z ?? 0,
  };
}

function isObjectVisible(object) {
  let current = object;
  while (current) {
    if (!current.visible) {
      return false;
    }
    current = current.parent;
  }

  return true;
}

function computeAnchorOffset(floor) {
  const width = floor.dimensions.width * config.floorScale;
  const depth = floor.dimensions.height * config.floorScale;
  return new THREE.Vector3(
    -((floor.anchor.x / floor.dimensions.width - 0.5) * width),
    0,
    -((0.5 - floor.anchor.y / floor.dimensions.height) * depth),
  );
}

function createLabelBadge(text, accentColor, isFloor) {
  const element = document.createElement("div");
  element.className = `label-badge${isFloor ? " is-floor" : ""}`;
  element.style.setProperty("--accent", accentColor);
  element.textContent = text;
  return element;
}

function getPinTexture(color) {
  if (pinTextureCache.has(color)) {
    return pinTextureCache.get(color);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.strokeStyle = "#fff8ef";
  context.lineWidth = 10;

  context.beginPath();
  context.moveTo(64, 108);
  context.bezierCurveTo(96, 72, 102, 56, 102, 38);
  context.arc(64, 38, 28, 0, Math.PI * 2);
  context.stroke();
  context.fill();

  context.fillStyle = "#fff8ef";
  context.beginPath();
  context.arc(64, 38, 10, 0, Math.PI * 2);
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  pinTextureCache.set(color, texture);
  return texture;
}

function getFloorById(floorId) {
  return FLOOR_DATA.find((floor) => floor.id === floorId) ?? FLOOR_DATA[0];
}

function buildPoiKey(floorId, poiId) {
  return `${floorId}:${poiId}`;
}
```

## src/floorData.js

```js
export const CATEGORY_META = {
  info: {
    label: "案内",
    color: "#d94b3d",
  },
  food: {
    label: "飲食",
    color: "#2a8c63",
  },
  exhibition: {
    label: "展示",
    color: "#386ef2",
  },
  event: {
    label: "催し",
    color: "#d59a1a",
  },
  lounge: {
    label: "休憩",
    color: "#6e5494",
  },
};

function area(x, y, width, height) {
  return { x, y, width, height };
}

function guideDetail({ group, classification, title, room, page, note }) {
  return [
    group ? `団体: ${group}` : null,
    classification ? `分類: ${classification}` : null,
    title ? `企画: ${title}` : null,
    room ? `場所: ${room}` : null,
    page ? `パンフレット: ${page}` : null,
    note ? `補足: ${note}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function multiGuideDetail(items, note) {
  const blocks = items.map((item) => guideDetail(item));
  if (note) {
    blocks.push(`補足: ${note}`);
  }

  return blocks.join("\n\n");
}

function point({
  id,
  label,
  category,
  area: pointArea,
  pixel,
  labelOffset,
  summary,
  detail,
}) {
  return {
    id,
    label,
    category,
    ...(pointArea ? { area: pointArea } : {}),
    pixel:
      pixel ??
      (pointArea
        ? {
            x: pointArea.x + pointArea.width / 2,
            y: pointArea.y + pointArea.height / 2,
          }
        : undefined),
    ...(labelOffset ? { labelOffset } : {}),
    summary: summary ?? detail,
    detail,
  };
}

export const FLOOR_DATA = [
  {
    id: "1F",
    label: "1階",
    headline: "受付と特別棟企画のフロア",
    description:
      "受付、キッチンカー、中庭の案内に加えて、和室・CALL教室・多目的室1・調理室・F1AB の企画を選択できます。",
    imageUrl: new URL("../assets/floors/1F.png", import.meta.url).href,
    dimensions: { width: 1133, height: 580 },
    anchor: { x: 534, y: 392 },
    slabColor: "#d9b870",
    points: [
      point({
        id: "reception",
        label: "受付",
        category: "info",
        area: area(191, 110, 42, 72),
        summary: "来場受付",
        detail: guideDetail({
          group: "文化祭本部",
          classification: "案内",
          title: "来場受付",
          room: "受付",
          note: "通用門側から入った来場者の受付です。",
        }),
      }),
      point({
        id: "courtyard-ticket",
        label: "中庭",
        category: "event",
        area: area(537, 286, 150, 180),
        summary: "3年劇チケット配布",
        detail: guideDetail({
          group: "3年演劇",
          classification: "案内",
          title: "観劇チケット配布",
          room: "中庭",
          note: "各公演の30分前より、特別教室棟1階中庭でチケットを配布します。",
        }),
      }),
      point({
        id: "food-ticket",
        label: "食券用テント",
        category: "food",
        area: area(777, 34, 180, 46),
        summary: "飲食券の案内",
        detail: guideDetail({
          group: "文化祭本部",
          classification: "飲食案内",
          title: "食券販売・案内",
          room: "食券用テント",
          note: "視聴覚室の飲食スペースやキッチンカー利用の前に確認する案内です。",
        }),
      }),
      point({
        id: "kitchen-car",
        label: "キッチンカー",
        category: "food",
        area: area(854, 178, 155, 176),
        summary: "屋外飲食販売",
        detail: guideDetail({
          group: "キッチンカー",
          classification: "飲食",
          title: "屋外販売",
          room: "キッチンカーエリア",
          note: "購入品は視聴覚室の飲食スペースまたは指定場所で利用します。",
        }),
      }),
      point({
        id: "japanese-room",
        label: "和室",
        category: "food",
        area: area(354, 195, 128, 72),
        summary: "茶道部「喫茶去」",
        detail: guideDetail({
          group: "茶道部",
          classification: "食品",
          title: "喫茶去",
          room: "和室",
          page: "18ページ",
        }),
      }),
      point({
        id: "call-room",
        label: "CALL教室",
        category: "exhibition",
        area: area(354, 294, 128, 68),
        summary: "コンピュータ研究会「コン研 神ゲーDX」",
        detail: guideDetail({
          group: "コンピュータ研究会",
          classification: "成果発表",
          title: "コン研 神ゲーDX〜自作コンテスト〜",
          room: "CALL教室",
          page: "21ページ",
        }),
      }),
      point({
        id: "multipurpose-1",
        label: "多目的室1",
        category: "event",
        area: area(354, 404, 128, 70),
        summary: "演劇部 特別公演",
        detail: guideDetail({
          group: "演劇部",
          classification: "演劇",
          title: "文化祭用特別公演",
          room: "多目的室1",
          page: "18ページ",
        }),
      }),
      point({
        id: "cooking-room",
        label: "調理室",
        category: "food",
        area: area(666, 106, 148, 64),
        summary: "家庭部「お菓子売ります」",
        detail: guideDetail({
          group: "家庭部",
          classification: "食品",
          title: "お菓子売ります",
          room: "調理室",
          page: "18ページ",
        }),
      }),
      point({
        id: "f1ab",
        label: "F1AB",
        category: "event",
        area: area(723, 514, 150, 82),
        summary: "2年6組「江戸百怪談」",
        detail: guideDetail({
          group: "2年6組",
          classification: "お化け屋敷",
          title: "江戸百怪談",
          room: "F1AB",
          page: "15ページ",
        }),
      }),
    ],
  },
  {
    id: "2F",
    label: "2階",
    headline: "視聴覚室と3年企画のフロア",
    description:
      "視聴覚室の飲食スペース、図書室、多目的室2、PTA コーナーと、3-1 から 3-8 の企画を選択できます。",
    imageUrl: new URL("../assets/floors/2F.png", import.meta.url).href,
    dimensions: { width: 555, height: 494 },
    anchor: { x: 278, y: 250 },
    slabColor: "#8fb5eb",
    points: [
      point({
        id: "audio-visual-room",
        label: "視聴覚室",
        category: "food",
        area: area(358, 77, 92, 72),
        summary: "キッチンカー購入品 飲食スペース",
        detail: guideDetail({
          group: "その他",
          classification: "その他",
          title: "キッチンカー購入品飲食スペース",
          room: "視聴覚室",
          note: "キッチンカーで購入した飲食物の利用スペースです。",
        }),
      }),
      point({
        id: "library",
        label: "図書室",
        category: "exhibition",
        area: area(154, 103, 88, 84),
        summary: "図書委員会「古本市」",
        detail: guideDetail({
          group: "図書委員会",
          classification: "展示",
          title: "古本市",
          room: "図書室",
          page: "22ページ",
        }),
      }),
      point({
        id: "multipurpose-2",
        label: "多目的室2",
        category: "exhibition",
        area: area(357, 269, 88, 58),
        summary: "育明生団体「帰国生滞在国紹介」",
        detail: guideDetail({
          group: "育明生団体",
          classification: "展示",
          title: "帰国生滞在国紹介",
          room: "多目的室2",
          page: "21ページ",
        }),
      }),
      point({
        id: "pta-corner",
        label: "PTAコーナー",
        category: "info",
        area: area(357, 335, 88, 60),
        summary: "PTA休憩室・ひのミラ",
        detail: multiGuideDetail([
          {
            group: "PTA",
            classification: "その他",
            title: "PTA休憩室",
            room: "PTAコーナー",
            page: "22ページ",
          },
          {
            group: "ひのミラ",
            classification: "展示",
            title: "日野の未来を見つめて",
            room: "PTAコーナー付近",
            page: "21ページ",
          },
        ]),
      }),
      point({
        id: "3-8",
        label: "3-8",
        category: "event",
        area: area(59, 420, 54, 50),
        summary: "3年8組「ドラゴン桜」",
        detail: guideDetail({
          group: "3年8組",
          classification: "演劇",
          title: "ドラゴン桜",
          room: "3-8",
          page: "17ページ",
        }),
      }),
      point({
        id: "3-7",
        label: "3-7",
        category: "event",
        area: area(109, 420, 54, 50),
        summary: "3年7組 演劇企画",
        detail: guideDetail({
          group: "3年7組",
          classification: "演劇",
          title: "クラス演劇",
          room: "3-7",
          page: "17ページ",
        }),
      }),
      point({
        id: "3-6",
        label: "3-6",
        category: "event",
        area: area(160, 420, 54, 50),
        summary: "3年6組「水平線の歩き方」",
        detail: guideDetail({
          group: "3年6組",
          classification: "演劇",
          title: "水平線の歩き方",
          room: "3-6",
          page: "17ページ",
        }),
      }),
      point({
        id: "3-5",
        label: "3-5",
        category: "event",
        area: area(212, 420, 54, 50),
        summary: "3年5組「寸劇家族」",
        detail: guideDetail({
          group: "3年5組",
          classification: "演劇",
          title: "寸劇家族",
          room: "3-5",
          page: "17ページ",
        }),
      }),
      point({
        id: "3-4",
        label: "3-4",
        category: "event",
        area: area(301, 420, 54, 50),
        summary: "3年4組 演劇企画",
        detail: guideDetail({
          group: "3年4組",
          classification: "演劇",
          title: "クラス演劇",
          room: "3-4",
          page: "16ページ",
        }),
      }),
      point({
        id: "3-3",
        label: "3-3",
        category: "event",
        area: area(353, 420, 54, 50),
        summary: "3年3組「百万年ピクニック」",
        detail: guideDetail({
          group: "3年3組",
          classification: "演劇",
          title: "百万年ピクニック",
          room: "3-3",
          page: "16ページ",
        }),
      }),
      point({
        id: "3-2",
        label: "3-2",
        category: "event",
        area: area(406, 420, 54, 50),
        summary: "3年2組「3年A組―今から皆さんは人質です―」",
        detail: guideDetail({
          group: "3年2組",
          classification: "演劇",
          title: "3年A組―今から皆さんは人質です―",
          room: "3-2",
          page: "16ページ",
        }),
      }),
      point({
        id: "3-1",
        label: "3-1",
        category: "event",
        area: area(459, 420, 54, 50),
        summary: "3年1組「100LIFE」",
        detail: guideDetail({
          group: "3年1組",
          classification: "演劇",
          title: "100LIFE",
          room: "3-1",
          page: "16ページ",
        }),
      }),
    ],
  },
  {
    id: "3F",
    label: "3階",
    headline: "特別教室と2年企画のフロア",
    description:
      "美術室・音楽室・社会科室・生物室などの特別教室と、2-1 から 2-8 の企画を地図から直接選択できます。",
    imageUrl: new URL("../assets/floors/3F.png", import.meta.url).href,
    dimensions: { width: 592, height: 506 },
    anchor: { x: 292, y: 258 },
    slabColor: "#b8d8c9",
    points: [
      point({
        id: "art-room",
        label: "美術室",
        category: "exhibition",
        area: area(112, 96, 116, 72),
        summary: "美術部「レストラン『海の庭』」",
        detail: guideDetail({
          group: "美術部",
          classification: "展示",
          title: "レストラン『海の庭』",
          room: "美術室",
          page: "19ページ",
        }),
      }),
      point({
        id: "music-room",
        label: "音楽室",
        category: "event",
        area: area(112, 188, 116, 78),
        summary: "コーラス部「The autumn concert」",
        detail: guideDetail({
          group: "コーラス部",
          classification: "パフォーマンス",
          title: "The autumn concert",
          room: "音楽室",
          page: "19ページ",
        }),
      }),
      point({
        id: "social-room",
        label: "社会科室",
        category: "event",
        area: area(112, 298, 116, 92),
        summary: "2年3組「呪怨の館」",
        detail: guideDetail({
          group: "2年3組",
          classification: "お化け屋敷",
          title: "呪怨の館",
          room: "社会科室",
          page: "14ページ",
        }),
      }),
      point({
        id: "biology-room",
        label: "生物室",
        category: "exhibition",
        area: area(379, 182, 88, 74),
        summary: "生物部 生きもの図鑑展示",
        detail: guideDetail({
          group: "生物部",
          classification: "展示",
          title: "生きもの図鑑展示",
          room: "生物室",
          page: "20ページ",
        }),
      }),
      point({
        id: "central-stairs-gallery",
        label: "中央階段",
        category: "exhibition",
        area: area(268, 359, 60, 54),
        summary: "選択美術「大切なもの」",
        detail: guideDetail({
          group: "選択美術",
          classification: "展示",
          title: "日本画展示『大切なもの』",
          room: "中央階段",
          page: "22ページ",
        }),
      }),
      point({
        id: "corridor-gallery",
        label: "渡り廊下下",
        category: "exhibition",
        area: area(294, 414, 90, 42),
        summary: "渡り廊下下の展示",
        detail: multiGuideDetail(
          [
            {
              group: "文芸創作会",
              classification: "展示",
              title: "同好会誌配布",
              room: "渡り廊下下付近",
              page: "20ページ",
            },
            {
              group: "選択書道",
              classification: "展示",
              title: "日野台書道展",
              room: "渡り廊下下",
              page: "22ページ",
            },
            {
              group: "文芸",
              classification: "展示",
              title: "作品展示・配布など",
              room: "渡り廊下下★",
            },
          ],
          "パンフレットの展示欄に掲載されている通路展示をまとめています。",
        ),
      }),
      point({
        id: "2-8",
        label: "2-8",
        category: "event",
        area: area(62, 410, 56, 50),
        summary: "2年8組「シンカイ2万マイル」",
        detail: guideDetail({
          group: "2年8組",
          classification: "アミューズメント",
          title: "シンカイ2万マイル",
          room: "2-8",
          page: "15ページ",
        }),
      }),
      point({
        id: "2-7",
        label: "2-7",
        category: "food",
        area: area(117, 410, 56, 50),
        summary: "2年7組「ohana cafe」",
        detail: guideDetail({
          group: "2年7組",
          classification: "食品",
          title: "ohana cafe",
          room: "2-7",
          page: "15ページ",
        }),
      }),
      point({
        id: "2-6",
        label: "2-6",
        category: "exhibition",
        area: area(173, 410, 56, 50),
        summary: "写真部「涼」",
        detail: guideDetail({
          group: "写真部",
          classification: "展示",
          title: "涼",
          room: "2-6",
          page: "19ページ",
        }),
      }),
      point({
        id: "2-5",
        label: "2-5",
        category: "event",
        area: area(229, 410, 56, 50),
        summary: "2年5組 アミューズメント",
        detail: guideDetail({
          group: "2年5組",
          classification: "アミューズメント",
          title: "絶望の迷宮を突破せよ",
          room: "2-5",
          page: "15ページ",
        }),
      }),
      point({
        id: "2-4",
        label: "2-4",
        category: "event",
        area: area(366, 410, 56, 50),
        summary: "2年4組「サウンドの亡霊」",
        detail: guideDetail({
          group: "2年4組",
          classification: "アミューズメント",
          title: "サウンドの亡霊",
          room: "2-4",
          page: "14ページ",
        }),
      }),
      point({
        id: "2-3-normal",
        label: "2-3",
        category: "exhibition",
        area: area(422, 410, 56, 50),
        summary: "将棋部「僕たちに勝つなんて将棋かい!?」",
        detail: guideDetail({
          group: "将棋部",
          classification: "展示",
          title: "僕たちに勝つなんて将棋かい!?",
          room: "2-3",
          page: "20ページ",
        }),
      }),
      point({
        id: "2-2",
        label: "2-2",
        category: "food",
        area: area(478, 410, 56, 50),
        summary: "2年2組「Vintage Diner」",
        detail: guideDetail({
          group: "2年2組",
          classification: "食品",
          title: "Vintage Diner",
          room: "2-2",
          page: "14ページ",
        }),
      }),
      point({
        id: "2-1",
        label: "2-1",
        category: "event",
        area: area(534, 410, 56, 50),
        summary: "2年1組「マーダーミステリー」",
        detail: guideDetail({
          group: "2年1組",
          classification: "アミューズメント",
          title: "マーダーミステリー",
          room: "2-1",
          page: "14ページ",
        }),
      }),
    ],
  },
  {
    id: "4F",
    label: "4階",
    headline: "1年企画と屋上休憩スペース",
    description:
      "1-1 から 1-8 の企画教室と、屋上休憩スペースを地図から直接選択できます。",
    imageUrl: new URL("../assets/floors/4F.png", import.meta.url).href,
    dimensions: { width: 616, height: 618 },
    anchor: { x: 303, y: 349 },
    slabColor: "#d1b2e5",
    points: [
      point({
        id: "roof-west",
        label: "屋上休憩スペース 西",
        category: "lounge",
        area: area(179, 198, 118, 152),
        labelOffset: { x: -2.2, y: 1.32, z: 0 },
        summary: "屋上休憩スペース",
        detail: guideDetail({
          group: "文化祭本部",
          classification: "休憩",
          title: "屋上休憩スペース",
          room: "屋上休憩スペース 西",
          note: "11時から13時まで開放予定です。",
        }),
      }),
      point({
        id: "roof-east",
        label: "屋上休憩スペース 東",
        category: "lounge",
        area: area(399, 198, 118, 152),
        summary: "屋上休憩スペース",
        detail: guideDetail({
          group: "文化祭本部",
          classification: "休憩",
          title: "屋上休憩スペース",
          room: "屋上休憩スペース 東",
          note: "混雑時の分散利用に向いています。",
        }),
      }),
      point({
        id: "1-8",
        label: "1-8",
        category: "event",
        area: area(56, 489, 60, 52),
        summary: "1年8組「カジノ〜麻ベガス〜」",
        detail: guideDetail({
          group: "1年8組",
          classification: "アミューズメント",
          title: "カジノ〜麻ベガス〜",
          room: "1-8",
          page: "13ページ",
        }),
      }),
      point({
        id: "1-7",
        label: "1-7",
        category: "event",
        area: area(116, 489, 60, 52),
        summary: "1年7組「名探偵マイコナン」",
        detail: guideDetail({
          group: "1年7組",
          classification: "アミューズメント",
          title: "名探偵マイコナン",
          room: "1-7",
          page: "13ページ",
        }),
      }),
      point({
        id: "1-6",
        label: "1-6",
        category: "food",
        area: area(177, 489, 60, 52),
        summary: "1年6組「石田珈琲」",
        detail: guideDetail({
          group: "1年6組",
          classification: "食品",
          title: "石田珈琲",
          room: "1-6",
          page: "13ページ",
        }),
      }),
      point({
        id: "1-5",
        label: "1-5",
        category: "event",
        area: area(238, 489, 60, 52),
        summary: "1年5組「放課後、誰もいないはずの教室で。」",
        detail: guideDetail({
          group: "1年5組",
          classification: "アミューズメント",
          title: "放課後、誰もいないはずの教室で。",
          room: "1-5",
          page: "13ページ",
        }),
      }),
      point({
        id: "1-4",
        label: "1-4",
        category: "event",
        area: area(378, 489, 60, 52),
        labelOffset: { x: -0.3, y: 1.32, z: -1.05 },
        summary: "1年4組 アミューズメント",
        detail: guideDetail({
          group: "1年4組",
          classification: "アミューズメント",
          title: "クラス企画",
          room: "1-4",
          page: "12ページ",
        }),
      }),
      point({
        id: "1-3",
        label: "1-3",
        category: "food",
        area: area(439, 489, 60, 52),
        labelOffset: { x: -0.1, y: 1.32, z: -1.2 },
        summary: "1年3組「ご主人様にお給仕します♡」",
        detail: guideDetail({
          group: "1年3組",
          classification: "食品",
          title: "ご主人様にお給仕します♡",
          room: "1-3",
          page: "12ページ",
        }),
      }),
      point({
        id: "1-2",
        label: "1-2",
        category: "event",
        area: area(500, 489, 60, 52),
        labelOffset: { x: 0.1, y: 1.32, z: -1.05 },
        summary: "1年2組「合法! オフラインカジノ」",
        detail: guideDetail({
          group: "1年2組",
          classification: "アミューズメント",
          title: "合法! オフラインカジノ",
          room: "1-2",
          page: "12ページ",
        }),
      }),
      point({
        id: "1-1",
        label: "1-1",
        category: "event",
        area: area(561, 489, 60, 52),
        labelOffset: { x: 0.32, y: 1.32, z: -1.2 },
        summary: "1年1組「手品師 カジノ」",
        detail: guideDetail({
          group: "1年1組",
          classification: "アミューズメント",
          title: "手品師 カジノ",
          room: "1-1",
          page: "12ページ",
        }),
      }),
    ],
  },
];
```

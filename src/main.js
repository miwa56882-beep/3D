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
  initialCameraPosition: new THREE.Vector3(18, 14, 22),
  overviewDirection: new THREE.Vector3(0.72, 0.58, 0.94).normalize(),
  overviewMarkerHeight: 1.95,
  overviewPadding: 1.14,
};

const dom = {
  canvasHost: document.querySelector("#canvasHost"),
  currentFloorPanel: document.querySelector(".current-floor"),
  floorSummary: document.querySelector("#floorSummary"),
  floorButtons: document.querySelector("#floorButtons"),
  legend: document.querySelector("#legend"),
  hoverCard: document.querySelector("#hoverCard"),
  selectionHint: document.querySelector("#selectionHint"),
  topView: document.querySelector("#topView"),
  resetView: document.querySelector("#resetView"),
  pinsToggle: document.querySelector("#pinsToggle"),
};

const state = {
  selectedFloorId: FLOOR_DATA[0].id,
  selectedPoiKey: null,
  hoveredInteractive: null,
  exploded: true,
  showPins: true,
  showLabels: true,
  cameraMode: "overview",
};

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4ebd9");

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.copy(config.initialCameraPosition);

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
controls.maxDistance = 64;
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
const overviewBounds = new THREE.Box3();
const overviewCenter = new THREE.Vector3();
const overviewSize = new THREE.Vector3();
const overviewPosition = new THREE.Vector3();
const overviewDirection = config.overviewDirection.clone();
const tempPoint = new THREE.Vector3();
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

    resize();
    resetView();
    updateSidebar();
    renderer.setAnimationLoop(animate);
  } catch (error) {
    console.error(error);
    dom.selectionHint.textContent = "初期化に失敗しました";
    dom.currentFloorPanel.hidden = false;
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
  dom.floorButtons.innerHTML = "";
  FLOOR_DATA.forEach((floor) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floor-button";
    button.dataset.floorId = floor.id;
    button.textContent = floor.label;
    button.addEventListener("click", () => {
      focusFloor(floor.id);
    });
    dom.floorButtons.append(button);
  });

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

  dom.pinsToggle.addEventListener("change", (event) => {
    state.showPins = event.currentTarget.checked;
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

  dom.floorButtons.querySelectorAll(".floor-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.floorId === state.selectedFloorId);
  });

  dom.currentFloorPanel.hidden = !activePoi;
  dom.floorSummary.innerHTML = activePoi
    ? `
      <span class="summary-pill">${floor.label}</span>
      <h3>${activePoi.point.label}</h3>
      <p>${activePoi.point.detail}</p>
    `
    : "";

  dom.selectionHint.textContent = activePoi
    ? `${floor.label} / ${activePoi.point.label}`
    : `${floor.label} を表示中`;
}

function focusFloor(floorId) {
  state.selectedFloorId = floorId;
  state.selectedPoiKey = null;
  state.cameraMode = "overview";
  updateSidebar();
}

function focusPoi(floorId, poiId) {
  state.selectedFloorId = floorId;
  state.selectedPoiKey = buildPoiKey(floorId, poiId);
  state.cameraMode = "focus";
  updateSidebar();
}

function resetView() {
  state.cameraMode = "overview";
  updateOverviewState();
  camera.position.copy(overviewPosition);
  controls.target.copy(overviewCenter);
  sceneFocus.copy(overviewCenter);
  cameraTarget.copy(overviewCenter);
  controls.update();
}

function setTopView() {
  state.cameraMode = "focus";
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
    instance.group.visible = isActiveFloor;
    if (!isActiveFloor) {
      return;
    }

    const emphasisTarget = 1;
    instance.emphasis = THREE.MathUtils.damp(instance.emphasis, emphasisTarget, 7.5, delta);

    instance.materials.top.opacity = 0.48 + instance.emphasis * 0.52;
    instance.materials.side.opacity = 0.52 + instance.emphasis * 0.44;
    instance.materials.bottom.opacity = 0.44 + instance.emphasis * 0.32;
    instance.edge.material.opacity = 0.16 + instance.emphasis * 0.24;
    instance.glow.material.opacity = 0.04 + instance.emphasis * 0.12;
    instance.label.visible = state.showLabels;
    instance.labelElement.classList.remove("is-muted");

    instance.pois.forEach((poi, poiIndex) => {
      const key = buildPoiKey(instance.floor.id, poi.point.id);
      const isSelected = state.selectedPoiKey === key;
      const isHovered = hoveredPoiKey === key;
      const isAreaVisible = true;
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

  if (state.cameraMode === "overview") {
    updateOverviewCamera(delta);
  } else {
    updateFocusTarget(delta);
  }
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function updateOverviewCamera(delta) {
  updateOverviewState();
  camera.position.x = THREE.MathUtils.damp(
    camera.position.x,
    overviewPosition.x,
    4.6,
    delta,
  );
  camera.position.y = THREE.MathUtils.damp(
    camera.position.y,
    overviewPosition.y,
    4.6,
    delta,
  );
  camera.position.z = THREE.MathUtils.damp(
    camera.position.z,
    overviewPosition.z,
    4.6,
    delta,
  );
  sceneFocus.x = THREE.MathUtils.damp(sceneFocus.x, overviewCenter.x, 4.6, delta);
  sceneFocus.y = THREE.MathUtils.damp(sceneFocus.y, overviewCenter.y, 4.6, delta);
  sceneFocus.z = THREE.MathUtils.damp(sceneFocus.z, overviewCenter.z, 4.6, delta);
  cameraTarget.copy(overviewCenter);
  controls.target.copy(sceneFocus);
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

function updateOverviewState() {
  if (floorInstances.length === 0) {
    overviewCenter.set(0, 1.5, 0);
    overviewPosition.copy(config.initialCameraPosition);
    return;
  }

  const visibleFloorInstances = floorInstances.filter(
    (instance) => instance.floor.id === state.selectedFloorId,
  );
  const targetInstances = visibleFloorInstances.length > 0 ? visibleFloorInstances : floorInstances;

  overviewBounds.makeEmpty();
  targetInstances.forEach((instance) => {
    const halfWidth = instance.width / 2;
    const halfDepth = instance.depth / 2;
    const floorY = instance.group.position.y;
    overviewBounds.expandByPoint(
      tempPoint.set(
        instance.group.position.x - halfWidth,
        floorY - config.slabThickness / 2,
        instance.group.position.z - halfDepth,
      ),
    );
    overviewBounds.expandByPoint(
      tempPoint.set(
        instance.group.position.x + halfWidth,
        floorY + config.slabThickness / 2 + config.overviewMarkerHeight,
        instance.group.position.z + halfDepth,
      ),
    );
  });

  overviewBounds.getCenter(overviewCenter);
  overviewBounds.getSize(overviewSize);

  const halfVerticalFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const halfHorizontalFov = Math.atan(
    Math.tan(halfVerticalFov) * camera.aspect,
  );
  const fitHalfAngle = Math.min(halfVerticalFov, halfHorizontalFov);
  const radius = overviewSize.length() * 0.5;
  const distance =
    Math.max(radius / Math.sin(fitHalfAngle), controls.minDistance) *
    config.overviewPadding;

  overviewPosition.copy(overviewCenter).addScaledVector(
    overviewDirection,
    distance,
  );
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

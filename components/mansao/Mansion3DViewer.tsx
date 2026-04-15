"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Mansion3DViewerProps = {
  minimal?: boolean;
};

export default function Mansion3DViewer({
  minimal = false,
}: Mansion3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // -----------------------------
    // Base scene
    // -----------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dfe5ea");
    scene.fog = new THREE.Fog("#dfe5ea", 80, 220);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 600);
    camera.position.set(58, 36, 56);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, Math.max(mount.clientHeight, 320));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(4, 7, 5);
    controls.minDistance = 18;
    controls.maxDistance = 130;
    controls.maxPolarAngle = Math.PI / 2.05;

    // -----------------------------
    // Lights
    // -----------------------------
    const hemiLight = new THREE.HemisphereLight("#f4f8ff", "#96a4b3", 1.28);
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight("#fff6e9", 2.05);
    sun.position.set(82, 94, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 220;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight("#d7e6f4", 0.65);
    fillLight.position.set(-44, 36, -24);
    scene.add(fillLight);

    const bounceLight = new THREE.PointLight("#c6d8ea", 1.2, 220, 2);
    bounceLight.position.set(-20, 10, 68);
    scene.add(bounceLight);

    // -----------------------------
    // Materials
    // -----------------------------
    const whiteWallMat = new THREE.MeshStandardMaterial({
      color: "#f2f2ef",
      roughness: 0.78,
      metalness: 0.02,
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: "#d7d4ce",
      roughness: 0.95,
      metalness: 0.01,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: "#2f3337",
      roughness: 0.65,
      metalness: 0.08,
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: "#9a9288",
      roughness: 0.96,
      metalness: 0.01,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      color: "#8d725b",
      roughness: 0.88,
      metalness: 0.03,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: "#dcebf7",
      transmission: 0.72,
      transparent: true,
      opacity: 0.42,
      roughness: 0.08,
      metalness: 0.04,
      thickness: 0.02,
      ior: 1.45,
    });

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: "#7ea6bf",
      roughness: 0.08,
      metalness: 0.02,
      transmission: 0.45,
      transparent: true,
      opacity: 0.92,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });

    const asphaltMat = new THREE.MeshStandardMaterial({
      color: "#34363a",
      roughness: 0.98,
      metalness: 0.01,
    });

    const courtMat = new THREE.MeshStandardMaterial({
      color: "#b29069",
      roughness: 0.9,
      metalness: 0.01,
    });

    const hedgeMat = new THREE.MeshStandardMaterial({
      color: "#4d674d",
      roughness: 1,
      metalness: 0,
    });

    const plantMat = new THREE.MeshStandardMaterial({
      color: "#6b835d",
      roughness: 1,
      metalness: 0,
    });

    const trunkMat = new THREE.MeshStandardMaterial({
      color: "#6b5038",
      roughness: 1,
      metalness: 0,
    });

    // -----------------------------
    // Helpers
    // -----------------------------
    const model = new THREE.Group();
    scene.add(model);

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(420, 48, 24),
      new THREE.MeshBasicMaterial({
        color: "#d8e0e9",
        side: THREE.BackSide,
      })
    );
    skyDome.position.y = 35;
    scene.add(skyDome);

    const setShadow = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if ((mesh as THREE.Mesh).isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      return obj;
    };

    const addBox = (
      parent: THREE.Object3D,
      size: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
      radius = false
    ) => {
      const geometry = radius
        ? new THREE.BoxGeometry(size[0], size[1], size[2], 1, 1, 1)
        : new THREE.BoxGeometry(size[0], size[1], size[2]);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const addPlane = (
      parent: THREE.Object3D,
      width: number,
      depth: number,
      position: [number, number, number],
      material: THREE.Material,
      rotateX = -Math.PI / 2
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width, depth),
        material
      );
      mesh.rotation.x = rotateX;
      mesh.position.set(position[0], position[1], position[2]);
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const createGlassRail = (
      width: number,
      depth: number,
      y: number,
      parent: THREE.Object3D,
      center: [number, number]
    ) => {
      const rail = new THREE.Group();
      rail.position.set(center[0], y, center[1]);

      const postMat = new THREE.MeshStandardMaterial({
        color: "#8f969c",
        roughness: 0.7,
        metalness: 0.4,
      });

      const panelThickness = 0.08;
      const panelHeight = 1.25;

      const front = new THREE.Mesh(
        new THREE.BoxGeometry(width, panelHeight, panelThickness),
        glassMat
      );
      front.position.set(0, panelHeight / 2, depth / 2);
      rail.add(front);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(width, panelHeight, panelThickness),
        glassMat
      );
      back.position.set(0, panelHeight / 2, -depth / 2);
      rail.add(back);

      const left = new THREE.Mesh(
        new THREE.BoxGeometry(panelThickness, panelHeight, depth),
        glassMat
      );
      left.position.set(-width / 2, panelHeight / 2, 0);
      rail.add(left);

      const right = new THREE.Mesh(
        new THREE.BoxGeometry(panelThickness, panelHeight, depth),
        glassMat
      );
      right.position.set(width / 2, panelHeight / 2, 0);
      rail.add(right);

      const topFront = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.06, 0.06),
        postMat
      );
      topFront.position.set(0, panelHeight + 0.03, depth / 2);
      rail.add(topFront);

      const topBack = topFront.clone();
      topBack.position.z = -depth / 2;
      rail.add(topBack);

      const topLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, depth),
        postMat
      );
      topLeft.position.set(-width / 2, panelHeight + 0.03, 0);
      rail.add(topLeft);

      const topRight = topLeft.clone();
      topRight.position.x = width / 2;
      rail.add(topRight);

      setShadow(rail);
      parent.add(rail);
      return rail;
    };

    const createPalm = (x: number, z: number, scale = 1) => {
      const palm = new THREE.Group();
      const seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      const heightMul = 0.82 + seed * 0.5;
      const crownMul = 0.86 + seed * 0.42;
      const lean = (seed - 0.5) * 0.14;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.2 * scale * heightMul,
          0.34 * scale * heightMul,
          5.8 * scale * heightMul,
          10
        ),
        trunkMat
      );
      trunk.position.y = 2.9 * scale * heightMul;
      trunk.rotation.z = lean;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      palm.add(trunk);

      for (let i = 0; i < 7; i += 1) {
        const leaf = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.02 * scale * crownMul,
            0.12 * scale * crownMul,
            3.2 * scale * crownMul,
            6
          ),
          plantMat
        );
        const angle = (i / 7) * Math.PI * 2;
        const jitter = ((seed + i * 0.17) % 1) - 0.5;
        leaf.position.y = 5.7 * scale * heightMul;
        leaf.rotation.z = Math.PI / (2.55 + jitter * 0.2);
        leaf.rotation.y = angle + jitter * 0.3;
        leaf.position.x = Math.cos(angle) * 1.15 * scale * crownMul;
        leaf.position.z = Math.sin(angle) * 1.15 * scale * crownMul;
        palm.add(leaf);
      }

      palm.position.set(x, 0, z);
      palm.rotation.y = seed * Math.PI * 2;
      setShadow(palm);
      return palm;
    };

    const createCypress = (x: number, z: number, scale = 1) => {
      const tree = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3 * scale, 0.7 * scale, 4.8 * scale, 8),
        hedgeMat
      );
      tree.position.set(x, 2.4 * scale, z);
      tree.castShadow = true;
      tree.receiveShadow = true;
      return tree;
    };

    const createRoundedWall = (
      radius: number,
      height: number,
      width: number,
      material: THREE.Material
    ) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 32, 1, false, 0, Math.PI),
        material
      );
      base.rotation.y = Math.PI / 2;
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, radius * 2),
        material
      );
      cap.position.x = -width / 2;
      cap.castShadow = true;
      cap.receiveShadow = true;
      group.add(cap);

      return group;
    };

    const createSteps = (
      parent: THREE.Object3D,
      steps: number,
      width: number,
      depth: number,
      height: number,
      start: [number, number, number],
      direction: "x" | "z" = "x",
      material: THREE.Material = concreteMat
    ) => {
      for (let i = 0; i < steps; i += 1) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(width, height, depth),
          material
        );
        if (direction === "x") {
          step.position.set(start[0] + i * width * 0.9, start[1] + i * height, start[2]);
        } else {
          step.position.set(start[0], start[1] + i * height, start[2] + i * depth * 0.9);
        }
        step.castShadow = true;
        step.receiveShadow = true;
        parent.add(step);
      }
    };

    // -----------------------------
    // Environment
    // -----------------------------
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(560, 560, 120, 120),
      new THREE.MeshPhysicalMaterial({
        color: "#8ba4b7",
        roughness: 0.16,
        metalness: 0.06,
        transmission: 0.25,
        transparent: true,
        opacity: 0.96,
        clearcoat: 1,
        clearcoatRoughness: 0.09,
      })
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -1.5, 58);
    ocean.receiveShadow = true;
    scene.add(ocean);

    const foamBand = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 28),
      new THREE.MeshStandardMaterial({
        color: "#edf4fa",
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 0.42,
      })
    );
    foamBand.rotation.x = -Math.PI / 2;
    foamBand.position.set(10, -1.43, 88);
    scene.add(foamBand);

    const terrain = new THREE.Mesh(
      new THREE.CircleGeometry(165, 112),
      new THREE.MeshStandardMaterial({
        color: "#e6dfd4",
        roughness: 1,
        metalness: 0,
      })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.02;
    scene.add(terrain);

    const beachInset = new THREE.Mesh(
      new THREE.RingGeometry(72, 162, 96),
      new THREE.MeshStandardMaterial({
        color: "#d5cab8",
        roughness: 0.98,
        metalness: 0,
      })
    );
    beachInset.rotation.x = -Math.PI / 2;
    beachInset.position.set(0, 0.01, 20);
    scene.add(beachInset);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 18),
      asphaltMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.01, -46);
    road.receiveShadow = true;
    scene.add(road);

    const pier = new THREE.Group();
    const pierDeck = new THREE.Mesh(
      new THREE.BoxGeometry(54, 0.55, 6),
      new THREE.MeshStandardMaterial({
        color: "#bca88d",
        roughness: 0.9,
      })
    );
    pierDeck.position.set(102, 0.35, 106);
    pier.add(pierDeck);

    for (let i = 0; i < 18; i += 1) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 4.3, 0.38),
        new THREE.MeshStandardMaterial({ color: "#8f795f", roughness: 0.95 })
      );
      post.position.set(78 + i * 3, -1.7, 106);
      pier.add(post);
    }

    const hutBase1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: "#f1f3f5", roughness: 0.86 })
    );
    hutBase1.position.set(118, 1.5, 104.4);
    pier.add(hutBase1);

    const hutRoof1 = new THREE.Mesh(
      new THREE.ConeGeometry(3, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: "#9ca5af", roughness: 0.75 })
    );
    hutRoof1.position.set(118, 2.9, 104.4);
    hutRoof1.rotation.y = Math.PI / 6;
    pier.add(hutRoof1);

    const hutBase2 = hutBase1.clone();
    hutBase2.position.set(128, 1.5, 107.2);
    pier.add(hutBase2);

    const hutRoof2 = hutRoof1.clone();
    hutRoof2.position.set(128, 2.9, 107.2);
    pier.add(hutRoof2);

    setShadow(pier);
    scene.add(pier);

    // -----------------------------
    // Mansion layout
    // -----------------------------
    const mansion = new THREE.Group();
    model.add(mansion);

    // Front platform / driveway area
    addBox(mansion, [50, 1.2, 18], [0, 0.6, -20], concreteMat);
    addPlane(mansion, 20, 10, [-16, 1.21, -20], concreteMat);
    addPlane(mansion, 16, 8, [14, 1.21, -22], concreteMat);

    // Curved front retaining wall
    const curvedFront = createRoundedWall(8, 4, 22, whiteWallMat);
    curvedFront.position.set(-19, 2, -12);
    curvedFront.rotation.y = Math.PI;
    mansion.add(curvedFront);

    // Main upper level slab
    addBox(mansion, [46, 1.2, 18], [4, 8.6, 2], whiteWallMat);

    // Main lower volume
    addBox(mansion, [44, 8, 14], [4, 4, 1], whiteWallMat);

    // Black roof trim
    addBox(mansion, [50, 0.9, 22], [4, 12.7, 2], darkTrimMat);
    addBox(mansion, [40, 0.3, 14], [4, 12.2, 2], darkTrimMat);

    // Skylights / rooftop details
    for (let i = 0; i < 5; i += 1) {
      addBox(
        mansion,
        [2.4, 0.15, 1.1],
        [-4 + i * 3.2, 12.35, 0.6],
        new THREE.MeshStandardMaterial({
          color: "#9eb3c4",
          roughness: 0.25,
          metalness: 0.25,
        })
      );
    }

    addBox(mansion, [3.4, 1.5, 2.3], [18, 13.0, -2], concreteMat);
    addBox(mansion, [1.0, 0.9, 1.0], [7, 12.9, -4], stoneMat);
    addBox(mansion, [1.0, 0.9, 1.0], [10, 12.9, -4], stoneMat);

    // Front glass facade rhythm
    for (let i = 0; i < 10; i += 1) {
      addBox(mansion, [1.3, 6.4, 0.2], [-16 + i * 3.7, 5.4, 8.1], glassMat);
    }

    // Rear glass facade rhythm
    for (let i = 0; i < 9; i += 1) {
      addBox(mansion, [1.5, 6.2, 0.2], [-15 + i * 3.8, 5.3, -6.1], glassMat);
    }

    // Structural columns under main sea-facing slab
    const supportXs = [-15, -6, 3, 12, 21];
    supportXs.forEach((x) => {
      addBox(mansion, [1.7, 9, 1.7], [x, 4.5, 17], concreteMat);
    });

    // Left side sea deck
    addBox(mansion, [16, 0.7, 10], [-16, 8.2, 17], woodMat);
    createGlassRail(15.5, 9.5, 8.55, mansion, [-16, 17]);

    // Right side sea deck
    addBox(mansion, [15, 0.7, 9], [22, 8.2, 16], woodMat);
    createGlassRail(14.5, 8.5, 8.55, mansion, [22, 16]);

    // Lower rear platform over water
    addBox(mansion, [38, 0.8, 18], [8, 1.2, 28], whiteWallMat);
    const rearPillars = [-5, 4, 13, 22];
    rearPillars.forEach((x) => {
      addBox(mansion, [1.7, 4.4, 1.7], [x, -0.6, 31], concreteMat);
    });

    // Pool block
    addBox(mansion, [18, 1.3, 10], [8, 2.0, 24.5], concreteMat);
    addBox(mansion, [14.8, 0.45, 7], [8, 2.55, 24.5], waterMat);

    // Pool dark privacy wall
    addBox(
      mansion,
      [9, 5.8, 0.7],
      [2, 5.4, 22.4],
      new THREE.MeshStandardMaterial({
        color: "#2f3135",
        roughness: 0.9,
        metalness: 0.04,
      })
    );

    // Rear garden strips / walkways
    addPlane(
      mansion,
      22,
      2.2,
      [5, 2.72, 34.4],
      new THREE.MeshStandardMaterial({
        color: "#b6c3b0",
        roughness: 1,
        metalness: 0,
      })
    );

    // Pathway plates
    for (let i = 0; i < 7; i += 1) {
      addBox(mansion, [1.8, 0.12, 0.9], [-7 + i * 2.2, 2.8, 34.4], concreteMat);
    }

    // Right auxiliary block
    addBox(mansion, [24, 5.8, 14], [31, 3.1, 6], whiteWallMat);
    addBox(mansion, [26, 0.7, 16], [31, 6.35, 6], woodMat);
    addBox(mansion, [13, 0.35, 8], [36, 6.9, 1.5], woodMat);

    // Link bridge from aux block to main house
    addBox(mansion, [16, 0.45, 5.5], [18, 6.2, 10], concreteMat);

    // Basketball court
    addBox(mansion, [18, 0.5, 13], [-22, 1.1, 10], courtMat);
    const courtLineMat = new THREE.LineBasicMaterial({ color: "#ffffff" });
    const courtShape = [
      [-29, 9],
      [-15, 9],
      [-15, 3],
      [-29, 3],
      [-29, 9],
    ];
    const linePoints = courtShape.map(([x, z]) => new THREE.Vector3(x, 1.37, z));
    const courtOutline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(linePoints),
      courtLineMat
    );
    mansion.add(courtOutline);

    const hoopPole1 = addBox(
      mansion,
      [0.15, 3.2, 0.15],
      [-28.3, 2.6, 6],
      darkTrimMat
    );
    const hoopBoard1 = addBox(
      mansion,
      [1.2, 0.8, 0.08],
      [-27.7, 4.2, 6],
      whiteWallMat
    );
    const hoopRim1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.03, 12, 24),
      new THREE.MeshStandardMaterial({ color: "#d85c3f", roughness: 0.5 })
    );
    hoopRim1.rotation.x = Math.PI / 2;
    hoopRim1.position.set(-27.1, 3.8, 6);
    mansion.add(hoopRim1);

    const hoopPole2 = hoopPole1.clone();
    hoopPole2.position.set(-15.7, 2.6, 6);
    mansion.add(hoopPole2);

    const hoopBoard2 = hoopBoard1.clone();
    hoopBoard2.position.set(-16.3, 4.2, 6);
    mansion.add(hoopBoard2);

    const hoopRim2 = hoopRim1.clone();
    hoopRim2.position.set(-16.9, 3.8, 6);
    mansion.add(hoopRim2);

    // Entry ramp and gate zone
    addPlane(mansion, 18, 10, [-18, 1.22, -20], concreteMat);
    addBox(mansion, [0.18, 3.4, 12], [-28, 2.0, -20], darkTrimMat);
    addBox(mansion, [0.18, 3.4, 12], [-8, 2.0, -20], darkTrimMat);

    for (let i = 0; i < 12; i += 1) {
      addBox(mansion, [0.08, 2.6, 0.08], [-18 + i * 0.9, 1.65, -14], darkTrimMat);
    }

    // Low perimeter walls
    addBox(mansion, [36, 2.3, 1], [2, 1.15, -28], whiteWallMat);
    addBox(mansion, [1, 2.3, 16], [-16, 1.15, -20], whiteWallMat);
    addBox(mansion, [1, 2.3, 14], [18, 1.15, -22], whiteWallMat);

    // Sea-side side stairs
    createSteps(mansion, 8, 1.6, 0.55, 0.36, [-29, 0.3, -1], "z");
    createSteps(mansion, 8, 1.6, 0.55, 0.36, [25, 0.3, -2], "z");

    // Main central terrace
    addBox(mansion, [18, 0.45, 11], [1, 8.15, 9.5], concreteMat);
    createGlassRail(17.5, 10.5, 8.35, mansion, [1, 9.5]);

    // Rear loungers deck
    addBox(mansion, [12, 0.35, 5], [29, 1.45, 19], woodMat);

    // Green strips and planters
    addBox(mansion, [12, 0.45, 1.8], [-2, 1.35, 36], hedgeMat);
    addBox(mansion, [7, 0.45, 1.8], [15, 1.35, 36], hedgeMat);
    addBox(mansion, [8, 0.65, 2], [28, 1.6, 30], hedgeMat);

    // Decorative front and side stone retaining details
    addBox(mansion, [22, 1.6, 1], [-23, 0.8, 0], stoneMat);
    addBox(mansion, [1, 1.6, 18], [-34, 0.8, 10], stoneMat);

    // Sign panel near sea-facing side
    addBox(mansion, [6, 5, 0.5], [20, 5.5, 35], darkTrimMat);

    // -----------------------------
    // Vegetation
    // -----------------------------
    [
      [-24, -6, 1.3],
      [-10, -3, 1.15],
      [0, -4, 1.0],
      [12, -2, 1.0],
      [25, -4, 1.2],
      [35, 4, 1.1],
      [28, 20, 1.1],
      [16, 26, 1.15],
      [0, 23, 1.2],
      [-16, 21, 1.25],
      [-28, 14, 1.1],
      [-34, -10, 1.25],
    ].forEach(([x, z, s]) => mansion.add(createPalm(x, z, s)));

    [
      [-8, 30, 1],
      [-3, 30, 1],
      [2, 30, 1],
      [7, 30, 1],
      [30, 10, 1],
      [30, 14, 1],
      [30, 18, 1],
      [-26, 17, 1],
      [-26, 21, 1],
    ].forEach(([x, z, s]) => mansion.add(createCypress(x, z, s)));

    // Purple ornamental tree
    const purpleTree = new THREE.Group();
    const purpleTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.55, 3.8, 8),
      trunkMat
    );
    purpleTrunk.position.y = 1.9;
    purpleTree.add(purpleTrunk);

    const purpleCrown = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 18, 18),
      new THREE.MeshStandardMaterial({
        color: "#b89ac0",
        roughness: 1,
        metalness: 0,
      })
    );
    purpleCrown.position.y = 5.4;
    purpleTree.add(purpleCrown);
    purpleTree.position.set(-17, 0, 18);
    setShadow(purpleTree);
    mansion.add(purpleTree);

    // -----------------------------
    // Camera framing target
    // -----------------------------
    mansion.position.set(0, 0, 0);

    // -----------------------------
    // Resize
    // -----------------------------
    const resize = () => {
      const width = mount.clientWidth;
      const height = Math.max(mount.clientHeight, 320);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    // -----------------------------
    // Animation
    // -----------------------------
    let frameId = 0;
    let t = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.003;

      ocean.position.y = -1.5 + Math.sin(t) * 0.06;
      ocean.rotation.z = Math.sin(t * 0.35) * 0.01;
      foamBand.material.opacity = 0.3 + (Math.sin(t * 2.2) + 1) * 0.08;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // -----------------------------
    // Cleanup
    // -----------------------------
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();

      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      });

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (minimal) {
    return (
      <>
        <div
          ref={mountRef}
          className="viewer-stage viewer-stage-modal"
          style={{
            width: "100%",
            minHeight: 420,
            borderRadius: 24,
            overflow: "hidden",
            background: "#dfe5ea",
          }}
        />
        <p className="map-hint">
          Arraste para orbitar, scroll para zoom e clique direito para mover a câmera.
        </p>
      </>
    );
  }

  return (
    <section className="mansao-panel">
      <div className="mansao-panel-top">
        <div>
          <p className="mansao-kicker">Maquete 3D</p>
          <h2>Mansão Interativa</h2>
        </div>
      </div>

      <div
        ref={mountRef}
        className="viewer-stage"
        style={{
          width: "100%",
          minHeight: 620,
          borderRadius: 28,
          overflow: "hidden",
          background: "#dfe5ea",
          boxShadow: "0 20px 70px rgba(0,0,0,0.12)",
        }}
      />

      <p className="map-hint">
        Arraste para orbitar, scroll para zoom e clique direito para mover a câmera.
      </p>
    </section>
  );
}

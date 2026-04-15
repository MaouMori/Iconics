"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Mansion3DViewerProps = {
  minimal?: boolean;
};

export default function Mansion3DViewer({ minimal = false }: Mansion3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080617");
    scene.fog = new THREE.Fog("#080617", 35, 120);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 260);
    camera.position.set(18, 12, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 4, 0);
    controls.minDistance = 8;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.1;

    const ambient = new THREE.AmbientLight("#caa8ff", 0.6);
    scene.add(ambient);

    const moonLight = new THREE.DirectionalLight("#e3d4ff", 1.2);
    moonLight.position.set(14, 22, 12);
    scene.add(moonLight);

    const rimLight = new THREE.PointLight("#9227ff", 12, 45, 2);
    rimLight.position.set(-8, 9, 8);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(36, 72),
      new THREE.MeshStandardMaterial({ color: "#17211f", roughness: 0.92, metalness: 0.04 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.RingGeometry(8, 11.2, 64),
      new THREE.MeshStandardMaterial({ color: "#2f3246", roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    scene.add(road);

    const mansion = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({ color: "#c8b7f0", roughness: 0.5, metalness: 0.15 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: "#402f5a", roughness: 0.75, metalness: 0.08 });

    const center = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 5), wallMaterial);
    center.position.y = 3;
    mansion.add(center);

    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), wallMaterial);
    leftWing.position.set(-5.5, 2, 0.3);
    mansion.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), wallMaterial);
    rightWing.position.set(5.5, 2, 0.3);
    mansion.add(rightWing);

    const roofCenter = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.4, 4), darkMaterial);
    roofCenter.position.y = 7.2;
    roofCenter.rotation.y = Math.PI / 4;
    mansion.add(roofCenter);

    const roofLeft = new THREE.Mesh(new THREE.ConeGeometry(2.9, 2.2, 4), darkMaterial);
    roofLeft.position.set(-5.5, 5, 0.3);
    roofLeft.rotation.y = Math.PI / 4;
    mansion.add(roofLeft);

    const roofRight = new THREE.Mesh(new THREE.ConeGeometry(2.9, 2.2, 4), darkMaterial);
    roofRight.position.set(5.5, 5, 0.3);
    roofRight.rotation.y = Math.PI / 4;
    mansion.add(roofRight);

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.8, 0.35),
      new THREE.MeshStandardMaterial({ color: "#2c163f", roughness: 0.5, metalness: 0.35 })
    );
    door.position.set(0, 1.4, 2.6);
    mansion.add(door);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshStandardMaterial({ color: "#f0b8ff", emissive: "#b522f9", emissiveIntensity: 1.5 })
    );
    orb.position.set(0, 4.8, 2.75);
    mansion.add(orb);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.6, 11, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: "#be4dff", transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    );
    beam.position.set(0, 7.5, 0);
    mansion.add(beam);

    const fenceMaterial = new THREE.MeshStandardMaterial({ color: "#5e567d", roughness: 0.8 });
    for (let i = 0; i < 24; i += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 0.2), fenceMaterial);
      const angle = (i / 24) * Math.PI * 2;
      post.position.set(Math.cos(angle) * 12.6, 0.7, Math.sin(angle) * 12.6);
      scene.add(post);
    }

    for (let i = 0; i < 22; i += 1) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.2, 8), new THREE.MeshStandardMaterial({ color: "#4d2f1e" }));
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.1, 12), new THREE.MeshStandardMaterial({ color: "#273028" }));
      const angle = (i / 22) * Math.PI * 2;
      const radius = 17 + (i % 3) * 1.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      trunk.position.set(x, 0.6, z);
      crown.position.set(x, 2.1, z);
      scene.add(trunk, crown);
    }

    scene.add(mansion);

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

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      orb.position.y = 4.8 + Math.sin(performance.now() * 0.0024) * 0.2;
      beam.material.opacity = 0.12 + (Math.sin(performance.now() * 0.002) + 1) * 0.05;
      mansion.rotation.y += 0.001;
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => material.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  if (minimal) {
    return (
      <>
        <div className="viewer-stage viewer-stage-modal" ref={mountRef} />
        <p className="map-hint">Arraste para orbitar, scroll para zoom e clique direito para mover a câmera.</p>
      </>
    );
  }

  return (
    <section className="mansao-panel">
      <div className="mansao-panel-top">
        <div>
          <p className="mansao-kicker">Visão Orbital</p>
          <h2>Exploração 3D da Mansão</h2>
        </div>
      </div>
      <div className="viewer-stage" ref={mountRef} />
      <p className="map-hint">Arraste para orbitar, scroll para zoom e clique direito para mover a câmera.</p>
    </section>
  );
}

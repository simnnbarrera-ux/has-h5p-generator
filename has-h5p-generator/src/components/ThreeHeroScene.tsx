"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeHeroScene({ className = "" }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    const baseZ = 11.5;
    camera.position.set(0, 0, (width / height) < 1 ? baseZ / (width / height) : baseZ);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.domElement.style.outline = "none";
    renderer.domElement.style.maxWidth = "100%";
    renderer.domElement.style.pointerEvents = "auto";
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Group to hold all 3D objects scaled comfortably to avoid any boundary clipping
    const group = new THREE.Group();
    group.scale.set(0.60, 0.60, 0.60);
    scene.add(group);

    // 1. Central Icosahedron Crystal (UAO Crimson with subtle transparency)
    const crystalGeo = new THREE.IcosahedronGeometry(2.1, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x8a1428,
      emissive: 0x3d0710,
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.35,
      ior: 1.5,
      opacity: 0.95,
      transparent: true,
      flatShading: true,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    group.add(crystalMesh);

    // 2. Wireframe overlay for mathematical discrete aesthetic
    const wireGeo = new THREE.WireframeGeometry(crystalGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
    });
    const wireLines = new THREE.LineSegments(wireGeo, wireMat);
    crystalMesh.add(wireLines);

    // 3. Orbiting Cyan Torus Ring (IEEE-754 / Discrete orbit)
    const ringGeo = new THREE.TorusGeometry(3.2, 0.045, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0099e6,
      emissive: 0x005580,
      roughness: 0.2,
      metalness: 0.8,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    ringMesh1.rotation.y = Math.PI / 6;
    group.add(ringMesh1);

    // 4. Secondary Counter-Orbiting Golden/Cyan Ring
    const ringGeo2 = new THREE.TorusGeometry(3.5, 0.035, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.3,
      metalness: 0.7,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI / 4;
    ringMesh2.rotation.y = Math.PI / 3;
    group.add(ringMesh2);

    // 5. Floating satellite discrete nodes (bits / states)
    const nodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x0099e6,
      roughness: 0.1,
      metalness: 0.9,
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 3.2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(
        Math.cos(angle) * dist,
        Math.sin(angle * 2) * 0.4,
        Math.sin(angle) * dist
      );
      group.add(node);
      nodes.push(node);
    }

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const cyanPoint = new THREE.PointLight(0x0099e6, 3.5, 15);
    cyanPoint.position.set(-4, -2, 3);
    scene.add(cyanPoint);

    const crimsonPoint = new THREE.PointLight(0x8a1428, 4.0, 15);
    crimsonPoint.position.set(4, 3, 2);
    scene.add(crimsonPoint);

    // Mouse interactivity
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.2;
      targetY = y * 1.2;
    };

    window.addEventListener("mousemove", onMouseMove);

    // Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      const baseDist = 11.5;
      camera.position.z = camera.aspect < 1 ? baseDist / camera.aspect : baseDist;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Group subtle sway and mouse response
      group.rotation.y = elapsed * 0.25 + mouseX * 0.6;
      group.rotation.x = Math.sin(elapsed * 0.3) * 0.15 + mouseY * 0.5;

      // Individual mesh rotations
      crystalMesh.rotation.y = elapsed * 0.35;
      crystalMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.2;

      ringMesh1.rotation.z = elapsed * 0.3;
      ringMesh2.rotation.z = -elapsed * 0.22;

      // Pulse floating nodes
      nodes.forEach((node, i) => {
        const offset = i * (Math.PI / 4);
        node.position.y = Math.sin(elapsed * 1.8 + offset) * 0.45;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[400px] md:h-[440px] flex items-center justify-center select-none pointer-events-auto ${className}`}
      aria-label="Escena 3D interactiva del Generador HAS H5P"
    />
  );
}

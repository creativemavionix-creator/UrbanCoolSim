"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Hero3DCanvasProps {
  isCooled?: boolean;
}

export function Hero3DCanvas({ isCooled = false }: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    try {
      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 14, 18);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);

      // Create an abstracted low-poly urban thermal block grid (20x20 blocks)
      const gridSize = 16;
      const blockWidth = 0.6;
      const spacing = 0.85;
      const group = new THREE.Group();
      scene.add(group);

      const blocks: { mesh: THREE.Mesh; baseHeight: number; x: number; z: number }[] = [];
      const boxGeo = new THREE.BoxGeometry(blockWidth, 1, blockWidth);

      // Palette definitions
      const baselineColor = new THREE.Color(0xef4444); // Hot Red
      const amberColor = new THREE.Color(0xf59e0b);    // Warm Amber
      const cooledColor = new THREE.Color(0x4A6CFF);    // Signature Cobalt
      const greenColor = new THREE.Color(0x10b981);     // Validated Green

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const x = (i - gridSize / 2) * spacing;
          const z = (j - gridSize / 2) * spacing;
          const dist = Math.sqrt(x * x + z * z);
          
          // Radial city density profile (taller blocks in the center)
          const baseHeight = Math.max(0.4, (1.0 - dist / 8.0) * 3.5 + Math.sin(i * 0.8) * Math.cos(j * 0.8) * 0.8);
          
          const mat = new THREE.MeshBasicMaterial({
            color: isCooled ? cooledColor : baselineColor,
            wireframe: false,
            transparent: true,
            opacity: 0.85,
          });

          const mesh = new THREE.Mesh(boxGeo, mat);
          mesh.position.set(x, baseHeight / 2, z);
          mesh.scale.set(1, baseHeight, 1);
          group.add(mesh);

          blocks.push({ mesh, baseHeight, x, z });
        }
      }

      // Add ground plane grid wireframe
      const gridHelper = new THREE.GridHelper(18, 20, 0x3A404F, 0x1E222D);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      // Mouse & Scroll interaction variables
      let mouseX = 0;
      let mouseY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / height) * 2 - 1);
      };
      window.addEventListener("mousemove", handleMouseMove);

      let animId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        if (!prefersReducedMotion) {
          targetRotY = mouseX * 0.25;
          targetRotX = mouseY * 0.15;
          group.rotation.y += (targetRotY - group.rotation.y) * 0.05 + 0.001;
          group.rotation.x += (targetRotX - group.rotation.x) * 0.05;

          // Dynamic wave displacement through the urban blocks
          for (let b of blocks) {
            const wave = Math.sin(elapsedTime * 1.5 + (b.x + b.z) * 0.6) * 0.25;
            const currentH = Math.max(0.2, b.baseHeight + wave);
            b.mesh.scale.y = currentH;
            b.mesh.position.y = currentH / 2;

            // Interpolate colors based on wave & state
            const norm = (b.baseHeight + wave) / 4.0;
            const targetColor = isCooled
              ? cooledColor.clone().lerp(greenColor, norm)
              : baselineColor.clone().lerp(amberColor, norm);
            (b.mesh.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.1);
          }
        }

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      console.warn("WebGL initialization failed, falling back to 2D canvas:", err);
      setHasWebGL(false);
    }
  }, [isCooled]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[420px] relative select-none">
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-elevated text-ink-muted text-xs font-mono">
          [Thermal Microclimate Mesh Fallback]
        </div>
      )}
    </div>
  );
}

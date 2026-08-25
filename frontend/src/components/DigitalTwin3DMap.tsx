"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface DigitalTwin3DMapProps {
  gridData: any;
  selectedLayer?: string;
  onCellSelect?: (cell: any) => void;
}

export function DigitalTwin3DMap({
  gridData,
  selectedLayer = "baseline_temperature_c",
  onCellSelect,
}: DigitalTwin3DMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<any | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !gridData || !gridData.layers) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 38, 48);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const rows = 50;
    const cols = 50;
    const spacing = 0.8;
    const group = new THREE.Group();
    scene.add(group);

    const baseT = gridData.layers.baseline_temperature_c;
    const bldgH = gridData.layers.building_height || gridData.layers.building_density;
    const bldgDens = gridData.layers.building_density;
    const vegFrac = gridData.layers.veg_fraction;
    const albedoLayer = gridData.layers.albedo;

    // Scientific Thermal Colormap lookup
    const getThermalColor = (temp: number) => {
      const norm = Math.max(0, Math.min(1, (temp - 30.0) / 20.0));
      const col = new THREE.Color();
      if (norm < 0.25) {
        col.setRGB(0.14, 0.38 + norm * 1.5, 0.92);
      } else if (norm < 0.50) {
        col.setRGB(0.1, 0.72 + (norm - 0.25) * 0.8, 0.8);
      } else if (norm < 0.75) {
        col.setRGB(0.96, 0.62 + (norm - 0.5) * 0.4, 0.05);
      } else {
        col.setRGB(0.92, 0.15 + (1 - norm) * 0.5, 0.15);
      }
      return col;
    };

    // InstancedMesh for 2,500 cells (high performance 60fps)
    const boxGeo = new THREE.BoxGeometry(0.72, 1, 0.72);
    const boxMat = new THREE.MeshLambertMaterial();
    const instancedMesh = new THREE.InstancedMesh(boxGeo, boxMat, rows * cols);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const cellDataArray: any[] = [];

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * spacing;
        const z = (r - rows / 2) * spacing;
        
        const temp = baseT?.[r]?.[c] ?? 42.0;
        const heightVal = bldgH?.[r]?.[c] ?? 1.0;
        const densVal = bldgDens?.[r]?.[c] ?? 0.3;
        
        // Extrude height based on building density/height
        const h = Math.max(0.3, (heightVal / 8.0) + (densVal * 2.5));

        dummy.position.set(x, h / 2, z);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(idx, dummy.matrix);
        instancedMesh.setColorAt(idx, getThermalColor(temp));

        cellDataArray.push({
          row: r,
          col: c,
          temp: temp.toFixed(1),
          height: typeof heightVal === "number" ? heightVal.toFixed(1) : heightVal,
          density: densVal,
          veg: vegFrac?.[r]?.[c] ?? 0,
          albedo: albedoLayer?.[r]?.[c] ?? 0.18,
          x,
          z,
          h,
        });

        idx++;
      }
    }

    instancedMesh.instanceColor!.needsUpdate = true;
    group.add(instancedMesh);

    // Directional Lighting for building faces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Raycasting for cell selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(instancedMesh);

      if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
        const id = intersects[0].instanceId;
        const cell = cellDataArray[id];
        setHoveredInfo(cell);
        if (onCellSelect) onCellSelect(cell);
      }
    };

    container.addEventListener("mousemove", handlePointerMove);

    // Gentle orbit rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      group.rotation.y += dx * 0.006;
      group.rotation.x = Math.max(-0.2, Math.min(0.8, group.rotation.x + dy * 0.006));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleDragMove);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        group.rotation.y += 0.0008; // subtle ambient rotation
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
      container.removeEventListener("mousemove", handlePointerMove);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gridData, selectedLayer, onCellSelect]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] relative select-none cursor-grab active:cursor-grabbing">
      {/* Precision 3D Viewport Controls Hint */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded bg-surface-base/80 border border-surface-border text-[11px] font-mono text-ink-muted">
        3D Isometric Mesh · Drag to rotate
      </div>

      {hoveredInfo && (
        <div className="absolute bottom-4 right-4 z-10 p-3.5 rounded bg-surface-elevated/95 border border-surface-border text-xs font-mono shadow-floating space-y-1">
          <div className="text-ink-primary font-semibold">
            Cell [{hoveredInfo.row}, {hoveredInfo.col}] · 10m Microgrid
          </div>
          <div className="text-ink-secondary">
            LST: <strong className="text-status-critical">{hoveredInfo.temp}°C</strong>
          </div>
          <div className="text-ink-secondary">
            Height: {hoveredInfo.height}m · Density: {Math.round(hoveredInfo.density * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

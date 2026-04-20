import * as THREE from "three";

/** Genera posiciones para árboles en el bosque */
export function generateTreePositions(count: number): { x: number; z: number; scale: number; rotation: number }[] {
  const trees = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const radius = 4 + Math.random() * 6;
    trees.push({
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      scale: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
    });
  }
  return trees;
}

/** Genera la geometría de un corazón 3D extruido */
export function createHeartShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  shape.moveTo(x + 0.5, y + 0.5);
  shape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
  shape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
  shape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
  shape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
  shape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
  shape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
  return shape;
}

/** Genera posiciones de hojas flotantes alrededor de un árbol */
export function generateLeafPositions(count: number, treeX: number, treeZ: number, treeHeight: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.8;
    const h = treeHeight * (0.4 + Math.random() * 0.6);
    positions[i * 3]     = treeX + Math.cos(angle) * r;
    positions[i * 3 + 1] = h;
    positions[i * 3 + 2] = treeZ + Math.sin(angle) * r;
  }
  return positions;
}

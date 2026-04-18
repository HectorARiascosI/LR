import * as THREE from "three";

/**
 * Genera puntos distribuidos en la superficie de un corazón 3D.
 * Combina el contorno paramétrico con relleno volumétrico.
 */
export function generateHeartPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const scale = 2.0;

  for (let i = 0; i < count; i++) {
    // 70% en el contorno, 30% en el volumen interior
    const onSurface = Math.random() < 0.70;

    let x: number, y: number, z: number;

    if (onSurface) {
      // Contorno paramétrico del corazón
      const t = Math.random() * Math.PI * 2;
      x = scale * 16 * Math.pow(Math.sin(t), 3) * 0.052;
      y = scale * (
        13 * Math.cos(t)
        - 5  * Math.cos(2 * t)
        - 2  * Math.cos(3 * t)
        -      Math.cos(4 * t)
      ) * 0.052;
      // Profundidad: más grueso en el centro, fino en los bordes
      const thickness = 0.35 * (1 - Math.abs(Math.sin(t * 0.5)) * 0.5);
      z = (Math.random() - 0.5) * thickness;
    } else {
      // Relleno interior — muestreo por rechazo
      let attempts = 0;
      do {
        x = (Math.random() - 0.5) * scale * 1.8;
        y = (Math.random() - 0.5) * scale * 1.6;
        attempts++;
      } while (!isInsideHeart(x / scale, y / scale) && attempts < 30);

      z = (Math.random() - 0.5) * 0.25;
    }

    // Ruido micro para aspecto orgánico
    const noise = 0.04;
    positions[i * 3]     = x + (Math.random() - 0.5) * noise;
    positions[i * 3 + 1] = y + (Math.random() - 0.5) * noise;
    positions[i * 3 + 2] = z + (Math.random() - 0.5) * noise * 0.5;
  }

  return positions;
}

/** Verifica si un punto (x,y) normalizado está dentro del corazón */
function isInsideHeart(nx: number, ny: number): boolean {
  // Ecuación implícita del corazón: (x²+y²-1)³ - x²y³ ≤ 0
  const x = nx * 0.9;
  const y = ny * 0.9 - 0.1; // offset vertical
  const val = Math.pow(x*x + y*y - 1, 3) - x*x * Math.pow(y, 3);
  return val <= 0.05;
}

/**
 * Genera posiciones aleatorias en el espacio (estado inicial).
 * Distribución esférica para que vengan de todas direcciones.
 */
export function generateRandomPoints(count: number, spread: number = 12): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = spread * (0.3 + Math.random() * 0.7);

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8 - 0.5;
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

/**
 * Interpolación suave entre dos conjuntos de posiciones.
 */
export function lerpPositions(
  from: Float32Array,
  to: Float32Array,
  t: number,
  out: Float32Array
): void {
  const eased = easeInOutQuart(Math.max(0, Math.min(1, t)));
  for (let i = 0; i < out.length; i++) {
    out[i] = from[i] + (to[i] - from[i]) * eased;
  }
}

function easeInOutQuart(t: number): number {
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

// Геометрия мира: стены/мебель (она же — коллайдеры) и зоны.
// Единицы — метры. Игрок смотрит по -Z при yaw = 0.
export const WALL_H = 4.2
export const BOUNDS = { minX: -21.6, maxX: 21.6, minZ: -21.6, maxZ: 17.6 }

// [cx, cz, w, d] — стены (axis-aligned)
const wall = (x1, z1, x2, z2, t = 0.4) => [
  (x1 + x2) / 2,
  (z1 + z2) / 2,
  Math.abs(x2 - x1) || t,
  Math.abs(z2 - z1) || t,
]

export const WALLS = [
  // внешний периметр
  wall(-22, -22, 22, -22), wall(-22, 18, 22, 18), wall(-22, -22, -22, 18), wall(22, -22, 22, 18),
  // Кинотеатр (север): боковые стены и фронт с дверью |x|<3
  wall(-10, -22, -10, -8), wall(10, -22, 10, -8),
  wall(-10, -8, -3, -8), wall(3, -8, 10, -8),
  // Библиотека (запад): стена к холлу с дверью |z|<3, боковые стены
  wall(-8, -8, -8, -3), wall(-8, 3, -8, 8),
  wall(-22, -8, -8, -8), wall(-22, 8, -8, 8),
  // Смета (восток)
  wall(8, -8, 8, -3), wall(8, 3, 8, 8),
  wall(8, -8, 22, -8), wall(8, 8, 22, 8),
]

// Мебель: { p:[x,y,z], s:[w,h,d], c:цвет, e:светится, solid:коллизия }
export const PROPS = [
  // --- Кинотеатр ---
  { p: [0, 0.2, -21.3], s: [11, 0.4, 1], c: '#14161d', solid: true },
  ...[-1, 0, 1].flatMap((i) =>
    [-14, -16.5].map((z) => ({ p: [i * 2.6, 0.45, z], s: [1.7, 0.9, 1.1], c: '#2a2c36', solid: true })),
  ),
  { p: [-6.3, 1.5, -19], s: [0.25, 3, 0.25], c: '#f2a38a', e: true, solid: true },
  { p: [6.3, 1.5, -19], s: [0.25, 3, 0.25], c: '#f2a38a', e: true, solid: true },
  // --- Библиотека ---
  { p: [-21.2, 1.6, 0], s: [0.8, 3.2, 12], c: '#1b1814', solid: true },
  { p: [-15, 1.6, -7.2], s: [11, 3.2, 0.8], c: '#1b1814', solid: true },
  { p: [-15, 1.6, 7.2], s: [11, 3.2, 0.8], c: '#1b1814', solid: true },
  { p: [-16, 0.4, 0], s: [4.4, 0.8, 1.8], c: '#2a2c36', solid: true }, // монтажный стол
  // --- Смета ---
  { p: [16, 0.4, 0], s: [5, 0.8, 2.2], c: '#262a3a', solid: true }, // стол переговоров
  { p: [12.5, 0.45, 0], s: [0.9, 0.9, 0.9], c: '#2a2c36', solid: true },
  { p: [19.5, 0.45, 0], s: [0.9, 0.9, 0.9], c: '#2a2c36', solid: true },
  // --- Холл ---
  { p: [0, 0.3, 0], s: [2.4, 0.6, 2.4], c: '#1b1d27', solid: true },
]

// Прямоугольники столкновений: [minX, maxX, minZ, maxZ]
export const COLLIDERS = [
  ...WALLS.map(([x, z, w, d]) => [x - w / 2, x + w / 2, z - d / 2, z + d / 2]),
  ...PROPS.filter((p) => p.solid).map(({ p, s }) => [
    p[0] - s[0] / 2, p[0] + s[0] / 2, p[2] - s[2] / 2, p[2] + s[2] / 2,
  ]),
]

export const ZONES = {
  hall: { key: '1', label: 'Холл', modal: null, center: [0, 0], fly: { x: 0, z: 10, yaw: 0 }, color: '#f4de8f' },
  cinema: { key: '2', label: 'Кинотеатр', modal: 'cinema', center: [0, -15], radius: 9, fly: { x: 0, z: -9.6, yaw: 0 }, color: '#f2a38a' },
  library: { key: '3', label: 'Библиотека', modal: 'library', center: [-15, 0], radius: 8, fly: { x: -9.6, z: 0, yaw: Math.PI / 2 }, color: '#f5d77a' },
  estimator: { key: '4', label: 'Смета', modal: 'estimator', center: [15, 0], radius: 8, fly: { x: 9.6, z: 0, yaw: -Math.PI / 2 }, color: '#7276e1' },
}
export const SPAWN = { x: 0, z: 13, yaw: 0 }

export function zoneAt(x, z) {
  for (const [id, zn] of Object.entries(ZONES)) {
    if (!zn.modal) continue
    if (Math.hypot(x - zn.center[0], z - zn.center[1]) < zn.radius) return id
  }
  return null
}

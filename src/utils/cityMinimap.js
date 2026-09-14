// City Track Road Network for 2D Radar Minimap
export const CITY_BOUNDS = {
  minX: -36,
  maxX: 52,
  minZ: -78,
  maxZ: 38,
  width: 88,
  height: 116,
};

// Key open arterial city road corridors [fromX, fromZ, toX, toZ, width]
export const CITY_STREETS = [
  // North-South Arteries
  [6.5, -70, 6.5, 32, 14],   // Central Grand Avenue
  [-18, -70, -18, 32, 12],   // West Avenue
  [-28, -70, -28, 32, 10],   // Far West Street
  [22, -70, 22, 32, 12],     // East Avenue
  [46, -70, 46, 32, 10],     // Far East Street

  // East-West Cross Streets
  [-30, 32, 48, 32, 12],    // North Boulevard Loop
  [-30, 8, 48, 8, 12],      // Mid-North Street
  [-30, -15, 48, -15, 12],  // Central Crossway
  [-30, -45, 48, -45, 12],  // South Crossway
  [-30, -68, 48, -68, 12],  // South Boulevard Loop
];

export function toCityMinimapCoords(worldX, worldZ, canvasWidth = 130, canvasHeight = 130) {
  const padding = 14;
  const usableW = canvasWidth - padding * 2;
  const usableH = canvasHeight - padding * 2;

  const nx = (worldX - CITY_BOUNDS.minX) / CITY_BOUNDS.width;
  const nz = (worldZ - CITY_BOUNDS.minZ) / CITY_BOUNDS.height;

  return {
    x: Math.min(canvasWidth - padding, Math.max(padding, padding + nx * usableW)),
    y: Math.min(canvasHeight - padding, Math.max(padding, padding + (1 - nz) * usableH)),
  };
}

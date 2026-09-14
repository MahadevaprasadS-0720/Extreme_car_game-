import * as THREE from 'three';

/**
 * Procedural PBR Texture Generator
 * Creates crisp, high-resolution seamless PBR maps on HTML5 Canvas
 */

// Helper to create repeated Three.js texture from canvas
function canvasToTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Seamless Deep Black Tar / Asphalt Road Texture Generator
 * Produces a rich, dark bitumen tar road surface with fine mineral aggregate
 * and subtle sheen requested by the user ("ಬ್ಲಾಕ್ ರೋಡ್ / ಟಾರ್ ರೋಡ್").
 */
export function getDarkTarRoadTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep rich black bitumen base (#0d0e11)
  ctx.fillStyle = '#0d0e11';
  ctx.fillRect(0, 0, size, size);

  // Fine mineral aggregate & tar pores
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 16;
    const pebble = Math.random() > 0.94 ? (Math.random() * 36 - 10) : 0;
    const val = THREE.MathUtils.clamp(14 + noise + pebble, 8, 45);

    data[i] = Math.round(val * 0.95);       // R
    data[i + 1] = Math.round(val);          // G
    data[i + 2] = Math.round(val * 1.08);   // B (subtle cool slate-black asphalt tone)
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle longitudinal bitumen compaction sheen
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, 'rgba(8, 9, 12, 0.35)');
  grad.addColorStop(0.3, 'rgba(18, 20, 26, 0.12)');
  grad.addColorStop(0.7, 'rgba(18, 20, 26, 0.12)');
  grad.addColorStop(1, 'rgba(8, 9, 12, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return canvasToTexture(canvas, 32, 32);
}

/**
 * Asphalt Albedo / Diffuse map
 */
export function getAsphaltAlbedoTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base dark asphalt
  ctx.fillStyle = '#1e1f23';
  ctx.fillRect(0, 0, size, size);

  // Micro gravel noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 32;
    const pebble = Math.random() > 0.94 ? (Math.random() - 0.5) * 60 : 0;
    const val = THREE.MathUtils.clamp(32 + noise + pebble, 18, 55);

    // Warm-cool aggregate tint variation
    data[i] = val; // R
    data[i + 1] = val + (Math.random() * 2 - 1); // G
    data[i + 2] = val + (Math.random() * 4 - 1); // B (subtle blue-grey asphalt tone)
  }
  ctx.putImageData(imgData, 0, 0);

  // Left & right solid boundary lines
  ctx.fillStyle = '#e8ecf2';
  ctx.fillRect(size * 0.05, 0, size * 0.016, size);
  ctx.fillRect(size * 0.934, 0, size * 0.016, size);

  // Center dashed passing line
  const dashLength = size / 8;
  ctx.fillStyle = 'rgba(235, 238, 245, 0.85)';
  for (let y = 0; y < size; y += dashLength * 2) {
    ctx.fillRect(size * 0.495, y, size * 0.01, dashLength);
  }

  // Dark rubber racing grooves (accumulated tire rubber along the racing line)
  const leftGroove = ctx.createLinearGradient(size * 0.22, 0, size * 0.38, 0);
  leftGroove.addColorStop(0, 'rgba(10, 10, 12, 0)');
  leftGroove.addColorStop(0.5, 'rgba(10, 10, 12, 0.45)');
  leftGroove.addColorStop(1, 'rgba(10, 10, 12, 0)');
  ctx.fillStyle = leftGroove;
  ctx.fillRect(size * 0.2, 0, size * 0.2, size);

  const rightGroove = ctx.createLinearGradient(size * 0.62, 0, size * 0.78, 0);
  rightGroove.addColorStop(0, 'rgba(10, 10, 12, 0)');
  rightGroove.addColorStop(0.5, 'rgba(10, 10, 12, 0.45)');
  rightGroove.addColorStop(1, 'rgba(10, 10, 12, 0)');
  ctx.fillStyle = rightGroove;
  ctx.fillRect(size * 0.6, 0, size * 0.2, size);

  return canvasToTexture(canvas, 1, 1);
}

/**
 * Asphalt Normal map generated via Sobel height gradient
 */
export function getAsphaltNormalTexture() {
  const size = 512;
  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hCtx = heightCanvas.getContext('2d');

  // Generate height noise
  const hData = hCtx.createImageData(size, size);
  const hBuf = new Float32Array(size * size);

  for (let i = 0; i < size * size; i++) {
    const n = Math.random() * 0.7 + (Math.random() > 0.95 ? 0.3 : 0);
    hBuf[i] = n;
  }

  // Sobel filtering for realistic 3D micro-gravel bump
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const nCtx = normalCanvas.getContext('2d');
  const nData = nCtx.createImageData(size, size);

  const strength = 2.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = y * size + x;
      const xL = ((x - 1 + size) % size) + y * size;
      const xR = ((x + 1) % size) + y * size;
      const yT = x + (((y - 1 + size) % size) * size);
      const yB = x + (((y + 1) % size) * size);

      const dx = (hBuf[xR] - hBuf[xL]) * strength;
      const dy = (hBuf[yB] - hBuf[yT]) * strength;
      const dz = 1.0;

      // Normalize vector
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      const pIdx = idx * 4;
      nData.data[pIdx] = Math.round(nx * 255);
      nData.data[pIdx + 1] = Math.round(ny * 255);
      nData.data[pIdx + 2] = Math.round(nz * 255);
      nData.data[pIdx + 3] = 255;
    }
  }

  nCtx.putImageData(nData, 0, 0);
  return canvasToTexture(normalCanvas, 1, 1);
}

/**
 * Asphalt Roughness map
 * Polished rubber racing lines are smoother/glossier (lower roughness ~0.5),
 * while raw aggregate is rougher (~0.85).
 */
export function getAsphaltRoughnessTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base rough asphalt (grey level ~200 = roughness 0.78)
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, size, size);

  // Micro roughness speckle
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const val = 195 + (Math.random() - 0.5) * 45;
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  // Smooth racing line rubber (darker = lower roughness = more specular reflection)
  ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
  ctx.fillRect(size * 0.22, 0, size * 0.16, size);
  ctx.fillRect(size * 0.62, 0, size * 0.16, size);

  // White paint lines have lower roughness (~0.5)
  ctx.fillStyle = 'rgba(130, 130, 130, 0.6)';
  ctx.fillRect(size * 0.05, 0, size * 0.016, size);
  ctx.fillRect(size * 0.934, 0, size * 0.016, size);

  return canvasToTexture(canvas, 1, 1);
}

/**
 * Asphalt Ambient Occlusion map
 */
export function getAsphaltAoTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // Subtle crevice darkening
    const pebbleCavity = Math.random() > 0.85 ? Math.random() * 60 : 0;
    const val = 255 - pebbleCavity;
    imgData.data[i] = val;
    imgData.data[i + 1] = val;
    imgData.data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  return canvasToTexture(canvas, 1, 1);
}

/**
 * Red & White Apex Curb Texture
 */
export function getCurbTexture() {
  const width = 256;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Alternating red and white diagonal curb ribs
  const stripeHeight = height / 4;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d31f1f' : '#f2f2f2';
    ctx.fillRect(0, i * stripeHeight, width, stripeHeight);

    // Weathering / rubber scuff marks on curb
    ctx.fillStyle = 'rgba(30, 30, 35, 0.15)';
    ctx.fillRect(0, i * stripeHeight, width * 0.35, stripeHeight);

    // Top chamfer highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(0, i * stripeHeight, width, 4);

    // Bottom shadow bevel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, (i + 1) * stripeHeight - 5, width, 5);
  }

  return canvasToTexture(canvas, 1, 1);
}

/**
 * Corrugated Armco Crash Barrier Texture
 */
export function getBarrierTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Base galvanized steel
  ctx.fillStyle = '#b8c0c8';
  ctx.fillRect(0, 0, 128, 128);

  // Horizontal corrugated w-beam ridges
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, '#78828c');
  grad.addColorStop(0.2, '#f0f4f8');
  grad.addColorStop(0.4, '#8a94a0');
  grad.addColorStop(0.6, '#f8fafc');
  grad.addColorStop(0.8, '#707a84');
  grad.addColorStop(1.0, '#a0abb6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  return canvasToTexture(canvas, 4, 1);
}

/**
 * Photorealistic 2x2 Twill Weave Carbon Fiber Texture
 * Generates diagonal directional twill yarns with subtle fiber luster
 */
export function getCarbonFiberTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base deep carbon composite resin
  ctx.fillStyle = '#101114';
  ctx.fillRect(0, 0, size, size);

  // 2x2 Twill weave pattern
  const unit = 16;
  for (let y = 0; y < size; y += unit) {
    for (let x = 0; x < size; x += unit) {
      const isShifted = ((Math.floor(x / unit) + Math.floor(y / unit)) % 2 === 0);
      
      // Yarn patch with diagonal sheen gradient
      const grad = ctx.createLinearGradient(x, y, x + unit, y + unit);
      if (isShifted) {
        grad.addColorStop(0.0, '#1c1e24');
        grad.addColorStop(0.3, '#323640');
        grad.addColorStop(0.5, '#404450');
        grad.addColorStop(0.7, '#2a2d36');
        grad.addColorStop(1.0, '#14161a');
      } else {
        grad.addColorStop(0.0, '#14161a');
        grad.addColorStop(0.3, '#22252c');
        grad.addColorStop(0.5, '#2e323a');
        grad.addColorStop(0.7, '#1f2128');
        grad.addColorStop(1.0, '#0f1013');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(x + 0.5, y + 0.5, unit - 1, unit - 1);

      // Micro fiber thread lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let f = 2; f < unit; f += 4) {
        ctx.beginPath();
        if (isShifted) {
          ctx.moveTo(x + f, y);
          ctx.lineTo(x + f, y + unit);
        } else {
          ctx.moveTo(x, y + f);
          ctx.lineTo(x + unit, y + f);
        }
        ctx.stroke();
      }
    }
  }

  return canvasToTexture(canvas, 6, 6);
}

/**
 * High-Performance Cross-Drilled Brake Rotor Texture
 * Features concentric friction bands, radial cross-drilled cooling holes, and inner bell
 */
export function getBrakeRotorTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;

  // Background clear
  ctx.clearRect(0, 0, size, size);

  // Concentric friction surface rings (machined disc finish)
  for (let r = 120; r > 50; r--) {
    const shade = 180 + Math.sin(r * 1.5) * 25 + (Math.random() - 0.5) * 15;
    ctx.strokeStyle = `rgb(${shade}, ${shade}, ${shade + 5})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cross-drilled cooling holes (spiral aerodynamic rows)
  ctx.fillStyle = '#111215';
  const numArms = 12;
  const holesPerArm = 5;
  for (let a = 0; a < numArms; a++) {
    const baseAngle = (a / numArms) * Math.PI * 2;
    for (let h = 0; h < holesPerArm; h++) {
      const radius = 62 + h * 11;
      const angle = baseAngle + (h * 0.12);
      const hx = center + Math.cos(angle) * radius;
      const hy = center + Math.sin(angle) * radius;

      // Dark hole interior
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Chamfer ring highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // Inner hub / mounting hat
  ctx.fillStyle = '#22252a';
  ctx.beginPath();
  ctx.arc(center, center, 50, 0, Math.PI * 2);
  ctx.fill();

  return canvasToTexture(canvas, 1, 1);
}

/**
 * Performance Tire Tread Texture
 */
export function getTireTreadTexture() {
  const width = 128;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark vulcanized rubber
  ctx.fillStyle = '#1a1b1e';
  ctx.fillRect(0, 0, width, height);

  // Longitudinal water evacuation channels
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(width * 0.22, 0, 8, height);
  ctx.fillRect(width * 0.46, 0, 8, height);
  ctx.fillRect(width * 0.70, 0, 8, height);

  // Lateral sipes
  ctx.strokeStyle = '#0e0f12';
  ctx.lineWidth = 2.5;
  for (let y = 0; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width * 0.22, y + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.28, y + 10);
    ctx.lineTo(width * 0.46, y + 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.52, y + 15);
    ctx.lineTo(width * 0.70, y + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.76, y + 5);
    ctx.lineTo(width, y - 5);
    ctx.stroke();
  }

  return canvasToTexture(canvas, 1, 4);
}

/**
 * Architectural Building Facade Texture for 4-Sided Solid Buildings
 * Features realistic stone/brick facade with multi-story window grids, sills, and cornices
 */
export function getBuildingFacadeTexture() {
  const width = 512;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base warm European brownstone / masonry tone matching city buildings
  ctx.fillStyle = '#7a6756';
  ctx.fillRect(0, 0, width, height);

  // Subtle brick / masonry texture noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    data[i] = THREE.MathUtils.clamp(data[i] + n, 0, 255);
    data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + n, 0, 255);
    data[i + 2] = THREE.MathUtils.clamp(data[i + 2] + n * 0.8, 0, 255);
  }
  ctx.putImageData(imgData, 0, 0);

  // Horizontal stone stringcourses / cornices (floors)
  const floors = 4;
  const floorHeight = height / floors;

  for (let f = 0; f < floors; f++) {
    const yTop = f * floorHeight;

    // Cornice ledge
    ctx.fillStyle = '#4e4034';
    ctx.fillRect(0, yTop, width, 8);
    ctx.fillStyle = '#9e8772';
    ctx.fillRect(0, yTop + 2, width, 4);

    // Windows (3 per floor)
    const cols = 3;
    const winWidth = width / (cols + 1) * 0.65;
    const winHeight = floorHeight * 0.58;

    for (let c = 0; c < cols; c++) {
      const winX = (c + 1) * (width / (cols + 1)) - winWidth / 2;
      const winY = yTop + 16;

      // Window stone lintel
      ctx.fillStyle = '#3a2f26';
      ctx.fillRect(winX - 3, winY - 4, winWidth + 6, 4);

      // Window frame
      ctx.fillStyle = '#221a14';
      ctx.fillRect(winX, winY, winWidth, winHeight);

      // Glass panes (warm dusk reflection)
      const glassGrad = ctx.createLinearGradient(winX, winY, winX, winY + winHeight);
      glassGrad.addColorStop(0, '#2d3e4f');
      glassGrad.addColorStop(0.5, '#1e2832');
      glassGrad.addColorStop(1, '#ffaa44'); // warm interior amber light
      ctx.fillStyle = glassGrad;
      ctx.fillRect(winX + 2, winY + 2, winWidth - 4, winHeight - 4);

      // Window mullions (cross bars)
      ctx.fillStyle = '#221a14';
      ctx.fillRect(winX + winWidth / 2 - 1, winY + 2, 2, winHeight - 4);
      ctx.fillRect(winX + 2, winY + winHeight * 0.45, winWidth - 4, 2);

      // Stone sill
      ctx.fillStyle = '#9e8772';
      ctx.fillRect(winX - 4, winY + winHeight, winWidth + 8, 5);
      ctx.fillStyle = '#3a2f26';
      ctx.fillRect(winX - 4, winY + winHeight + 5, winWidth + 8, 2);
    }
  }

  // Ground level architectural base plinth
  ctx.fillStyle = '#4a3d31';
  ctx.fillRect(0, height - 14, width, 14);

  return canvasToTexture(canvas, 2, 2);
}

/**
 * Concrete Rooftop Texture
 */
export function getRoofTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3c3a38';
  ctx.fillRect(0, 0, size, size);

  // Gravel tar noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 35;
    data[i] = THREE.MathUtils.clamp(data[i] + n, 0, 255);
    data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + n, 0, 255);
    data[i + 2] = THREE.MathUtils.clamp(data[i + 2] + n, 0, 255);
  }
  ctx.putImageData(imgData, 0, 0);

  return canvasToTexture(canvas, 4, 4);
}


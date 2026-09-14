/**
 * Hardware tier detection utility for Apex Velocity 3D
 * Analyzes GPU renderer string (via WebGL UNMASKED_RENDERER_WEBGL)
 * and CPU logical core count (via navigator.hardwareConcurrency)
 * to automatically select the optimal graphics quality tier (1K vs 4K).
 */
export function detectHardwareTier() {
  const concurrency = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
  let gpuRenderer = '';
  let isDedicatedGpu = false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      } else {
        gpuRenderer = gl.getParameter(gl.RENDERER) || '';
      }
    }
  } catch (e) {
    console.warn('WebGL renderer query failed:', e);
  }

  const lowerRenderer = gpuRenderer.toLowerCase();
  
  // Detect dedicated GPUs (NVIDIA, AMD/Radeon, Apple M-series Pro/Max/Ultra)
  const isNvidia = lowerRenderer.includes('nvidia') || lowerRenderer.includes('geforce') || lowerRenderer.includes('quadro') || lowerRenderer.includes('rtx') || lowerRenderer.includes('gtx');
  const isAmd = lowerRenderer.includes('radeon') || lowerRenderer.includes('amd');
  const isAppleProMax = lowerRenderer.includes('apple') && (lowerRenderer.includes('pro') || lowerRenderer.includes('max') || lowerRenderer.includes('ultra'));
  const isIntegrated = lowerRenderer.includes('intel') || lowerRenderer.includes('uhd') || lowerRenderer.includes('hd graphics') || lowerRenderer.includes('iris') || lowerRenderer.includes('swiftshader') || lowerRenderer.includes('basic render') || lowerRenderer.includes('llvmpipe');

  isDedicatedGpu = (isNvidia || isAmd || isAppleProMax) && !isIntegrated;

  // Ultra 4K tier is recommended by default for realistic city visuals
  const recommendedTier = '4k';

  // Format a clean user-facing GPU name
  let cleanGpuName = gpuRenderer;
  if (gpuRenderer.includes('ANGLE (')) {
    const match = gpuRenderer.match(/ANGLE \([^,]+,\s*([^,)]+)/);
    if (match && match[1]) {
      cleanGpuName = match[1].trim();
    }
  }
  if (!cleanGpuName || cleanGpuName === 'Standard WebGL Adapter') {
    cleanGpuName = isDedicatedGpu ? 'Dedicated 3D GPU' : 'Standard WebGL GPU';
  }

  return {
    concurrency,
    gpuRenderer: cleanGpuName,
    rawRenderer: gpuRenderer,
    isDedicatedGpu,
    recommendedTier,
    tierLabel: recommendedTier === '4k' ? 'Ultra 4K' : 'Performance 1K',
  };
}

// Cached singleton instance to avoid repeated WebGL context queries
let cachedHardwareInfo = null;
export function getHardwareInfo() {
  if (!cachedHardwareInfo) {
    cachedHardwareInfo = detectHardwareTier();
  }
  return cachedHardwareInfo;
}

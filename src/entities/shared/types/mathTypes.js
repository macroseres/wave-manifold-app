// Tipos matemáticos centrais da Wave Manifold Explorer.
// Este arquivo não importa React nem Three.js.
// A aplicação ainda usa JavaScript; por isso os tipos são descritos via JSDoc.

/**
 * @typedef {Object} WavePoint
 * @property {number} t  Coordenada tau usada internamente como t.
 * @property {number} Y  Coordenada transversal Y.
 * @property {number} z  Coordenada física z; a compactificação ocorre na renderização.
 * @property {[number, number, number]=} coords Forma pronta para renderização.
 */

/**
 * @typedef {'hugoniot'|'rarefaction'|'composite'|'characteristic'|'intersection'} WaveFamily
 */

/**
 * @typedef {'minus'|'plus'} WaveDirection
 */

/**
 * @typedef {'decrease'|'increase'|'none'} SpeedOrientation
 */


/**
 * @typedef {Object} WaveBifoliation
 * @property {string} name
 * @property {WaveFamily} family
 * @property {WaveLeaf|null} minus  Folha negativa/orientada por convenção da família.
 * @property {WaveLeaf|null} plus   Folha positiva/orientada por convenção da família.
 * @property {Object=} metadata
 */

/**
 * @typedef {Object} WaveCurve
 * @property {string} name
 * @property {WaveFamily} family
 * @property {WaveDirection} direction
 * @property {WavePoint[][]} segments
 * @property {number[]} speeds
 * @property {boolean[]} admissible
 * @property {SpeedOrientation} orientation
 * @property {Object=} metadata
 */

/**
 * @typedef {Object} WaveSurface
 * @property {string} name
 * @property {string} family
 * @property {Function=} implicitF
 * @property {Function=} parameterization
 * @property {Object=} metadata
 */

/**
 * @typedef {Object} WaveLeaf
 * @property {string} name
 * @property {WaveFamily} family
 * @property {WaveDirection} direction
 * @property {SpeedOrientation} orientation
 * @property {WavePoint=} basePoint
 * @property {WaveCurve} curve
 * @property {Object=} metadata
 */

export function finite(...values) {
  return values.every(Number.isFinite)
}

export function normalizeWavePoint(point) {
  if (!point) return null
  const t = Number.isFinite(point.t) ? point.t : Array.isArray(point.coords) ? point.coords[0] : undefined
  const Y = Number.isFinite(point.Y) ? point.Y : Array.isArray(point.coords) ? point.coords[1] : undefined
  const z = Number.isFinite(point.z) ? point.z : Array.isArray(point.coords) ? point.coords[2] : undefined
  if (!finite(t, Y, z)) return null
  return { ...point, t, Y, z, coords: [t, Y, z] }
}

export function normalizeWaveSegment(points = []) {
  const segment = []
  for (const point of points) {
    const normalizedPoint = normalizeWavePoint(point)
    if (normalizedPoint) segment.push(normalizedPoint)
  }
  return segment
}

export function normalizeWaveSegments(segments = []) {
  const normalizedSegments = []
  for (const segment of segments) {
    const normalizedSegment = normalizeWaveSegment(segment)
    if (normalizedSegment.length >= 2) normalizedSegments.push(normalizedSegment)
  }
  return normalizedSegments
}

export function flattenSegments(segments = []) {
  return segments.flatMap((segment) => segment ?? [])
}

export function createWaveCurve({
  name,
  family,
  direction = 'minus',
  segments = [],
  speeds = [],
  admissible = [],
  orientation = 'none',
  metadata = {},
}) {
  return {
    name,
    family,
    direction,
    segments: normalizeWaveSegments(segments),
    speeds,
    admissible,
    orientation,
    metadata,
  }
}

export function createWaveLeaf({ name, family, direction, orientation, basePoint = null, curve, metadata = {} }) {
  return {
    name,
    family,
    direction,
    orientation,
    basePoint: normalizeWavePoint(basePoint),
    curve,
    metadata,
  }
}


export function createWaveBifoliation({ name, family, minus = null, plus = null, metadata = {} }) {
  return {
    name,
    family,
    minus,
    plus,
    metadata,
  }
}

export const EPS = 1e-12

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function isFiniteNumber(value) {
  return Number.isFinite(value)
}

export function safeEval(fn, x) {
  const y = fn(x)
  return Number.isFinite(y) ? y : Number.NaN
}

export function dedupeSortedNumbers(values, tolerance = 1e-8) {
  return values
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > tolerance)
}

export function solveQuadraticRealRoots(a, b, c, tolerance = EPS) {
  if (Math.abs(a) < tolerance) {
    if (Math.abs(b) < tolerance) return []
    return [-c / b]
  }

  const discriminant = b * b - 4 * a * c
  if (discriminant < -tolerance) return []
  if (Math.abs(discriminant) <= tolerance) return [-b / (2 * a)]

  const sqrtD = Math.sqrt(discriminant)
  const q = -0.5 * (b + Math.sign(b || 1) * sqrtD)
  return [q / a, c / q]
}

export function brentRoot(fn, a, b, tolerance = EPS, maxIterations = 80, valueTolerance = 1e-10) {
  let fa = safeEval(fn, a)
  let fb = safeEval(fn, b)

  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return null
  if (Math.abs(fa) <= valueTolerance) return a
  if (Math.abs(fb) <= valueTolerance) return b
  if (fa * fb > 0) return null

  if (Math.abs(fa) < Math.abs(fb)) {
    ;[a, b] = [b, a]
    ;[fa, fb] = [fb, fa]
  }

  let c = a
  let fc = fa
  let d = b - a
  let mflag = true
  let s = b

  for (let iter = 0; iter < maxIterations; iter += 1) {
    if (Math.abs(fb) <= valueTolerance || Math.abs(b - a) <= tolerance) return b

    if (fa !== fc && fb !== fc) {
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb))
    } else {
      s = b - (fb * (b - a)) / (fb - fa)
    }

    const condition1 = !((s > (3 * a + b) / 4 && s < b) || (s < (3 * a + b) / 4 && s > b))
    const condition2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2
    const condition3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2
    const condition4 = mflag && Math.abs(b - c) < tolerance
    const condition5 = !mflag && Math.abs(c - d) < tolerance

    if (condition1 || condition2 || condition3 || condition4 || condition5 || !Number.isFinite(s)) {
      s = 0.5 * (a + b)
      mflag = true
    } else {
      mflag = false
    }

    const fs = safeEval(fn, s)
    if (!Number.isFinite(fs)) return null

    d = c
    c = b
    fc = fb

    if (fa * fs < 0) {
      b = s
      fb = fs
    } else {
      a = s
      fa = fs
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      ;[a, b] = [b, a]
      ;[fa, fb] = [fb, fa]
    }
  }

  return b
}

export function minimizeAbsOnInterval(fn, a, b, iterations = 80) {
  const phi = (Math.sqrt(5) - 1) / 2
  let left = a
  let right = b
  let c = right - phi * (right - left)
  let d = left + phi * (right - left)

  const g = (x) => {
    const value = safeEval(fn, x)
    return Number.isFinite(value) ? value * value : Number.POSITIVE_INFINITY
  }

  let gc = g(c)
  let gd = g(d)

  for (let i = 0; i < iterations; i += 1) {
    if (gc < gd) {
      right = d
      d = c
      gd = gc
      c = right - phi * (right - left)
      gc = g(c)
    } else {
      left = c
      c = d
      gc = gd
      d = left + phi * (right - left)
      gd = g(d)
    }
  }

  const x = 0.5 * (left + right)
  const value = safeEval(fn, x)
  return { x, value, absValue: Math.abs(value) }
}

function estimateScale(values) {
  const finite = values
    .map(({ value }) => Math.abs(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)

  if (!finite.length) return 1
  const median = finite[Math.floor(finite.length / 2)]
  const max = finite[finite.length - 1]
  return Math.max(1, median, 1e-8 * max)
}

export function scanRoots(fn, zMin, zMax, samples = 4096, options = {}) {
  const {
    rootTolerance = EPS,
    rootValueTolerance = 1e-10,
    dedupeTolerance = 1e-7,
  } = options
  const roots = []
  const dz = (zMax - zMin) / samples
  const values = []

  for (let i = 0; i <= samples; i += 1) {
    const z = zMin + i * dz
    values.push({ z, value: safeEval(fn, z) })
  }

  const scale = estimateScale(values)
  const nearZeroTolerance = Math.max(rootValueTolerance, 1e-9 * scale)
  const tangentTolerance = Math.max(5e-9, 5e-7 * scale)

  for (let i = 0; i < samples; i += 1) {
    const a = values[i]
    const b = values[i + 1]
    if (!Number.isFinite(a.value) || !Number.isFinite(b.value)) continue

    if (Math.abs(a.value) <= nearZeroTolerance) roots.push(a.z)
    if (Math.abs(b.value) <= nearZeroTolerance) roots.push(b.z)

    if (a.value * b.value < 0) {
      const root = brentRoot(fn, a.z, b.z, rootTolerance, 80, rootValueTolerance)
      if (root !== null) roots.push(root)
    }
  }

  for (let i = 1; i < samples; i += 1) {
    const prev = values[i - 1]
    const cur = values[i]
    const next = values[i + 1]
    if (!Number.isFinite(prev.value) || !Number.isFinite(cur.value) || !Number.isFinite(next.value)) continue

    const a = Math.abs(prev.value)
    const b = Math.abs(cur.value)
    const c = Math.abs(next.value)

    if (b <= a && b <= c && b <= tangentTolerance) {
      const refined = minimizeAbsOnInterval(fn, prev.z, next.z)
      if (refined.absValue <= tangentTolerance) roots.push(refined.x)
    }
  }

  return dedupeSortedNumbers(roots, dedupeTolerance)
}

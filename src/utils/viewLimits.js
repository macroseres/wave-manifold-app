// Centralização dos limites de desenho/cálculo.
// view: limite visual dos eixos e das superfícies principais.
// calcView: limite computacional usado pelas curvas, com margem extra.

export const VIEW_LIMITS = Object.freeze({
  curveMargin: 0.2,
  surfaceMargin: 0.1,
  searchMargin: 0.25,
})

function expandInterval(min, max, margin) {
  const span = max - min
  if (!Number.isFinite(span) || Math.abs(span) < 1e-12) {
    return { min, max }
  }
  return {
    min: min - margin * span,
    max: max + margin * span,
  }
}

export function expandView(view, margin = VIEW_LIMITS.curveMargin) {
  const t = expandInterval(view.tMin, view.tMax, margin)
  const y = expandInterval(view.yMin, view.yMax, margin)
  const z = expandInterval(view.zMin, view.zMax, margin)

  return {
    ...view,
    tMin: t.min,
    tMax: t.max,
    yMin: y.min,
    yMax: y.max,
    zMin: z.min,
    zMax: z.max,
  }
}

export function expandViewZ(view, margin = VIEW_LIMITS.curveMargin) {
  const z = expandInterval(view.zMin, view.zMax, margin)
  return {
    ...view,
    zMin: z.min,
    zMax: z.max,
  }
}

export function buildComputationView(view, margin = VIEW_LIMITS.curveMargin) {
  // Por enquanto expandimos apenas z, para preservar a janela visual em t,Y
  // e permitir que as curvas saiam dos limites verticais do desenho.
  return expandViewZ(view, margin)
}

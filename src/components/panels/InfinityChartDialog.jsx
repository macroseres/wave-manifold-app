import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { rarefactionInfinityField } from '../../entities/surfaceImplicit/state.js'
import { rarefactionInfinitySingularity } from '../../entities/phasePortrait/rarefactionSingularities.js'
import { integrateOrbit } from '../../entities/numerics/integrateOrbit.js'

const B1_EPS = 1e-7
const B1_ONE_EPS = 1e-7

function infinityRegime(params) {
  const b1 = Number(params?.b1), b2 = Number(params?.b2), c = Number(params?.c ?? 1)
  if (!Number.isFinite(b1) || !Number.isFinite(b2) || !Number.isFinite(c)) return { kind: 'invalid' }
  if (Math.abs(b1) < B1_EPS) {
    if (Math.abs(c) < B1_EPS) return { kind: 'structural-degenerate', b1, b2, c }
    return { kind: 'adaptive-b1-zero', b1, b2, c }
  }
  if (Math.abs(b1 - 1) < B1_ONE_EPS) {
    if (Math.abs(b2) < B1_EPS) return { kind: 'higher-order', b1, b2, c }
    return { kind: 'semi-hyperbolic', b1, b2, c }
  }
  return { kind: 'hyperbolic', b1, b2, c }
}

function centralManifold(regime) {
  if (regime.kind === 'semi-hyperbolic') {
    const points = []
    for (let i = -100; i <= 100; i += 1) {
      const Z = 0.34 * i / 100
      points.push([-2 * regime.c * regime.b2 * Z * Z, Z])
    }
    return { points, label: 'variedade central (ordem 2)' }
  }
  if (regime.kind === 'higher-order') {
    const points = []
    for (let i = -100; i <= 100; i += 1) {
      const Z = 0.34 * i / 100
      points.push([-2 * regime.c * Z * Z * Z, Z])
    }
    return { points, label: 'variedade central (ordem 3)' }
  }
  return null
}

function branches(params, singularity, regime) {
  if (regime.kind !== 'hyperbolic' || !singularity || singularity.type !== 'sela') return []
  const bounds = { uMin: -2.5, uMax: 2.5, vMin: -0.55, vMax: 0.55 }
  const field = point => rarefactionInfinityField(point, params)
  const result = []
  singularity.eigenDirections.forEach((direction, index) => {
    const stability = direction.value < 0 ? 'stable' : 'unstable'
    for (const sign of [-1, 1]) {
      const eps = 2e-5
      const seed = direction.vector.map(value => sign * eps * value)
      const orbit = integrateOrbit(field, seed, bounds, Math.sign(direction.value), {
        maxTime: 80, maxPoints: 5000, tolerance: 1e-10, chordTolerance: 1e-6,
      })
      if (orbit.length > 1) result.push({ id: `${index}-${sign}`, stability, points: orbit })
    }
  })
  return result
}

function adaptiveB1ZeroField([_Theta, Z], { b2, c }) {
  const d = 1 + b2 * Z - Z * Z
  return [c * Z * Z * (2 + b2 * Z), d * d]
}

function regularOrbits(params, regime) {
  if (regime.kind === 'structural-degenerate' || regime.kind === 'invalid') return []
  const adaptive = regime.kind === 'adaptive-b1-zero'
  const bounds = adaptive
    ? { uMin: -2.5, uMax: 2.5, vMin: -0.55, vMax: 0.55 }
    : { uMin: -2.5, uMax: 2.5, vMin: -0.55, vMax: 0.55 }
  const field = point => adaptive ? adaptiveB1ZeroField(point, params) : rarefactionInfinityField(point, params)
  // Seeds on two transverse sections. Using both signs samples all four
  // sectors determined by the stable/unstable manifolds of the saddle.
  const seeds = []
  for (const Z of [-0.32, -0.20, -0.11, 0, 0.11, 0.20, 0.32]) {
    for (const horizontal of [-1.8, -1.05, -0.45, 0.45, 1.05, 1.8]) seeds.push([horizontal, Z])
  }
  const result = []
  seeds.forEach((seed, index) => {
    const backward = integrateOrbit(field, seed, bounds, -1, {
      maxTime: adaptive ? 8 : 40, maxPoints: 1800, tolerance: 2e-9, chordTolerance: 3e-6,
    })
    const forward = integrateOrbit(field, seed, bounds, 1, {
      maxTime: adaptive ? 8 : 40, maxPoints: 1800, tolerance: 2e-9, chordTolerance: 3e-6,
    })
    // integrateOrbit reverses backward output, so concatenate without
    // duplicating the common seed.
    const points = [...backward.slice(0, -1), ...forward]
    if (points.length > 2) result.push({ id: `orbit-${index}`, points })
  })
  return result
}

function draw(canvas, data) {
  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const w = rect.width, h = rect.height, pad = 34
  ctx.clearRect(0, 0, w, h)
  const all = [...data.branches, ...data.orbits, ...(data.central ? [data.central] : [])].flatMap(item => item.points)
  const maxT = Math.max(0.25, ...all.map(([T]) => Math.abs(T)))
  const maxZ = Math.max(0.08, ...all.map(([, Z]) => Math.abs(Z)))
  const tLim = Math.min(2.5, maxT * 1.08), zLim = Math.min(0.55, maxZ * 1.08)
  const xy = ([T, Z]) => [pad + (T + tLim) * (w - 2 * pad) / (2 * tLim), h - pad - (Z + zLim) * (h - 2 * pad) / (2 * zLim)]
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1
  const [x0, y0] = xy([0, 0])
  ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(w - pad, y0); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(x0, pad); ctx.lineTo(x0, h - pad); ctx.stroke()
  ctx.fillStyle = '#cbd5e1'; ctx.font = '12px system-ui, sans-serif'
  ctx.fillText(data.horizontalLabel ?? 'T', w - pad + 8, y0 + 4); ctx.fillText('Z', x0 + 7, pad - 8)
  if (data.central) {
    ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2
    ctx.beginPath()
    data.central.points.forEach((point, i) => { const [x, y] = xy(point); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    ctx.stroke(); ctx.restore()
  }
  // Regular integral curves first; separatrices are drawn on top.
  for (const orbit of data.orbits) {
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.42)'
    ctx.lineWidth = 1.05
    ctx.beginPath()
    orbit.points.forEach((point, i) => { const [x, y] = xy(point); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    ctx.stroke()
  }
  for (const branch of data.branches) {
    ctx.strokeStyle = branch.stability === 'stable' ? '#60a5fa' : '#f59e0b'
    ctx.lineWidth = 2.2; ctx.beginPath()
    branch.points.forEach((point, i) => { const [x, y] = xy(point); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) })
    ctx.stroke()
  }
  for (const direction of data.singularity?.eigenDirections ?? []) {
    const scale = Math.min(tLim / Math.max(Math.abs(direction.vector[0]), 1e-9), zLim / Math.max(Math.abs(direction.vector[1]), 1e-9)) * 0.22
    const a = xy(direction.vector.map(v => -scale * v)), b = xy(direction.vector.map(v => scale * v))
    ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke(); ctx.restore()
  }
  ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(x0, y0, 4, 0, 2 * Math.PI); ctx.fill()
}

export default function InfinityChartDialog({ params, onClose }) {
  const canvasRef = useRef(null)
  const regime = useMemo(() => infinityRegime(params), [params])
  const singularity = useMemo(() => ['adaptive-b1-zero', 'structural-degenerate'].includes(regime.kind) ? null : rarefactionInfinitySingularity(params), [params, regime.kind])
  const data = useMemo(() => ({
    singularity, regime, central: centralManifold(regime), branches: branches(params, singularity, regime),
    orbits: regularOrbits(params, regime), horizontalLabel: regime.kind === 'adaptive-b1-zero' ? 'Θ' : 'T',
  }), [params, singularity, regime])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const redraw = () => draw(canvas, data)
    redraw(); const observer = new ResizeObserver(redraw); observer.observe(canvas)
    return () => observer.disconnect()
  }, [data])
  useEffect(() => { const key = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key) }, [onClose])
  return createPortal(<div className="infinity-chart-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="infinity-chart-dialog" role="dialog" aria-modal="true" aria-label="Carta local no infinito">
      <header><div><strong>{regime.kind === 'adaptive-b1-zero' ? 'Carta adaptada no infinito (Θ,Z)' : 'Carta local no infinito (T,Z)'}</strong><small>{regime.kind === 'adaptive-b1-zero' ? 'Θ = u · Z = 1/z' : 'T = −z²τ · Z = 1/z'}</small></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
      {regime.kind === 'structural-degenerate' ? <div className="infinity-chart-warning"><strong>Estrato estrutural b₁ = 0 e c = 0.</strong><p>A carta principal (τ,Y,z) deixa de parametrizar regularmente o estado médio nos zeros de A(z)=1+b₂z−z². Nesses conjuntos a própria variedade característica é singular: localmente, com ξ=A(z), vale ξv̄=0. Portanto não existe uma carta regular única em (ū,v̄,Y) que complete (τ,Y,z); há dois ramos que se cruzam.</p></div> : <>
        <canvas ref={canvasRef} className="infinity-chart-canvas" />
        <div className="infinity-chart-legend"><span><i className="regular" /> curvas integrais</span>{regime.kind === 'hyperbolic' && <><span><i className="stable" /> estável</span><span><i className="unstable" /> instável</span></>}{data.central && <span><i className="central" /> {data.central.label}</span>}<span>{regime.kind === 'adaptive-b1-zero' ? 'Z=0: infinito regular' : 'origem: singularidade no infinito'}</span></div>
        {regime.kind === 'adaptive-b1-zero' && <p><strong>b₁=0, c≠0: infinito regular.</strong> Usa-se Θ=u e Z=1/z, com v=cZ²/(1+b₂Z−Z²). O campo desingularizado é Θ̇=cZ²(2+b₂Z), Ż=(1+b₂Z−Z²)²; em Z=0, Ż=1, portanto não há singularidade no infinito.</p>}
        {regime.kind === 'hyperbolic' && <p>Esta carta não projeta a direção tangente a Z=0 para o ponto compactificado: por isso mostra as quatro semisseparatrizes quando a singularidade é uma sela.</p>}
        {regime.kind === 'semi-hyperbolic' && <p><strong>Semi-hiperbólica — saddle-node.</strong> Em b₁=1 e b₂≠0, a dinâmica central satisfaz Ż = −b₂Z² − Z³ e a curva tracejada mostra T = −2cb₂Z² + O(Z³).</p>}
        {regime.kind === 'higher-order' && <p><strong>Não hiperbólica degenerada de ordem superior.</strong> Em b₁=1 e b₂=0, Ż = −Z³ e a curva tracejada mostra T = −2cZ³ + O(Z⁴).</p>}
        {singularity && <small>Autovalores: {singularity.eigenvalues.map(v => Number(v).toPrecision(5)).join(' , ')} · tipo: {regime.kind === 'semi-hyperbolic' ? 'semi-hiperbólica — saddle-node' : regime.kind === 'higher-order' ? 'não hiperbólica de ordem superior' : singularity.type}</small>}
      </>}
    </section>
  </div>, document.body)
}

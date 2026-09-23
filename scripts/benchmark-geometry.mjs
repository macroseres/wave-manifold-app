import { performance } from 'node:perf_hooks'
import { defaultParams as params, defaultView as view } from '../src/components/panels/schaefferShearerConfig.js'
import { buildSonicBranchGeometries } from '../src/entities/sonic/surfaceModel.js'
import { buildHysteresisSaturationGeometry } from '../src/geometry/hysteresisSaturationGeometry.js'
import { buildSaturatedCoincidenceGeometry } from '../src/geometry/coincidenceSaturationGeometry.js'
import { buildHysteresisSelfIntersectionSegments } from '../src/geometry/hysteresisSelfIntersection.js'
import { solveDoubleSonicSegments, solveInflectionSegments } from '../src/entities/surfaceImplicit/index.js'
const cases = {
  sonicLeft: () => buildSonicBranchGeometries('left', params, view, 40),
  sonicRight: () => buildSonicBranchGeometries('right', params, view, 40),
  saturatedHys: () => buildHysteresisSaturationGeometry(params, view, 40),
  saturatedE: () => buildSaturatedCoincidenceGeometry(params, view, 40),
  selfIntersection: () => buildHysteresisSelfIntersectionSegments(params, view),
  doubleSonic: () => solveDoubleSonicSegments(params, view, 280),
  inflection: () => solveInflectionSegments(params, view, 280, 'slow', { compactifiedZ: true }),
}
for (const [name, run] of Object.entries(cases)) {
  const times = []
  let vertices = 0
  for (let i = 0; i < 4; i++) {
    const start = performance.now(), result = run()
    const elapsed = performance.now() - start
    if (i) times.push(elapsed)
    const geometries = result?.isBufferGeometry ? [result] : Object.values(result).filter(item => item?.isBufferGeometry)
    vertices = geometries.reduce((sum, g) => sum + (g.attributes.position?.count ?? 0), 0)
    geometries.forEach(g => g.dispose())
  }
  times.sort((a, b) => a - b)
  console.log(JSON.stringify({ name, medianMs: Math.round(times[1]), vertices }))
}

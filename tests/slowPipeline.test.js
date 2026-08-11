import test from 'node:test'
import assert from 'node:assert/strict'
import { extractCompositeSubarcBetweenPoints } from '../src/entities/solution/internal/compositeSubarc.js'

const view = { tMin: 0, tMax: 10, yMin: 0, yMax: 10, zMin: 0, zMax: 10 }

function closePoint(actual, expected, tolerance = 1e-9) {
  assert.equal(actual.length, 3)
  for (let i = 0; i < 3; i += 1) {
    assert.ok(Math.abs(actual[i] - expected[i]) <= tolerance, `${actual} is not close to ${expected}`)
  }
}

test('extractCompositeSubarcBetweenPoints extracts the forward subarc between projected endpoints', () => {
  const segments = [[
    [0, 0, 0],
    [2, 0, 0],
    [4, 0, 0],
    [6, 0, 0],
  ]]
  const result = extractCompositeSubarcBetweenPoints(
    segments,
    [1, 1, 0],
    [5, 0.5, 0],
    view,
    { preserveStopTarget: false },
  )

  assert.equal(result.length, 1)
  closePoint(result[0][0], [1, 0, 0])
  closePoint(result[0].at(-1), [5, 0, 0])
  assert.deepEqual(result[0].slice(1, -1), [[2, 0, 0], [4, 0, 0]])
})

test('extractCompositeSubarcBetweenPoints reverses the polyline when the stop precedes the start', () => {
  const segments = [[
    [0, 0, 0],
    [2, 0, 0],
    [4, 0, 0],
    [6, 0, 0],
  ]]
  const stopTarget = [1, 0.25, 0]
  const result = extractCompositeSubarcBetweenPoints(
    segments,
    [5, 0, 0],
    stopTarget,
    view,
    { preserveStopTarget: true },
  )

  assert.equal(result.length, 1)
  closePoint(result[0][0], [5, 0, 0])
  closePoint(result[0].at(-1), stopTarget)
  assert.deepEqual(result[0].slice(1, -1), [[4, 0, 0], [2, 0, 0]])
})

test('extractCompositeSubarcBetweenPoints chooses the component closest to both endpoints', () => {
  const segments = [
    [[0, 0, 0], [2, 0, 0], [4, 0, 0]],
    [[0, 8, 0], [2, 8, 0], [4, 8, 0]],
  ]
  const result = extractCompositeSubarcBetweenPoints(
    segments,
    [0.5, 7.9, 0],
    [3.5, 8.1, 0],
    view,
    { preserveStopTarget: false },
  )

  assert.equal(result.length, 1)
  assert.ok(result[0].every((point) => Math.abs(point[1] - 8) < 1e-9))
})

test('extractCompositeSubarcBetweenPoints returns an empty result for invalid or degenerate inputs', () => {
  assert.deepEqual(extractCompositeSubarcBetweenPoints([], [0, 0, 0], [1, 0, 0], view), [])
  assert.deepEqual(extractCompositeSubarcBetweenPoints([[[0, 0, 0]]], [0, 0, 0], [1, 0, 0], view), [])
  assert.deepEqual(extractCompositeSubarcBetweenPoints([[[0, 0, 0], [1, 0, 0]]], null, [1, 0, 0], view), [])
})

import {
  buildSolutionRarefactionToSlowInflectionSegments,
  slowInflectionResidual,
} from '../src/entities/solution/internal/geometry/rarefactionGeometry.js'

test('slow local rarefaction endpoint is refined on the implicit inflection curve', () => {
  const params = { a: 0, b1: 8, b2: 0.2, c: 1 }
  const view = { tMin: -2, tMax: 2, yMin: -2, yMax: 2, zMin: -2, zMax: 2 }
  const segments = buildSolutionRarefactionToSlowInflectionSegments(
    { t: 1, z: -1 },
    params,
    view,
    90,
    'increasing',
    'slow',
  )

  assert.equal(segments.length, 1)
  assert.ok(segments[0].length >= 2)
  const endpoint = segments[0].at(-1)
  assert.ok(Math.abs(slowInflectionResidual(endpoint, params)) < 1e-9)
})

test('fast local rarefaction endpoint is refined on the implicit inflection curve', async () => {
  const { buildSolutionRarefactionToFastInflectionSegments } = await import('../src/entities/solution/internal/geometry/rarefactionGeometry.js')
  const params = { a: 0, b1: 8, b2: 0.2, c: 1 }
  const view = { tMin: -2, tMax: 2, yMin: -2, yMax: 2, zMin: -2, zMax: 2 }
  const candidates = [
    { t: -1, z: -1 },
    { t: -1, z: 1 },
    { t: -0.5, z: 0 },
    { t: -1.5, z: 0.5 },
  ]

  let segments = []
  for (const seed of candidates) {
    segments = buildSolutionRarefactionToFastInflectionSegments(
      seed,
      params,
      view,
      90,
      'decrease',
      'fast',
    )
    if (segments.length) break
  }

  assert.equal(segments.length, 1)
  assert.ok(segments[0].length >= 2)
  const endpoint = segments[0].at(-1)
  assert.ok(Math.abs(slowInflectionResidual(endpoint, params)) < 1e-9)
})

test('second slow chain inserts dashed H_+ after K_nloc before starting H_nloc', async () => {
  const { readFile } = await import('node:fs/promises')
  const pipelineSource = await readFile(
    new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url),
    'utf8',
  )
  const renderingSource = await readFile(
    new URL('../src/entities/solution/rendering/components/BranchAdmissibleArcs.jsx', import.meta.url),
    'utf8',
  )

  assert.match(pipelineSource, /buildHPlusSegmentToFixedHMinusIntersection/)
  assert.match(pipelineSource, /postCompositeHPlusArc/)
  assert.match(pipelineSource, /source:\s*'postCompositeHPlusFixedHMinusIntersection'/)
  assert.match(
    pipelineSource,
    /nonlocalCompositeArc,\s*postCompositeHPlusArc,\s*secondChainNonlocalShockArc/,
  )
  assert.match(renderingSource, /showPostCompositeHPlusArc/)
  assert.match(renderingSource, /H-plus-after-K-nonlocal/)
  assert.match(renderingSource, /dashed/)
})

test('slow nonlocal rarefaction uses the exact local construction with only a different seed', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const section = source.slice(source.indexOf('const nonlocalChainPairs'), source.indexOf('const trimmedNonlocalCompositePairs'))

  assert.match(section, /buildSolutionRarefactionToSlowInflectionSegments\(\s*anchor,/)
  assert.match(section, /enforcePipelineOrientationFromAnchor\([\s\S]*?anchor,[\s\S]*?SLOW_R_ORIENTATION/)
  assert.match(section, /buildSolutionRarefactionSegments\(\s*anchor,/)
  assert.match(section, /let sampledRarefactionEnd = terminalAnchorFromFirstSegment\(rarefactionSegments\)/)
  assert.match(section, /const rarefactionEnd = sampledRarefactionEnd/)
  assert.doesNotMatch(section, /buildNonlocalRarefactionCurveData\(/)
})

test('slow nonlocal composite displays only the component through inflection and keeps the admissible arc separate', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const section = source.slice(source.indexOf('const nonlocalChainPairs'), source.indexOf('const trimmedNonlocalCompositePairs'))

  assert.match(section, /buildGlobalCompositeIntersectionFromRarefactionCurve\(\s*compositeSourceRarefactionSegments,/)
  assert.match(section, /hasUsableSegments\(completeNonlocalCompositeSegments\)/)
  assert.match(section, /buildGlobalCompositeIntersectionSegments\(\s*anchor,/)
  assert.match(section, /extractOrientedCompositeArcFromFullCurve\([\s\S]*?rarefactionEnd,/)
  assert.match(section, /buildCompositeFromSpecifiedRarefactionCurve\(\s*compositeSourceRarefactionSegments,/)
  assert.match(section, /involvedCompositeSegments: compositeSegmentsFromInflection/)
  assert.match(section, /const compositeSegmentsFromInflection = globalNonlocalCompositeSegments/)
  assert.match(section, /trimOrderedCompositeToFirstStop\(/)
})

test('first-intersection composite follows each oriented H_- leaf and does not select a posterior side', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/internal/geometry/compositeGeometry.js', import.meta.url), 'utf8')
  const start = source.indexOf('export function buildFirstIntersectionCompositeFromRarefactionArc')
  const end = source.indexOf('export function normalizedCompositeTortuosity', start)
  const section = source.slice(start, end)

  assert.match(section, /firstSonicIntersectionOnOrientedHugoniotLeaf/)
  assert.match(section, /const u = 1 - i \/ count/)
  assert.match(section, /generatorPoint: generator/)
  assert.doesNotMatch(section, /extractOrientedCompositeArcFromFullCurve/)
})

test('sonic-anchor detection explicitly accepts the terminal point of a restricted rarefaction arc', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/composite/bifoliation/parametrization.js', import.meta.url), 'utf8')
  assert.match(source, /Math\.abs\(fb\) <= tol[\s\S]*?uAtIndex\(i, 1\)/)
})

test('slow nonlocal chain does not apply extra length filters after the local-style construction', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const start = source.indexOf('const nonlocalChainPairs')
  const end = source.indexOf('// Extract the actual local composite arc', start)
  const section = source.slice(start, end)

  assert.match(section, /const trimmedCompositeSegments = compositeStop\.segments/)
  assert.match(section, /const nonlocalRarefactionSegments = nonlocalChainPairs\.flatMap\([\s\S]*?item\.rarefactionSegments/)
  assert.doesNotMatch(section, /minRarefactionLength\s*\?/) 
  assert.doesNotMatch(section, /minCompositeLength\s*\?/) 
})

test('first leaf-sonic intersection searches the intrinsic eta side first and the opposite side as fallback', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/internal/geometry/compositeGeometry.js', import.meta.url), 'utf8')
  const start = source.indexOf('function firstSonicIntersectionOnOrientedHugoniotLeaf')
  const end = source.indexOf('/**\n * Construct K directly', start)
  const section = source.slice(start, end)

  assert.match(section, /const preferredSign = orientedHugoniotEtaSign/)
  assert.match(section, /for \(const sign of \[preferredSign, -preferredSign\]\)/)
  assert.match(section, /firstSonicIntersectionAlongEtaDirection/)
})


test('second slow chain cannot jump directly from K_nloc to fixed H_-(U_L)', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const stopStart = source.indexOf('function firstStopOnCompositeStep')
  const stopEnd = source.indexOf('function trimOrderedCompositeToFirstStop', stopStart)
  const stopSection = source.slice(stopStart, stopEnd)
  const chainStart = source.indexOf('// Segunda cadeia after K_nloc:')
  const chainEnd = source.indexOf('const usableLocalCompositeShockPairs', chainStart)
  const chainSection = source.slice(chainStart, chainEnd)

  assert.doesNotMatch(stopSection, /minDistanceToFixedHugoniot/)
  assert.doesNotMatch(stopSection, /kind:\s*'hugoniot'/)
  assert.match(chainSection, /buildHPlusSegmentToFixedHMinusIntersection/)
  assert.match(chainSection, /hMinusLeafPoint/)
})

test('slow K_nloc uses exactly the terminal point of the nonlocal rarefaction as inflection', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const section = source.slice(source.indexOf('const nonlocalChainPairs'), source.indexOf('const trimmedNonlocalCompositePairs'))

  assert.match(section, /const rarefactionEnd = sampledRarefactionEnd/)
  assert.match(section, /const inflectionPoint = rarefactionEnd/)
  assert.match(section, /extractOrientedCompositeArcFromFullCurve\([\s\S]*?completeNonlocalCompositeSegments,[\s\S]*?rarefactionEnd,/)
  assert.doesNotMatch(section, /const rarefactionEnd =[\s\S]*?\?\? estimatedInflection/)
})

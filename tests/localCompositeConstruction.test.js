import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const slowPipelineUrl = new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url)

test('slow local composite is cut from the global saturation of R_-(U_L)', async () => {
  const source = await readFile(slowPipelineUrl, 'utf8')
  const localSectionStart = source.indexOf('// Classical local chain:')
  const localSectionEnd = source.indexOf('// Shock-first slow branch:')
  const localSection = source.slice(localSectionStart, localSectionEnd)

  assert.ok(localSectionStart >= 0 && localSectionEnd > localSectionStart)
  assert.match(localSection, /buildGlobalCompositeIntersectionSegments\(\s*entry\.seed,/)
  assert.doesNotMatch(localSection, /buildCompositeFromSpecifiedRarefactionCurve\(/)
  assert.match(localSection, /Sat_\{H_-\}\(R_-\(U_L\)\) cap S\^-/)
})

test('slow local composite selects and orients the component through J_- before trimming', async () => {
  const source = await readFile(slowPipelineUrl, 'utf8')
  const globalIndex = source.indexOf('const globalLocalCompositeSegments =')
  const orientedIndex = source.indexOf('const orientedRawLocalCompositeSegments = extractOrientedCompositeArcFromFullCurve(')
  const intersectionIndex = source.indexOf('const localCompositeIntersection = firstHugoniotIntersectionOnComposite({')
  const extractionIndex = source.indexOf('const extractedLocalCompositeSegments =')

  assert.ok(globalIndex >= 0)
  assert.ok(orientedIndex > globalIndex)
  assert.ok(intersectionIndex > orientedIndex)
  assert.ok(extractionIndex > intersectionIndex)
  assert.match(
    source.slice(orientedIndex, orientedIndex + 500),
    /localRarefactionEndpointPoint \?\? localInflectionPoint/,
    'the connected component must be anchored at the actual local inflection endpoint',
  )
})

test('local composite extraction does not impose pointwise speed monotonicity', async () => {
  const geometryUrl = new URL('../src/entities/solution/internal/geometry/compositeGeometry.js', import.meta.url)
  const source = await readFile(geometryUrl, 'utf8')

  assert.match(source, /splitConnectedSubarcsFromAnchor/)
  assert.doesNotMatch(source, /splitMonotoneSubarcsFromAnchor/)
  assert.doesNotMatch(source, /speedAdmissibleForOrientation/)
  assert.doesNotMatch(source, /maxSpeedViolation/)
})

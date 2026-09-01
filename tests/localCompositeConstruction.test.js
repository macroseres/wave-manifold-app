import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const slowPipelineUrl = new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url)

test('slow local composite is generated only from the restricted local rarefaction arc', async () => {
  const source = await readFile(slowPipelineUrl, 'utf8')
  const localSectionStart = source.indexOf('// Classical local chain:')
  const localSectionEnd = source.indexOf('// Shock-first slow branch:')
  const localSection = source.slice(localSectionStart, localSectionEnd)

  assert.ok(localSectionStart >= 0 && localSectionEnd > localSectionStart)
  assert.match(localSection, /buildGlobalCompositeIntersectionFromRarefactionCurve\(\s*localCompositeSourceRarefactionSegments,/)
  assert.match(localSection, /segment\.map\(pointObjectFromCoords\)/)
  assert.doesNotMatch(localSection, /buildGlobalCompositeIntersectionSegments\(\s*entry\.seed,/)
  assert.match(localSection, /Sat_\{H_-\}\(R_loc\) cap S\^-/)
})

test('slow local composite selects the connected component anchored exactly at J_-', async () => {
  const source = await readFile(slowPipelineUrl, 'utf8')
  const globalIndex = source.indexOf('const globalLocalCompositeSegments =')
  const leafOrderedIndex = source.indexOf('const leafOrderedLocalComposite = buildFirstIntersectionCompositeFromRarefactionArc(')
  const anchoredIndex = source.indexOf('const anchoredLeafOrderedLocalComposite = anchorCompositeContinuationAtInflection(')
  const matchingIndex = source.indexOf('const matchingGlobalLocalComposite = extractGlobalCompositeSideMatchingReference(')
  const orientedIndex = source.indexOf('let orientedRawLocalCompositeSegments = hasUsableSegments(matchingGlobalLocalComposite)')
  const fallbackIndex = source.indexOf('orientedRawLocalCompositeSegments = extractOrientedCompositeArcFromFullCurve(')
  const intersectionIndex = source.indexOf('const localCompositeHugoniotIntersection = firstHugoniotIntersectionOnComposite({')
  const extractionIndex = source.indexOf('const extractedLocalCompositeSegments =')

  assert.ok(globalIndex >= 0)
  assert.ok(leafOrderedIndex > globalIndex)
  assert.ok(anchoredIndex > leafOrderedIndex)
  assert.ok(matchingIndex > anchoredIndex)
  assert.ok(orientedIndex > matchingIndex)
  assert.ok(fallbackIndex > orientedIndex)
  assert.ok(intersectionIndex > orientedIndex)
  assert.ok(extractionIndex > intersectionIndex)
  assert.match(source.slice(globalIndex, leafOrderedIndex), /localCompositeSourceRarefactionSegments/)
  assert.match(source.slice(leafOrderedIndex, anchoredIndex), /localCompositeSourceRarefactionSegments/)
  assert.match(source.slice(matchingIndex, orientedIndex), /anchoredLeafOrderedLocalComposite/)
  assert.match(source.slice(orientedIndex, intersectionIndex), /localRarefactionEndpointPoint \?\? localInflectionPoint/)
  assert.match(source, /anchorCompositeContinuationAtInflection\([\s\S]*?localRarefactionEndpointPoint \?\? localInflectionPoint/)
})

test('local composite extraction does not impose pointwise speed monotonicity', async () => {
  const geometryUrl = new URL('../src/entities/solution/internal/geometry/compositeGeometry.js', import.meta.url)
  const source = await readFile(geometryUrl, 'utf8')

  assert.match(source, /splitConnectedSubarcsFromAnchor/)
  assert.doesNotMatch(source, /splitMonotoneSubarcsFromAnchor/)
  assert.doesNotMatch(source, /speedAdmissibleForOrientation/)
  assert.doesNotMatch(source, /maxSpeedViolation/)
})

test('slow first chain stops K_loc at double composite before starting the nonlocal shock', async () => {
  const source = await readFile(new URL('../src/entities/solution/branches/pipelines/slowPipeline.js', import.meta.url), 'utf8')
  const start = source.indexOf('const localCompositeHugoniotIntersection')
  const end = source.indexOf('// Shock-first slow branch:', start)
  const section = source.slice(start, end)

  assert.match(section, /localCompositeThroughHugoniot/)
  assert.match(section, /trimOrderedCompositeToFirstStop/)
  assert.match(section, /localCompositeDoubleStop\.stopKind === 'doubleSonic'/)
  assert.match(section, /localCompositeIntersection = localCompositeEndsAtDoubleSonic \? null/)
  assert.match(source, /const point = \[line\.t, closest\.point\[1\], line\.z\]/)
})

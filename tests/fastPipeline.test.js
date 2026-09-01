import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const fastPipelineUrl = new URL('../src/entities/solution/branches/pipelines/fastPipeline.js', import.meta.url)

test('fast local chain is generated only from the restricted local rarefaction arc', async () => {
  const source = await readFile(fastPipelineUrl, 'utf8')
  const localStart = source.indexOf('// Classical fast local chain')
  const localEnd = source.indexOf('const rawLocalShockSegments =', localStart)
  const local = source.slice(localStart, localEnd)

  assert.ok(localStart >= 0 && localEnd > localStart)
  assert.match(local, /buildSolutionRarefactionToFastInflectionSegments\(/)
  assert.match(local, /buildGlobalCompositeIntersectionFromRarefactionCurve\(\s*localCompositeSourceRarefactionSegments,/)
  assert.match(local, /segment\.map\(pointObjectFromCoords\)/)
  assert.doesNotMatch(local, /buildGlobalCompositeIntersectionSegments\(\s*entry\.seed,/)
  assert.match(local, /extractOrientedCompositeArcFromFullCurve\([\s\S]*?localInflectionPoint/)
  assert.match(local, /anchorCompositeContinuationAtInflection\([\s\S]*?localInflectionPoint/)
  assert.match(local, /localInflectionPoint/)
  assert.match(local, /firstHugoniotIntersectionOnComposite\(/)
  assert.doesNotMatch(local, /buildSolutionCompositeSegments\(/)
})

test('fast rarefaction uses the decreasing-speed convention', async () => {
  const orientationUrl = new URL('../src/entities/waves/orientation.js', import.meta.url)
  const source = await readFile(orientationUrl, 'utf8')
  assert.match(source, /fast:\s*Object\.freeze\(\{[\s\S]*?rarefaction:\s*SPEED_DECREASES/)
})

test('fast nonlocal composite displays only the component through inflection', async () => {
  const source = await readFile(fastPipelineUrl, 'utf8')
  const start = source.indexOf('const nonlocalCompositePairs')
  const end = source.indexOf('const trimmedNonlocalCompositePairs', start)
  const section = source.slice(start, end)

  assert.ok(start >= 0 && end > start)
  assert.match(section, /buildGlobalCompositeIntersectionFromRarefactionCurve\(\s*compositeSourceRarefactionSegments,/)
  assert.match(section, /anchorCompositeContinuationAtInflection\([\s\S]*?rarefactionEnd/)
  assert.match(section, /if \(rarefactionEnd && !hasUsableSegments\(compositeSegmentsFromInflection\)\)[\s\S]*?extractOrientedCompositeArcFromFullCurve/)
  assert.doesNotMatch(section, /buildGlobalCompositeIntersectionSegments\(\s*anchor,/)
  assert.match(section, /involvedCompositeSegments: compositeSegmentsFromInflection/)
  assert.doesNotMatch(section, /involvedCompositeSegments: completeNonlocalCompositeSegments/)
})

test('fast K_nloc uses exactly the terminal point of the nonlocal rarefaction as inflection', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/entities/solution/branches/pipelines/fastPipeline.js', import.meta.url), 'utf8')
  const section = source.slice(source.indexOf('const nonlocalCompositePairs'), source.indexOf('const trimmedNonlocalCompositePairs'))

  assert.match(section, /const rarefactionEnd = rarefactionCurveData\.arcEnd[\s\S]*?terminalAnchorFromFirstSegment\(rarefactionSegments\)[\s\S]*?\?\? null/)
  assert.match(section, /inflectionPoint: rarefactionEnd/)
  assert.match(section, /extractOrientedCompositeArcFromFullCurve\([\s\S]*?completeNonlocalCompositeSegments, rarefactionEnd,/)
  assert.doesNotMatch(section, /const rarefactionEnd =[\s\S]*?\?\? estimatedInflection/)
})

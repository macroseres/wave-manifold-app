import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const fastPipelineUrl = new URL('../src/entities/solution/branches/pipelines/fastPipeline.js', import.meta.url)

test('fast local chain uses the same global-curve restriction logic as the slow chain', async () => {
  const source = await readFile(fastPipelineUrl, 'utf8')
  const localStart = source.indexOf('// Classical fast local chain')
  const localEnd = source.indexOf('const rawLocalShockSegments =', localStart)
  const local = source.slice(localStart, localEnd)

  assert.ok(localStart >= 0 && localEnd > localStart)
  assert.match(local, /buildSolutionRarefactionToFastInflectionSegments\(/)
  assert.match(local, /buildGlobalCompositeIntersectionSegments\(\s*entry\.seed,/)
  assert.match(local, /extractOrientedCompositeArcFromFullCurve\(/)
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
  assert.match(section, /extractOrientedCompositeArcFromFullCurve\(/)
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

import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGlobalRarefactionPortrait, portraitOverlapFraction, saddlePortraitSeeds } from '../src/entities/phasePortrait/rarefactionPortrait.js'
import { defaultView, parametersDefaultForCase } from '../src/components/panels/schaefferShearerConfig.js'

test('near-duplicate detection measures sustained overlap, not convergence at one endpoint', () => {
  const line = [[0, 0], [1, 0]]
  assert.ok(portraitOverlapFraction([line], p => p, () => true) > 0.99)
  assert.ok(portraitOverlapFraction([line], p => p, p => p[0] < 0.05) < 0.1)
  assert.equal(portraitOverlapFraction([line], p => p, () => true, () => false), 0)
})

test('case III-C receives additional integrated leaves near its saddles', () => {
  const params = parametersDefaultForCase('iiic')
  const seeds = saddlePortraitSeeds(defaultView, params)
  assert.ok(seeds.some(p => p.t > 0) && seeds.some(p => p.t < 0))
  const leaves = buildGlobalRarefactionPortrait(params, defaultView)
  const extra = leaves.filter(l => l.seed.nearSaddle)
  assert.ok(extra.length > 0)
  assert.ok(extra.every(l => l.segments.flat().every(p => p.Y === 0 && p.coords.every(Number.isFinite))))
})

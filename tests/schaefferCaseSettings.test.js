import test from 'node:test'
import assert from 'node:assert/strict'
import { readCaseDrawings, saveCaseDrawings } from '../src/components/panels/schaefferCaseStorage.js'
import {
  drawingDefaultForCase,
  parametersDefaultForCase,
  defaultParams,
  defaultView,
  initialSchaefferShearerCasePresets,
  schaefferShearerCases,
} from '../src/components/panels/schaefferShearerConfig.js'

test('generic defaults come from case IV and parameter resets respect each case', () => {
  assert.deepEqual(defaultParams, parametersDefaultForCase('iv'))
  assert.deepEqual(defaultView, initialSchaefferShearerCasePresets.iv.view)
  for (const { key } of schaefferShearerCases) {
    const params = parametersDefaultForCase(key)
    assert.equal(params.b1, initialSchaefferShearerCasePresets[key].params.b1)
    assert.equal(params.b2, initialSchaefferShearerCasePresets[key].params.b2)
    assert.equal(params.a, 0)
    assert.equal(params.c, 1)
    params.b1 = 999
    assert.notEqual(parametersDefaultForCase(key).b1, 999)
  }
})

test('every Schaeffer case has independent scales, resolution, and drawing bounds', () => {
  const presets = schaefferShearerCases.map(({ key }) => initialSchaefferShearerCasePresets[key])
  assert.equal(new Set(presets.map(preset => preset.scales)).size, presets.length)
  assert.equal(new Set(presets.map(preset => preset.view)).size, presets.length)
  for (const preset of presets) {
    assert.ok(preset.resolution >= 32 && preset.resolution <= 88)
    assert.ok(preset.view.tMin < preset.view.tMax)
    assert.ok(preset.view.yMin < preset.view.yMax)
  }
})

test('custom III-A settings take precedence over the special drawing defaults', () => {
  const preset = {
    scales: { yScale: 1.1, tauScale: 4, zScale: 5 },
    view: { tMin: -2, tMax: 2, yMin: -5, yMax: 5, zMin: -3, zMax: 3 },
    resolution: 72,
  }
  assert.deepEqual(drawingDefaultForCase('iiia', preset), preset)
  const copy = drawingDefaultForCase('iiia', preset)
  copy.scales.tauScale = 1
  copy.view.tMax = 1
  assert.equal(preset.scales.tauScale, 4)
  assert.equal(preset.view.tMax, 2)
})

test('reset restores the active case defaults without changing saved settings', () => {
  const saved = structuredClone(initialSchaefferShearerCasePresets)
  saved.iiia.resolution = 72
  saved.iiia.scales.tauScale = 5
  saved.iiia.view.tMax = 2
  saved.iv.resolution = 60
  assert.equal(drawingDefaultForCase('iiia').scales.tauScale, 2.5)
  assert.equal(drawingDefaultForCase('iiia').view.tMax, 1.5)
  assert.equal(drawingDefaultForCase('iiia').resolution, 40)
  assert.equal(drawingDefaultForCase('iv', saved.iv).resolution, 60)
  assert.equal(drawingDefaultForCase('iiia', saved.iiia).resolution, 72)
})

test('saved startup values round-trip independently for different cases', () => {
  let data = null
  const storage = { getItem: () => data, setItem: (_key, value) => { data = value } }
  const presets = structuredClone(initialSchaefferShearerCasePresets)
  presets.ia.view.yMin = -7
  presets.ia.view.tMax = 0.5
  presets.ia.scales.yScale = 1.2
  presets.ia.resolution = 60
  presets.iiia.view.yMin = -2
  presets.iiia.view.tMax = 2
  presets.iiia.resolution = 72
  assert.equal(saveCaseDrawings(presets, storage), true)
  const restored = readCaseDrawings(storage)
  assert.equal(restored.ia.view.yMin, -7)
  assert.equal(restored.ia.view.tMax, 0.5)
  assert.equal(restored.ia.scales.yScale, 1.2)
  assert.equal(restored.ia.resolution, 60)
  assert.equal(restored.iiia.view.yMin, -2)
  assert.equal(restored.iiia.resolution, 72)
  assert.equal(restored.iv.view.yMin, presets.iv.view.yMin)
  assert.equal(restored.ia.params, undefined)
})

test('corrupt or inaccessible storage does not prevent startup', () => {
  assert.deepEqual(readCaseDrawings({ getItem: () => '{broken' }), {})
  assert.deepEqual(readCaseDrawings({ getItem: () => '{"ia":{"view":{}}}' }), {})
  const denied = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') } }
  assert.deepEqual(readCaseDrawings(denied), {})
  assert.equal(saveCaseDrawings(initialSchaefferShearerCasePresets, denied), false)
})

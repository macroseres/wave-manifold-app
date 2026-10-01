import test from 'node:test'
import assert from 'node:assert/strict'
import { createExperiment, readExperiment, experimentSnapshot } from '../src/app/experiments/experimentFormat.js'
import { createHistory, historyReducer } from '../src/app/state/history.js'
import { createWorkerPool } from '../src/hooks/workerPool.js'
const defaults = { params: { b1: 8, b2: .2, c: 1, a: 0 }, selectedCaseKey: 'iv',
  view: { tMin: -1, tMax: 1, yMin: -3, yMax: 3, zMin: -2, zMax: 2 }, resolution: 40,
  opacity: .75, yScale: 1, tauScale: 2, zScale: 4, showAxes: true, activeView: '3d', activeBranch: null,
  selectedByBranch: { slow: null, fast: null }, inspectionProbesByBranch: { slow: null, fast: null },
  hoveredInspectionPoint: null, solutionDiagnostics: [] }
const camera = { position: [5, 5, 5], target: [0, 0, 0], up: [0, 1, 0], rotation: [0, .2, 0] }

test('loading a camera-only experiment remains undoable and redoable', () => {
  const nextCamera = { ...camera, position: [3, 4, 5], revision: 2 }
  const reducer = state => ({ ...state, cameraRestore: nextCamera })
  let history = historyReducer(createHistory(defaults), { type: 'loadExperiment', previousCamera: camera, revision: 2 }, reducer)
  assert.equal(history.past.length, 1)
  history = historyReducer(history, { type: 'undo' }, reducer)
  assert.deepEqual(history.present.cameraRestore.position, camera.position)
  history = historyReducer(history, { type: 'redo' }, reducer)
  assert.deepEqual(history.present.cameraRestore.position, nextCamera.position)
})

test('import preserves inspection probe amplitude and solution attachment', () => {
  const state = { ...defaults, inspectionProbesByBranch: { slow: { t: -.1, z: .4, Y: 2, attachedCurve: 'arc-1' }, fast: null } }
  const data = readExperiment(JSON.stringify(createExperiment(state, camera, 'x')), defaults)
  assert.equal(data.state.inspectionProbesByBranch.slow.Y, 2)
  assert.equal(data.state.inspectionProbesByBranch.slow.attachedCurve, 'arc-1')
  assert.equal(data.state.inspectionProbesByBranch.slow.mode, 'solution-arc')
})
test('experiment round-trip preserves physical states and camera without retaining computed geometry', () => {
  const state = { ...defaults, selectedByBranch: { slow: { t: .2, z: 2, Y: 0, branch: 'slow' }, fast: null },
    solutionDiagnostics: [{ computed: true }], hoveredInspectionPoint: { t: .4 } }
  const data = readExperiment(JSON.stringify(createExperiment(state, camera, '0.1.0-dev')), defaults)
  assert.deepEqual(data.state, experimentSnapshot(state))
  assert.deepEqual(data.camera, camera)
  assert.equal(data.state.solutionDiagnostics, undefined)
})
test('invalid experiments are rejected before changing app state', () => {
  for (const patch of [{ resolution: 99999 }, { view: { ...defaults.view, tMin: 2 } },
    { params: { ...defaults.params, b1: null } }, { selectedByBranch: { slow: { t: -1, z: 0 }, fast: null } }, { selectedCaseKey: 'unknown' }]) {
    const data = createExperiment({ ...defaults, ...patch }, camera, '0.1.0-dev')
    assert.throws(() => readExperiment(JSON.stringify(data), defaults))
  }
  assert.throws(() => readExperiment(JSON.stringify({ format: 'other', schemaVersion: 1 }), defaults))
  assert.throws(() => readExperiment(JSON.stringify({ ...createExperiment(defaults, camera, 'x'), schemaVersion: 2 }), defaults))
  assert.throws(() => readExperiment(JSON.stringify(createExperiment(defaults, { ...camera, position: [0, 0, 0] }, 'x')), defaults))
})
test('undo restores settings, ignores hover updates, and a new edit discards redo', () => {
  const reduce = (state, action) => ({ ...state, [action.key]: action.value })
  let history = createHistory(defaults)
  history = historyReducer(history, { type: 'set', key: 'resolution', value: 48 }, reduce)
  history = historyReducer(history, { type: 'set', key: 'hoveredInspectionPoint', value: { t: .3 } }, reduce)
  assert.equal(history.past.length, 1)
  history = historyReducer(history, { type: 'undo' }, reduce)
  assert.equal(history.present.resolution, 40)
  history = historyReducer(history, { type: 'redo' }, reduce)
  assert.equal(history.present.resolution, 48)
  history = historyReducer(history, { type: 'undo' }, reduce)
  history = historyReducer(history, { type: 'set', key: 'showAxes', value: false }, reduce)
  assert.equal(history.future.length, 0)
  assert.equal(history.present.showAxes, false)
})
test('shared worker survives one unsubscribe and terminates when its last subscriber leaves', () => {
  let terminated = 0, resultCount = 0, saved = 0
  const worker = { postMessage(message) { this.id = message.id }, terminate() { terminated++ } }
  const pool = createWorkerPool({ remember() { saved++ } })
  const first = pool.subscribe('a', () => worker, {}, () => resultCount++)
  const second = pool.subscribe('a', () => { throw new Error('must share worker') }, {}, () => resultCount++)
  first()
  assert.equal(terminated, 0)
  worker.onmessage({ data: { id: worker.id, ok: true, data: [1] } })
  assert.equal(resultCount, 1)
  assert.equal(saved, 1)
  second()
  assert.equal(terminated, 1)
  const cancel = pool.subscribe('b', () => worker, {}, () => resultCount++)
  cancel()
  assert.equal(terminated, 2)
  assert.equal(pool.size, 0)
  worker.onmessage({ data: { id: worker.id, ok: true, data: [2] } })
  assert.equal(saved, 1)
})

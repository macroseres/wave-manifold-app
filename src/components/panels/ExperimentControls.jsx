import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { version } from '../../../package.json'
import { initialWaveAppState } from '../../app/state/waveAppState.js'
import { createExperiment, readExperiment, experimentSnapshot } from '../../app/experiments/experimentFormat.js'
import { parametersDefaultForCase, drawingDefaultForCase } from './schaefferShearerConfig.js'

export default function ExperimentControls({ state, actions, cameraApiRef }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Meu experimento')
  const [message, setMessage] = useState('')
  const fileRef = useRef(null)
  const buttonRef = useRef(null)
  const dialogRef = useRef(null)
  const close = () => { setOpen(false); buttonRef.current?.focus() }
  useEffect(() => {
    const key = event => {
      if (event.key === 'Escape' && open) { setOpen(false); buttonRef.current?.focus(); return }
      if (event.key === 'Tab' && open) {
        const items = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not([hidden])')]
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); (event.shiftKey ? actions.redo : actions.undo)()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [actions, open])
  const save = () => {
    const data = createExperiment(state, cameraApiRef.current?.capture(), version, name)
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.name.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage('Experimento exportado para JSON.')
  }
  const load = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      if (file.size > 1024 * 1024) throw new Error('O arquivo ultrapassa 1 MB.')
      const data = readExperiment(await file.text(), initialWaveAppState)
      actions.loadExperiment(data, cameraApiRef.current?.capture())
      setName(typeof data.name === 'string' ? data.name.slice(0, 100) : 'Experimento')
      setMessage(`Experimento aberto${data.appVersion !== version ? ` (criado no app ${data.appVersion})` : ''}.`)
    } catch (error) { setMessage(`Não foi possível abrir: ${error.message}`) }
  }
  const example = kind => {
    const caseKey = kind === 'case-iii' ? 'iiia' : 'iv'
    const drawing = drawingDefaultForCase(caseKey)
    const snapshot = { ...experimentSnapshot(initialWaveAppState), params: parametersDefaultForCase(caseKey),
      selectedCaseKey: caseKey, view: drawing.view, ...drawing.scales, resolution: drawing.resolution }
    if (kind === 'states') {
      snapshot.selectedByBranch = { slow: { t: 0.15, Y: 0, z: 0, branch: 'slow' }, fast: { t: -0.15, Y: 0, z: 0, branch: 'fast' } }
      snapshot.inspectionModeEnabled = true
      snapshot.activeView = 'state'
    } else snapshot.portraitSettings = { ...snapshot.portraitSettings,
      enabledViews: { '3d': true, state: false }, rarefactionOptions: { singularities: true, separatrices: true, eigenDirections: false } }
    const data = createExperiment(snapshot, { position: [5, 5, 5], target: [0, 0, 0], up: [0, 1, 0], rotation: [0, 0, 0] }, version)
    actions.loadExperiment(readExperiment(JSON.stringify(data), initialWaveAppState), cameraApiRef.current?.capture())
    setName(kind === 'states' ? 'Estados no caso IV' : `Rarefação no caso ${caseKey.toUpperCase()}`)
    setMessage('Exemplo carregado. Use Desfazer para recuperar a configuração anterior.')
  }
  return <>
    <button className="wm-action-button" type="button" disabled={!actions.canUndo} onClick={actions.undo} title="Desfazer (Ctrl+Z)" aria-label="Desfazer">↶</button>
    <button className="wm-action-button" type="button" disabled={!actions.canRedo} onClick={actions.redo} title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer">↷</button>
    <button ref={buttonRef} className="wm-action-button" type="button" onClick={() => setOpen(true)}>Experimentos</button>
    {open && createPortal(<div className="wm-docs-backdrop" onMouseDown={event => event.target === event.currentTarget && close()}>
      <section ref={dialogRef} className="experiment-dialog" role="dialog" aria-modal="true" aria-label="Experimentos">
        <header><h2>Experimentos · {version}</h2><button onClick={close} aria-label="Fechar experimentos">×</button></header>
        <p>Guarde parâmetros, estados, camadas, retratos e câmera 3D em um arquivo para retomar o estudo.</p>
        <label>Nome<input autoFocus value={name} maxLength={100} onChange={event => setName(event.target.value)} /></label>
        <div className="experiment-buttons"><button onClick={save} disabled={state.draggingCharacteristicPoint}>Salvar JSON</button>
          <button onClick={() => fileRef.current.click()} disabled={state.draggingCharacteristicPoint}>Abrir JSON</button></div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={load} />
        <h3>Exemplos guiados</h3>
        <div className="experiment-buttons"><button onClick={() => example('case-iv')}>Rarefação · IV</button>
          <button onClick={() => example('case-iii')}>Rarefação · III-A</button>
          <button onClick={() => example('states')}>Dois estados · IV</button></div>
        <p>O exemplo de estados serve para inspeção; não pressupõe um choque admissível entre os estados.</p>
        <p role="status" aria-live="polite">{message}</p>
      </section>
    </div>, document.body)}
  </>
}

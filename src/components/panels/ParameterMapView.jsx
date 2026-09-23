import React, { useRef } from 'react'
import MathLabel from './MathLabel'
import ParameterRangeControl from './ParameterRangeControl'
import ParameterCanvas from './ParameterCanvas'

const PARAMETER_CASE_ROWS = [
  ['ia', 'CASO I-A'],
  ['ib', 'CASO I-B'],
  ['ic', 'CASO I-C'],
  ['iia', 'CASO II-A'],
  ['iib', 'CASO II-B'],
  ['iic', 'CASO II-C'],
  ['iiia', 'CASO III-A'],
  ['iiib', 'CASO III-B'],
  ['iiic', 'CASO III-C'],
  ['iv', 'CASO IV'],
]

export default function ParameterMapView({
  parameterWindow,
  visibleParameterCurves,
  activeParameterCase,
  selectedSchaefferShearerCase,
  currentParameterPoint,
  parameterPointBoundsForWindow,
  updateParameterPoint,
  parameterAxisX,
  parameterAxisY,
  setHoveredParameterCase,
  updateVisibleParameterCurve,
  updateParameterWindow,
  resetParameterWindow,
  params,
  updateParam,
  resetParams,
}) {
  const previousNonSymmetricB2 = useRef(params.b2 !== 0 ? params.b2 : 0.2)
  const symmetric = params.b2 === 0
  const selectSymmetry = (nextSymmetric) => {
    if (nextSymmetric) {
      if (params.b2 !== 0) previousNonSymmetricB2.current = params.b2
      updateParam('b2', 0)
    } else {
      updateParam('b2', previousNonSymmetricB2.current)
    }
  }

  return (
    <div className="wm-stage-content params-view">
      <div className="stage-param-plot">
        <div className="stage-param-plane" style={{ '--axis-x': `${parameterAxisX}%`, '--axis-y': `${parameterAxisY}%` }}>
          <ParameterCanvas
            plotWindow={parameterWindow}
            visibleCurves={visibleParameterCurves}
            hoveredCase={activeParameterCase}
            selectedCase={selectedSchaefferShearerCase}
            parameterPoint={currentParameterPoint}
            pointBounds={parameterPointBoundsForWindow}
            onParameterPointChange={updateParameterPoint}
          />
          <span className="stage-label b1"><MathLabel tex={"b_1"} /></span>
          <span className="stage-label b2"><MathLabel tex={"b_2"} /></span>
        </div>
        <div className="stage-param-bottom">
            <div className="stage-param-case-card">
              <div className="curve-card-title">Casos</div>
              {PARAMETER_CASE_ROWS.map(([key, label]) => (
                <div
                  key={key}
                  className={`curve-toggle-row curve-region-row ${activeParameterCase === key ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredParameterCase(key)}
                  onMouseLeave={() => setHoveredParameterCase(null)}
                >
                  <span className={`curve-swatch region-caso-${key}`} />
                  {label}
                </div>
              ))}
            </div>

          <div className="stage-param-window-controls">
            <div className="window-card-title">JANELA DO GRÁFICO</div>
            <ParameterRangeControl name="b1 mínimo" label={<MathLabel tex={"b_{1,min}"} />} min={-10} max={-0.5} step={0.5} value={parameterWindow.b1Min} onChange={(v) => updateParameterWindow('b1Min', v)} />
            <ParameterRangeControl name="b1 máximo" label={<MathLabel tex={"b_{1,max}"} />} min={0.5} max={12} step={0.5} value={parameterWindow.b1Max} onChange={(v) => updateParameterWindow('b1Max', v)} />
            <ParameterRangeControl name="b2 mínimo" label={<MathLabel tex={"b_{2,min}"} />} min={-10} max={-0.5} step={0.5} value={parameterWindow.b2Min} onChange={(v) => updateParameterWindow('b2Min', v)} />
            <ParameterRangeControl name="b2 máximo" label={<MathLabel tex={"b_{2,max}"} />} min={0.5} max={10} step={0.5} value={parameterWindow.b2Max} onChange={(v) => updateParameterWindow('b2Max', v)} />
            <button type="button" className="primary-button parameter-window-reset" onClick={resetParameterWindow}>Redefinir janela</button>
          </div>
          <div className="stage-param-legend-column">
            <div className="stage-param-curve-card">
              <div className="curve-card-title">CURVAS</div>
              <label className="curve-toggle-row">
                <input type="checkbox" checked={visibleParameterCurves.c1} onChange={(e) => updateVisibleParameterCurve('c1', e.target.checked)} />
                <span className="curve-swatch" />
                <MathLabel tex="C_1: b_2^2-4(b_1-1)=0" />
              </label>
              <label className="curve-toggle-row">
                <input type="checkbox" checked={visibleParameterCurves.c2} onChange={(e) => updateVisibleParameterCurve('c2', e.target.checked)} />
                <span className="curve-swatch c2" />
                <MathLabel tex="C_2: b_2^2+\frac{4}{b_1+1}=0" />
              </label>
              <label className="curve-toggle-row">
                <input type="checkbox" checked={visibleParameterCurves.c3} onChange={(e) => updateVisibleParameterCurve('c3', e.target.checked)} />
                <span className="curve-swatch c3" />
                <MathLabel tex="C_3: (b_1-1)(b_1+2)^2-(b_1+1)b_2^2=0" />
              </label>
            </div>
          </div>
          <div className="stage-param-model-card">
            <div className="model-card-title">PARÂMETROS DO FLUXO</div>
            <div className="schaeffer-case-selector" role="radiogroup" aria-label="Simetria do fluxo">
              <label className={`schaeffer-case-option ${symmetric ? 'active' : ''}`}>
                <input type="radio" name="flow-symmetry" checked={symmetric} onChange={() => selectSymmetry(true)} />
                <span>Simétrico (<MathLabel tex="b_2=0" />)</span>
              </label>
              <label className={`schaeffer-case-option ${!symmetric ? 'active' : ''}`}>
                <input type="radio" name="flow-symmetry" checked={!symmetric} onChange={() => selectSymmetry(false)} />
                <span>Não simétrico (<MathLabel tex="b_2\ne 0" />)</span>
              </label>
            </div>
            <ParameterRangeControl name="b1" label={<MathLabel tex="b_1" />} min={parameterWindow.b1Min} max={parameterWindow.b1Max} step={0.1} value={params.b1} onChange={(v) => updateParam('b1', v)} />
            <ParameterRangeControl name="b2" label={<MathLabel tex="b_2" />} min={parameterWindow.b2Min} max={parameterWindow.b2Max} step={0.1} value={params.b2} onChange={(v) => updateParam('b2', v)} />
            <ParameterRangeControl name="c" label={<MathLabel tex="c" />} min={-4} max={4} step={0.1} value={params.c} onChange={(v) => updateParam('c', v)} />
            <ParameterRangeControl name="a" label={<MathLabel tex="a" />} min={-5} max={5} step={0.1} value={params.a ?? 0} onChange={(v) => updateParam('a', v)} />
            <button type="button" onClick={resetParams} className="primary-button">Restaurar parâmetros</button>
          </div>
        </div>
      </div>
    </div>
  )
}

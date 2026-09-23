import MathLabel from '../MathLabel'
import { Toggle } from '../PanelPrimitives'
import { defaultSolutionVisibility } from './panelDefaults'

function branchPalette(branch) {
  return {
    sign: branch === 'slow' ? '-' : '+',
    dagger: branch === 'reflected' ? '^\\dagger' : '',
    shockColor: branch === 'slow' ? '#60a5fa' : branch === 'fast' ? '#fb7185' : '#fca5a5',
    rarefactionColor: branch === 'slow' ? '#34d399' : branch === 'fast' ? '#a78bfa' : '#c4b5fd',
    compositeColor: branch === 'slow' ? '#f59e0b' : branch === 'fast' ? '#f472b6' : '#f9a8d4',
  }
}

export function SolutionCurveOptions({ branch, title, visibility, setVisibility }) {
  const values = visibility?.[branch] ?? defaultSolutionVisibility[branch]
  const update = (name, checked) => {
    setVisibility?.((prev) => ({
      ...defaultSolutionVisibility,
      ...prev,
      [branch]: {
        ...defaultSolutionVisibility[branch],
        ...(prev?.[branch] ?? {}),
        [name]: checked,
      },
    }))
  }

  const { sign, dagger, shockColor, rarefactionColor, compositeColor } = branchPalette(branch)

  return (
    <div className="mode-status-card solution-options-card">
      <strong>{title}</strong>
      <div className="toggle-grid">
        <Toggle
          checked={values.hugoniotLocal !== false}
          onChange={(checked) => update('hugoniotLocal', checked)}
          color={shockColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal H_${sign})`} /><span> : Arco local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal H_${sign})`} /><span> — Arco local</span></>,
            description: (
              <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        <Toggle
          checked={values.hugoniotNonlocal !== false}
          onChange={(checked) => update('hugoniotNonlocal', checked)}
          color={shockColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal H_${sign})`} /><span> : Arco não local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal H_${sign})`} /><span> — Arco não local</span></>,
            description: (
              <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        {branch === 'slow' ? <Toggle
          checked={values.auxiliaryHPlus !== false}
          onChange={(checked) => update('auxiliaryHPlus', checked)}
          color={'#d4af37'}
          label={<><MathLabel tex={String.raw`\mathcal H_+`} /><span> : Hugoniot</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal H_+`} /><span> — Hugoniot</span></>,
            description: (
              <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
            ),
            documentation: "curvas",
          }}
        /> : null}
        <Toggle
          checked={values.rarefactionLocal !== false}
          onChange={(checked) => update('rarefactionLocal', checked)}
          color={rarefactionColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal R_${sign})`} /><span> : Arco local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal R_${sign})`} /><span> — Arco local</span></>,
            description: (
              <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        <Toggle
          checked={values.rarefactionNonlocal !== false}
          onChange={(checked) => update('rarefactionNonlocal', checked)}
          color={rarefactionColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal R_${sign})`} /><span> : Arco não local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal R_${sign})`} /><span> — Arco não local</span></>,
            description: (
              <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        <Toggle
          checked={values.compositeLocal !== false}
          onChange={(checked) => update('compositeLocal', checked)}
          color={compositeColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal K_${sign})`} /><span> : Arco local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{loc}${dagger}(\mathcal K_${sign})`} /><span> — Arco local</span></>,
            description: (
              <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        <Toggle
          checked={values.compositeNonlocal !== false}
          onChange={(checked) => update('compositeNonlocal', checked)}
          color={compositeColor}
          label={<><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal K_${sign})`} /><span> : Arco não local</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal A_{nl}${dagger}(\mathcal K_${sign})`} /><span> — Arco não local</span></>,
            description: (
              <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada. Exibe apenas o arco admissível usado na construção da solução."}</p></>
            ),
            documentation: "solucao",
          }}
        />
        <Toggle
          checked={values.involvedRarefactionCurve === true}
          onChange={(checked) => update('involvedRarefactionCurve', checked)}
          color={rarefactionColor}
          label={<><MathLabel tex={String.raw`\mathcal R_{nl}${dagger}`} /><span> : Rarefação</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal R_{nl}${dagger}`} /><span> — Rarefação</span></>,
            description: (
              <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado."}</p></>
            ),
            documentation: "curvas",
          }}
        />
        <Toggle
          checked={values.involvedCompositeCurve === true}
          onChange={(checked) => update('involvedCompositeCurve', checked)}
          color={compositeColor}
          label={<><MathLabel tex={String.raw`\mathcal K_{nl}${dagger}`} /><span> : Composta</span></>}
          helper={{
            title: <><MathLabel tex={String.raw`\mathcal K_{nl}${dagger}`} /><span> — Composta</span></>,
            description: (
              <><p>{"Curva composta construída pela extensão sônica da rarefação da família indicada."}</p></>
            ),
            documentation: "curvas",
          }}
        />
        {branch === 'slow' ? (
          <>
            <Toggle
              checked={values.satHugoniotLocal !== false}
              onChange={(checked) => update('satHugoniotLocal', checked)}
              color={'#1d4ed8'}
              label={<><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{loc}(\mathcal H_-))`} /><span> : Arco local</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{loc}(\mathcal H_-))`} /><span> — Arco local</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. Exibe apenas o arco admissível usado na construção da solução."}</p></>
                ),
                documentation: "solucao",
              }}
            />
            <Toggle
              checked={values.satHugoniotNonlocal !== false}
              onChange={(checked) => update('satHugoniotNonlocal', checked)}
              color={'#3b82f6'}
              label={<><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{nl}(\mathcal H_-))`} /><span> : Arco não local</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{nl}(\mathcal H_-))`} /><span> — Arco não local</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. Exibe apenas o arco admissível usado na construção da solução."}</p></>
                ),
                documentation: "solucao",
              }}
            />
            <Toggle
              checked={values.satRarefactionLocal !== false}
              onChange={(checked) => update('satRarefactionLocal', checked)}
              color={'#047857'}
              label={<><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{loc}(\mathcal R_-))`} /><span> : Arco local</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A_{loc}(\mathcal R_-))`} /><span> — Arco local</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo. Exibe apenas o arco admissível usado na construção da solução."}</p></>
                ),
                documentation: "solucao",
              }}
            />
            <Toggle
              checked={values.satInvolvedRarefactionCurve === true}
              onChange={(checked) => update('satInvolvedRarefactionCurve', checked)}
              color={'#86efac'}
              label={<><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_-}(\mathcal R_{nl})`} /><span> : Hugoniot</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_-}(\mathcal R_{nl})`} /><span> — Hugoniot</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={values.satComposite !== false}
              onChange={(checked) => update('satComposite', checked)}
              color={'#b45309'}
              label={<><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A(\mathcal K_-))`} /><span> : Hugoniot</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`\operatorname{Sat}_{\mathcal H_+}(\mathcal A(\mathcal K_-))`} /><span> — Hugoniot</span></>,
                description: (
                  <><p>{"Folha de Hugoniot: estados ligados pela condição de Rankine–Hugoniot, com um dos estados fixo."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={values.chosenHPlusIntersection !== false}
              onChange={(checked) => update('chosenHPlusIntersection', checked)}
              color={'#facc15'}
              label={<><MathLabel tex={String.raw`H_+^* \cap \mathcal A_+^\dagger \cap \operatorname{Sat}_{H_+}(\mathcal A_-)`} /><span> : Curva da solução</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`H_+^* \cap \mathcal A_+^\dagger \cap \operatorname{Sat}_{H_+}(\mathcal A_-)`} /><span> — Curva da solução</span></>,
                description: (
                  <><p>{"Mostra este conjunto na visualização ativa."}</p></>
                ),
                documentation: "curvas",
              }}
            />
            <Toggle
              checked={values.chosenHMinusRarefaction !== false}
              onChange={(checked) => update('chosenHMinusRarefaction', checked)}
              color={'#93c5fd'}
              label={<><MathLabel tex={String.raw`H_-^* \cap \mathcal R_-`} /><span> : Rarefação</span></>}
              helper={{
                title: <><MathLabel tex={String.raw`H_-^* \cap \mathcal R_-`} /><span> — Rarefação</span></>,
                description: (
                  <><p>{"Curva integral do campo característico da família indicada, a partir do estado selecionado."}</p></>
                ),
                documentation: "curvas",
              }}
            />
          </>
        ) : null}
      </div>
      {branch === 'reflected' ? <p className="solution-reflection-note"><MathLabel tex={'\\dagger:(\\tau,Y,z)\\mapsto(\\tau,-Y,z)'} /></p> : null}
    </div>
  )
}

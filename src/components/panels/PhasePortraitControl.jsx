import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { Section, Toggle } from './PanelPrimitives'
import MathLabel from './MathLabel'
import LayerHelp from './LayerHelp'

export default function PhasePortraitControl() {
  const phase = usePhasePortrait()
  if (!phase || !['3d', 'state'].includes(phase.activeView)) return null
  if (phase.activeView === '3d') return <Section title="Retrato de fase" defaultOpen={true} accent="#22d3ee"><div className="phase-controls">
    <Toggle checked={phase.checked} disabled={!phase.valid} onChange={phase.setEnabled} color="#22d3ee" helper={{
          title: <><MathLabel tex={String.raw`\mathcal{R}`} /><span> — Campo de rarefação</span></>,
          description: (
            <><p>{"Mostra curvas integrais sobre a superfície característica C, sem selecionar pontos. A família lenta aparece em ciano e a rápida em rosa. Ative C para exibir o campo; as setas seguem sua orientação regularizada."}</p></>
          ),
          documentation: "retratos",
        }} label={<>Campo de Rarefação <MathLabel tex="\mathcal{R}" /></>} />
    <Toggle checked={phase.compositeEnabled} onChange={phase.setCompositeEnabled} color="#fda4af" helper={{
          title: <><MathLabel tex={String.raw`\mathcal{K}_{-}`} /><span> — Campo da composta K₋</span></>,
          description: (
            <><p>{"Mostra as curvas compostas sobre a sônica esquerda S⁻, com setas orientadas pela velocidade decrescente de K₋. Pode ser ativado sozinho; a superfície S⁻ tem seu próprio controle de visibilidade."}</p></>
          ),
          documentation: "retratos",
        }} label={<>Campo Composta <MathLabel tex="\mathcal{K}_{-}" /></>} />
    <p className="phase-controls-summary">{phase.valid
      ? <>Integrais globais de <MathLabel tex="\mathcal{C}" /> e suas compostas sobre <MathLabel tex="\mathcal{S}^{-}" />.</>
      : <>Ative <MathLabel tex="\mathcal{C}" /> para mostrar a rarefação. A composta pode ser exibida sozinha.</>}</p>
    {phase.checked && <fieldset className="phase-layers"><legend>Elementos da rarefação</legend>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.singularities} onChange={e => phase.setRarefactionOption('singularities', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{R}`} /><span> — Singularidades da rarefação</span></>,
          description: (
            <><p>{"Marca os pontos críticos do campo regularizado de rarefação. No modo inspeção, passe sobre os marcadores para consultar a classificação local."}</p></>
          ),
          documentation: "retratos",
        }}>Singularidades</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.separatrices} onChange={e => phase.setRarefactionOption('separatrices', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{R}`} /><span> — Separatrizes da rarefação</span></>,
          description: (
            <><p>{"Mostra os ramos estáveis em azul e instáveis em âmbar associados às selas. Estável e instável referem-se ao campo regularizado na carta indicada."}</p></>
          ),
          documentation: "retratos",
        }}>Separatrizes</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.eigenDirections} onChange={e => phase.setRarefactionOption('eigenDirections', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{R}`} /><span> — Autodireções da rarefação</span></>,
          description: (
            <><p>{"Mostra as direções próprias reais da linearização junto às singularidades. São direções locais, não trajetórias completas."}</p></>
          ),
          documentation: "retratos",
        }}>Autodireções</LayerHelp>
      </label>
      {phase.rarefactionOptions.separatrices && <small>Estável (azul) e instável (âmbar) no campo regularizado da carta indicada.</small>}
    </fieldset>}
    {phase.compositeEnabled && <fieldset className="phase-layers"><legend>Elementos da composta em <MathLabel tex="\mathcal{S}^{-}" /></legend>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.singularities} onChange={e => phase.setCompositeOption('singularities', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{K}_{-}`} /><span> — Singularidades da composta</span></>,
          description: (
            <><p>{"Marca os pontos críticos verificados em uma carta regular de S⁻. A classificação vem da linearização local: um centro linear não garante um centro não linear. Os detalhes aparecem nos marcadores no modo inspeção."}</p></>
          ),
          documentation: "retratos",
        }}>Singularidades</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.separatrices} onChange={e => phase.setCompositeOption('separatrices', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{K}_{-}`} /><span> — Separatrizes da composta</span></>,
          description: (
            <><p>{"Mostra ramos das selas hiperbólicas: estáveis em azul e instáveis em âmbar na carta local. As setas seguem a orientação de K₋, que pode diferir da orientação do campo usado na classificação."}</p></>
          ),
          documentation: "retratos",
        }}>Separatrizes</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.eigenDirections} onChange={e => phase.setCompositeOption('eigenDirections', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex={String.raw`\mathcal{K}_{-}`} /><span> — Autodireções da composta</span></>,
          description: (
            <><p>{"Mostra direções próprias reais da linearização nas singularidades. Focos e centros lineares não têm autodireções reais; autovalores repetidos ou nulos não geram direções artificiais."}</p></>
          ),
          documentation: "retratos",
        }}>Autodireções</LayerHelp>
      </label>
      {phase.compositeOptions.separatrices && <small>Ramos das selas: estável (azul) e instável (âmbar) na carta local. Setas seguem a orientação de <MathLabel tex="\mathcal{K}_{-}" />.</small>}
      {phase.compositeOptions.eigenDirections && <small>Direções reais da linearização; focos e centros lineares não possuem autodireções reais.</small>}
    </fieldset>}
  </div></Section>
  return <Section title="Retrato de fase" defaultOpen={true} accent="#22d3ee"><div className="phase-controls">
    <Toggle checked={phase.checked} disabled={!phase.valid} onChange={phase.setEnabled} color="#22d3ee" helper={{
          title: <><span>Retrato viscoso</span></>,
          description: (
            <><p>{"Mostra órbitas no espaço de estados usando U_L e a velocidade associada à sua seleção. Selecione U_L e U_R para ativar. U_R só é equilíbrio quando satisfaz Rankine–Hugoniot para essa velocidade; a conexão destacada é evidência numérica, não uma garantia de existência."}</p></>
          ),
          documentation: "retratos",
        }} label="Retrato viscoso" />
    <p className="phase-controls-summary">{phase.activeView === '3d'
      ? phase.valid ? 'Curvas integrais sobre a característica, sem selecionar pontos.' : 'Ative a superfície característica.'
      : !phase.valid ? <>Selecione <MathLabel tex="U_L" /> e <MathLabel tex="U_R" /> para ativar.</>
        : <>Velocidade de <MathLabel tex="U_L" /> · <MathLabel tex="s" /> = {phase.viscous.speed.toPrecision(5)}</>}</p>
    {phase.activeView === 'state' && phase.checked && <>
      <div className="phase-view-switch" role="group" aria-label="Visualização do retrato viscoso">
        <button type="button" aria-pressed={!phase.viscousOptions.connectionOnly} onClick={() => phase.setViscousOption('connectionOnly', false)}>Retrato completo</button>
        <button type="button" aria-pressed={phase.viscousOptions.connectionOnly} onClick={() => phase.setViscousOption('connectionOnly', true)}>Conexão <MathLabel tex="U_L \to U_R" /></button>
      </div>
      <fieldset className="phase-layers"><legend>Elementos visíveis</legend>
        <label className="phase-layer">
          <input type="checkbox" checked={phase.viscousOptions.equilibria} onChange={event => phase.setViscousOption('equilibria', event.target.checked)} />
          <span className="phase-layer-color" style={{ background: '#4ade80' }} />
          <LayerHelp helper={{
          title: <><span>Equilíbrios do retrato viscoso</span></>,
          description: (
            <><p>{"Mostra os zeros do campo viscoso e sua classificação local. Se o resíduo de Rankine–Hugoniot em U_R não for pequeno, ele permanece apenas como referência, sem ser tratado como equilíbrio."}</p></>
          ),
          documentation: "retratos",
        }}><strong>Equilíbrios</strong><small>Pontos de equilíbrio e classificação</small></LayerHelp>
        </label>
        <label className="phase-layer">
          <input type="checkbox" checked={phase.viscousOptions.invariantManifolds} onChange={event => phase.setViscousOption('invariantManifolds', event.target.checked)} />
          <span className="phase-layer-color" style={{ background: '#fbbf24' }} />
          <LayerHelp helper={{
          title: <><span>Separatrizes do retrato viscoso</span></>,
          description: (
            <><p>{"Mostra trajetórias associadas às direções estáveis e instáveis de equilíbrios sela. Ramos instáveis são integrados para frente e estáveis para trás; não há ligação automática entre U_L e U_R."}</p></>
          ),
          documentation: "retratos",
        }}><strong>Separatrizes</strong><small><MathLabel tex="W^s" /> estável · <MathLabel tex="W^u" /> instável</small></LayerHelp>
        </label>
        <label className="phase-layer">
          <input type="checkbox" checked={phase.viscousOptions.nullclines} onChange={event => phase.setViscousOption('nullclines', event.target.checked)} />
          <span className="phase-layer-color" style={{ background: '#a78bfa' }} />
          <LayerHelp helper={{
          title: <><span>Nulclinas</span></>,
          description: (
            <><p>Curvas onde <MathLabel tex="u'=0" /> ou <MathLabel tex="v'=0" />. Cada uma anula uma componente do campo; seus cruzamentos são candidatos a equilíbrios. Não são, em geral, trajetórias.</p></>
          ),
          documentation: "retratos",
        }}><strong>Nulclinas</strong><small>Curvas onde <MathLabel tex="u'=0" /> ou <MathLabel tex="v'=0" /></small></LayerHelp>
        </label>
        <label className="phase-layer">
          <input type="checkbox" checked={phase.viscousOptions.eigenDirections} onChange={event => phase.setViscousOption('eigenDirections', event.target.checked)} />
          <span className="phase-layer-color" style={{ background: '#f8fafc' }} />
          <LayerHelp helper={{
          title: <><span>Autodireções do retrato viscoso</span></>,
          description: (
            <><p>{"Mostra as direções próprias reais da linearização nos equilíbrios. Elas descrevem o comportamento local das órbitas; direções complexas, repetidas ou nulas não geram separatrizes artificiais."}</p></>
          ),
          documentation: "retratos",
        }}><strong>Autodireções</strong><small>Direções locais nos equilíbrios</small></LayerHelp>
        </label>
      </fieldset>
      <p className="phase-controls-hint">Arraste <MathLabel tex="U_R" /> no gráfico para explorar a conexão. O estado e o resíduo atualizados aparecem junto ao gráfico.</p>
    </>}
  </div></Section>
}

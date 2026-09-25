import { usePhasePortrait } from '../../app/inspection/PhasePortraitContext.js'
import { Section, Toggle } from './PanelPrimitives'
import MathLabel from './MathLabel'
import LayerHelp from './LayerHelp'

export default function PhasePortraitControl() {
  const phase = usePhasePortrait()
  if (!phase || !['3d', 'state'].includes(phase.activeView)) return null
  if (phase.activeView === '3d') return <Section title="Retrato de fase" defaultOpen={true} accent="#22d3ee"><div className="phase-controls">
    <Toggle checked={phase.checked} disabled={!phase.valid} onChange={phase.setEnabled} color="#22d3ee" helper={{
          title: <><span>Campo de Rarefação</span></>,
description: (
  <>
    <p>
      O campo de rarefação é o campo vetorial definido sobre a característica <MathLabel tex="\mathcal{C}" /> pelas direções características do sistema.
      Se
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U=\pi_-(P)=\pi_+(P)" />.
    </div>

    <p>
      então, em cada ponto, a direção característica <MathLabel tex="r(U)" /> satisfaz
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="DF(U)r(U)=\lambda(U)r(U)" />.
    </div>

    <p>
      As curvas de rarefação são as curvas integrais desse campo, isto é, as soluções da EDO
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=r(U)" />.
    </div>

    <p>
      Na folha característica lenta <MathLabel tex="\mathcal{C}_s" />, a direção é determinada pelo autovetor lento <MathLabel tex="r_s(U)" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="DF(U)r_s(U)=\lambda_s(U)r_s(U)" />.
    </div>

    <p>
      e a EDO de rarefação é
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=r_s(U)" />.
    </div>

    <p>
      Na folha característica rápida <MathLabel tex="\mathcal{C}_f" />, a direção é determinada pelo autovetor rápido <MathLabel tex="r_f(U)" />:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="DF(U)r_f(U)=\lambda_f(U)r_f(U)" />.
    </div>

    <p>
      e a EDO de rarefação é
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=r_f(U)" />.
    </div>

    <p>
      A característica decompõe-se em
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\mathcal{C}=\mathcal{C}_s\cup\mathcal{E}\cup\mathcal{C}_f" />.
    </div>

    <p>
      Na curva de coincidência <MathLabel tex="\mathcal{E}" />, as velocidades características coincidem:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\lambda_s(U)=\lambda_f(U)" />.
    </div>

    <p>
      As curvas integrais podem possuir trechos em <MathLabel tex="\mathcal{C}_s" /> e <MathLabel tex="\mathcal{C}_f" />, encontrando a curva de coincidência <MathLabel tex="\mathcal{E}" />. O conjunto dessas curvas constitui o retrato do campo de rarefação sobre <MathLabel tex="\mathcal{C}" />.
    </p>
  </>
),
          documentation: "retratos",
        }} label={<>Campo de Rarefação <MathLabel tex="\mathcal{R}" /></>} />
    <Toggle checked={phase.compositeEnabled} onChange={phase.setCompositeEnabled} color="#fda4af" helper={{
          title: <><span>Campo Composto em </span><MathLabel tex="\mathcal{S}^-" /></>,
description: (
  <>
    <p>
      O campo composto em <MathLabel tex="\mathcal{S}^-" /> é o campo definido
      sobre a superfície sônica esquerda a partir das curvas integrais do
      campo de rarefação na característica <MathLabel tex="\mathcal{C}" />.
    </p>

    <p>
      Para cada curva integral do campo de rarefação e para cada ponto <MathLabel tex="P" /> dessa curva, toma-se o estado esquerdo
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="U_-=\pi_-(P)" />.
    </div>

    <p>
      Mantendo <MathLabel tex="U_-" /> fixo, considera-se a curva de
      Hugoniot forward <MathLabel tex="\mathcal{H}^{\mathrm{forw}}(U_-)" />. A união dessas curvas de Hugoniot produz a saturação forward da
      curva de rarefação.
    </p>

    <p>
      A interseção dessa superfície saturada com a sônica esquerda <MathLabel tex="\mathcal{S}^-" /> determina uma curva integral
      do campo composto.
    </p>

    <p>
      Repetindo essa construção para todas as curvas integrais do campo
      de rarefação, obtém-se a família de curvas integrais que constitui
      o campo composto em <MathLabel tex="\mathcal{S}^-" />.
    </p>

    <p>
      Portanto, o campo composto é tangente a <MathLabel tex="\mathcal{S}^-" /> e suas curvas integrais são as
      curvas compostas obtidas pela extensão das curvas de rarefação
      através da saturação forward.
    </p>
  </>
),
          documentation: "retratos",
        }} label={<>Campo Composto em <MathLabel tex="\mathcal{S}^{-}" /></>} />
    <p className="phase-controls-summary">{phase.valid
      ? <>Integrais globais de <MathLabel tex="\mathcal{C}" /> e suas compostas sobre <MathLabel tex="\mathcal{S}^{-}" />.</>
      : <>Ative <MathLabel tex="\mathcal{C}" /> para mostrar a rarefação. A composta pode ser exibida sozinha.</>}</p>
    {phase.checked && <fieldset className="phase-layers"><legend>Elementos do Campo de Rarefação</legend>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.singularities} onChange={e => phase.setRarefactionOption('singularities', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{R}" /><span> — Singularidades do Campo de Rarefação</span></>,
          description: (
            <><p>{"Marca os pontos críticos do campo regularizado de rarefação. No modo inspeção, passe sobre os marcadores para consultar a classificação local."}</p></>
          ),
          documentation: "retratos",
        }}>Singularidades</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.separatrices} onChange={e => phase.setRarefactionOption('separatrices', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{R}" /><span> — Separatrizes do Campo de Rarefação</span></>,
          description: (
            <><p>{"Mostra os ramos estáveis em azul e instáveis em âmbar associados às selas. Estável e instável referem-se ao campo regularizado na carta indicada."}</p></>
          ),
          documentation: "retratos",
        }}>Separatrizes</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.rarefactionOptions.eigenDirections} onChange={e => phase.setRarefactionOption('eigenDirections', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{R}" /><span> — Autodireções do Campo de Rarefação</span></>,
          description: (
            <><p>{"Mostra as direções próprias reais da linearização junto às singularidades. São direções locais, não trajetórias completas."}</p></>
          ),
          documentation: "retratos",
        }}>Autodireções</LayerHelp>
      </label>
      {phase.rarefactionOptions.separatrices && <small>Estável (azul) e instável (âmbar) no campo regularizado da carta indicada.</small>}
    </fieldset>}
    {phase.compositeEnabled && <fieldset className="phase-layers"><legend>Elementos do Campo Composto em <MathLabel tex="\mathcal{S}^{-}" /></legend>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.singularities} onChange={e => phase.setCompositeOption('singularities', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{K}_{-}" /><span> — Singularidades do Campo Composto</span></>,
          description: (
            <><p>{"Marca os pontos críticos verificados em uma carta regular de S⁻. A classificação vem da linearização local: um centro linear não garante um centro não linear. Os detalhes aparecem nos marcadores no modo inspeção."}</p></>
          ),
          documentation: "retratos",
        }}>Singularidades</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.separatrices} onChange={e => phase.setCompositeOption('separatrices', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{K}_{-}" /><span> — Separatrizes do Campo Composto</span></>,
          description: (
            <><p>{"Mostra ramos das selas hiperbólicas: estáveis em azul e instáveis em âmbar na carta local. As setas seguem a orientação de K₋, que pode diferir da orientação do campo usado na classificação."}</p></>
          ),
          documentation: "retratos",
        }}>Separatrizes</LayerHelp>
      </label>
      <label className="phase-layer">
        <input type="checkbox" checked={phase.compositeOptions.eigenDirections} onChange={e => phase.setCompositeOption('eigenDirections', e.target.checked)} />
        <LayerHelp helper={{
          title: <><MathLabel tex="\mathcal{K}_{-}" /><span> — Autodireções do Campo Composto</span></>,
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
          title: <><span>Campo de Perfil Viscoso</span></>,
description: (
  <>
    <p>
      O campo de perfil viscoso é o campo vetorial associado à regularização
      viscosa da lei de conservação. Para um estado esquerdo
      <MathLabel tex="U_-" /> e uma velocidade de choque
      <MathLabel tex="s" /> fixados, o perfil viscoso satisfaz a EDO
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\frac{dU}{d\xi}=F(U)-F(U_-)-s(U-U_-)" />.
    </div>

    <p>
      Portanto, o campo vetorial do perfil viscoso é
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="V(U)=F(U)-F(U_-)-s(U-U_-)" />.
    </div>

    <p>
      Os estados <MathLabel tex="U_-" /> e <MathLabel tex="U_+" /> ligados
      pela condição de Rankine-Hugoniot são pontos de equilíbrio desse campo:
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="V(U_-)=V(U_+)=0" />.
    </div>

    <p>
      Um choque possui perfil viscoso quando existe uma órbita heteroclínica
      do campo que conecta os dois estados, com
    </p>

    <div className="tooltip-equation">
      <MathLabel tex="\lim_{\xi\to-\infty}U(\xi)=U_-,\qquad\lim_{\xi\to+\infty}U(\xi)=U_+" />.
    </div>

    <p>
      Assim, o retrato do campo de perfil viscoso permite verificar a existência
      de uma conexão heteroclínica entre os estados associados ao choque.
    </p>
  </>
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

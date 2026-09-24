# Retratos globais de rarefação e composta

## Reutilização e dados

O retrato usa `buildRarefactionSegmentsData` e sua integração adaptativa existente
em `waves/rarefactionLeaf.js`. `buildGlobalRarefactionPortrait` conserva os segmentos
completos retornados pelo integrador, antes do recorte de desenho e da separação
de cores em C_s/C_f. Cada folha recebe um `id`; `displayParts` contém somente a
apresentação. A passagem por E não cria outra folha matemática.

`buildCompositePortrait` chama `buildCompositeSegmentsFromRarefaction`, em
`composite/bifoliation/core.js`, para cada segmento da mesma folha. A definição é

    K_{alpha,-} = Sat_{H^{forw}}(R_alpha) ∩ S^-.

`makeSaturatedHugoniotBifoliation` mantém U_- fixo no estado do gerador e varia
U_+ usando `solveHugoniotPointForFixedState`. A equação de interseção continua sendo
`sonicLeftImplicitF`. A interseção bruta usa toda S^-, sem restringir à parte lenta.
O retrato seleciona, em seguida, a família característica da geradora:
`waveSpeed(K) = waveSpeed(R)` com tolerância relativa 1e-6. A outra família
do mesmo estado esquerdo gerava uma segunda folheação transversal no desenho.
Esse teste é aplicado sobre os zeros da sônica existente: a igualdade de
velocidades sozinha também incluiria a característica trivial Y=0 fora de J.
Não basta exigir que a rarefação tenha alguma interseção com J; é necessário
selecionar a família correspondente em cada componente. Trechos rejeitados
interrompem a polilinha, sem ligar artificialmente os extremos restantes.

A opção `globalPortrait` permite procurar componentes mesmo quando R não cruza J.
A construção individual mantém sua política anterior de âncoras e fallback.
No retrato, u pertence a [0,1]: não se extrapola além da integral fornecida.
A parametrização por comprimento em coordenadas compactificadas distribui a
malha também perto da região finita; ela não desloca os pontos geradores.

O marching squares existente conserva suas componentes, refina os zeros nas
arestas por bisseção e rejeita mudanças de sinal através de polos. Células
ambíguas usam o valor do campo no centro. Falhas de avaliação interrompem a
polilinha, sem unir seus extremos. Não há suavização nem união por proximidade.
Cada componente armazena `sourceRarefactionId`, `sourceSegmentIndex` e `componentId`.

As setas consultam `solutionArcOrientation('slow', 'composite')`,
`orientSegmentBySpeed` e `compositeSpeedOrientationDiagnostics`: ds < 0 em K_-.
Trechos sem variação de velocidade numericamente resolvida ficam sem seta.

## Campo e singularidades

Cancelando o fator removível A na expressão existente de dτ/dz, obtém-se

    P = 1 + b2 z + (b1-1)z²,
    B = (2-b1)z-b2,
    F(τ,z) = (Bτ - 2cP/[b1(1+z²)²], P).

Em pontos regulares, F_τ/F_z é exatamente a derivada já usada. As raízes de A
não são singularidades dinâmicas. Nas raízes reais z* de P, a singularidade
isolada está em τ=0, sobre E. Sua matriz é

    [[B(z*), -2cP'(z*)/[b1(1+z*²)²]], [0, P'(z*)]].

Os autovalores e autovetores são calculados dessa matriz. Autovalor nulo é
classificado como degenerescência, sem atribuir estrutura hiperbólica.

**Correção da classificação anterior no infinito:** a carta canônica do próprio
projeto é (T,Z)=(-z²τ,1/z), conforme `geometry/stateProjections.js`. Manter τ fixo
ao trocar z por 1/z produzia uma classificação inadequada. Com H=b1-1+b2Z+Z²,
o campo transportado e regularizado por Z é

    T_dot = (b1+b2Z+2Z²)T + 2cZH/[b1(1+Z²)²],
    Z_dot = -ZH.

Em (0,0), a matriz é [[b1,2c(b1-1)/b1],[0,1-b1]]. Os autovalores corretos
nessa carta são b1 e 1-b1. O ponto no infinito tem uma única identidade,
representada nas duas bordas do desenho compactificado.

As separatrizes das selas partem de perturbações ±1e-5 nas autodireções e usam
`integrateOrbit` sobre essas expressões do mesmo campo, sem interpolação de
órbitas. Estável/instável refere-se ao tempo regularizado da respectiva carta:
o fator de transição pode mudar o sinal. A direção contida em Z=0 é registrada
na linearização, mas colapsa no desenho em τ; não se inventa uma curva visível
para representá-la. A integração é limitada pelo domínio e orçamento numéricos.

J continua sendo calculada pelas rotinas existentes. As interseções R ∩ J usam
`findRarefactionSonicAnchors`, também usada pela composta, pois S^- ∩ C = J.
Nem J nem as superfícies sônicas são classificadas automaticamente como
singularidades ou separatrizes.

## Interface e desempenho

Os controles Rarefação e Composta K_- aparecem diretamente no painel esquerdo.
Os elementos especiais ficam visíveis quando um retrato está ativo. E, J e
sônicas são controladas somente por seus botões próprios, fora do retrato.
Ativar K_- não ativa S^- implicitamente; nenhuma saturação intermediária é exigida.

`globalPortrait.worker.js` calcula fora da thread de interação.
`useGlobalPortrait` guarda até três conjuntos por parâmetros, janela e resolução.
O primeiro resultado mostra a rarefação enquanto a composta termina. Cálculos
obsoletos são cancelados; seleções, câmera e controles de visibilidade não
pertencem à chave matemática. A composta é calculada sob demanda; ocultá-la
preserva o cache e as integrais de origem.

As curvas são aproximações numéricas em domínio e malha finitos. Conservam-se
todas as componentes encontradas, mas uma malha finita não certifica a detecção
de componentes arbitrariamente pequenas. A resolução controla as amostras do
contorno. Os cortes de desenho não modificam os dados completos armazenados.

## Arquivos da implementação

- `src/entities/phasePortrait/rarefactionPortrait.js`: folhas globais e partes visuais.
- `src/entities/phasePortrait/compositePortrait.js`: família K_-, metadados e orientação.
- `src/entities/composite/bifoliation/core.js`: modo global sem exigir âncoras.
- `src/entities/composite/bifoliation/marchingSquares.js`: refinamento e preservação das componentes.
- `src/entities/composite/bifoliation/parametrization.js`: distribuição compactificada da malha.
- `src/entities/surfaceImplicit/state.js`: extensões algébricas do mesmo campo nas duas cartas.
- `src/entities/phasePortrait/rarefactionSingularities.js`: matrizes, autodireções e infinito.
- `src/entities/phasePortrait/rarefactionSpecialElements.js`: separatrizes e interseções com J.
- `src/workers/globalPortrait.worker.js`: cálculo assíncrono em etapas.
- `src/hooks/useGlobalPortrait.js`: cache e cancelamento.
- `src/app/inspection/PhasePortraitProvider.jsx`: opções e referências compartilhadas.
- `src/components/panels/PhasePortraitControl.jsx`: controles explícitos no painel esquerdo.
- `src/components/scene/RarefactionPhasePortrait.jsx`: desenho dos retratos e elementos.
- `src/components/scene/RarefactionSingularityMarker.jsx`: detalhes da linearização no hover.
- `src/app/scene/WaveSceneViewport.jsx`: S^- respeita exclusivamente seu controle próprio.
- `src/App.jsx`: conexão com o provedor do retrato.
- `tests/compositePortrait.test.js`: incidência, identidade, componentes, campo e orientação.
- `tests/rarefactionSpecialElements.test.js`: Jacobianos, mudança de carta e separatrizes.
- `tests/rarefactionSingularities.test.js`: expectativas corrigidas para a carta do infinito.
- `docs/07-retratos-de-fase.md` e este documento: uso, justificativas e limites numéricos.

## Validação da entrega

- Referência antes das mudanças: 110 testes existentes passaram.
- Suíte final após a seleção da família geradora: 119 testes passaram.
- ESLint passou em todos os arquivos JavaScript/JSX alterados nesta implementação.
- Build Vite concluído; apenas aviso de tamanho do bundle principal/Three.
- Navegador: composta sem estados selecionados, sobreposição com rarefação,
  separatrizes e autodireções, e sincronização do controle de J com a camada existente.
- A alternância dos elementos visuais não exibe novo cálculo nem altera os dados
  do worker; esses controles não entram na chave do cache.

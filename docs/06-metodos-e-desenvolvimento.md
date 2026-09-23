# 6. Métodos computacionais e desenvolvimento

## Organização do código

- `src/entities/`: definições e construções matemáticas por domínio.
- `src/geometry/`: geração, projeção, interseção e tratamento de geometrias.
- `src/components/`: apresentação das curvas, superfícies, painéis e vistas.
- `src/components/objects/`: desenhos agrupados pelo objeto matemático, incluindo suas curvas, superfícies e saturações.
- `src/app/`: estado e coordenação dos fluxos da interface.
- `src/hooks/`: hooks compartilhados de cálculo e carregamento de geometrias.
- `src/workers/`: cálculos de curvas executados fora da thread principal.
- `tests/`: testes das entidades, métodos numéricos e pipelines de solução.

O princípio arquitetural é manter o cálculo independente de React e Three.js sempre que possível. Componentes visuais consomem pontos, segmentos e malhas já construídos pelas camadas matemáticas.

### Convenções de nomes

Pastas representam responsabilidades ou domínios; os painéis visuais ficam em
`components/panels/` e sua coordenação em `app/panels/`. Componentes React usam
PascalCase, funções e propriedades usam camelCase, e hooks usam o prefixo `use`.
As implementações matemáticas pertencem a `entities/`. A entrada
`core/types/mathTypes.js` mantém os aliases de tipos ainda cobertos por testes;
as antigas fachadas sem consumidores foram removidas.

Em `components/objects/`, cada pasta identifica o objeto desenhado:
`hugoniot`, `rarefaction`, `composite`, `characteristic`, `sonic`, `coincidence`,
`hysteresis`, `bifurcation`, `inflection`, `doubleSonic` e `hopf`.
`solution` reúne desenhos que combinam famílias, e `shared` reúne primitivas
visuais reutilizáveis. A saturação fica junto da curva que a gera:
`HysteresisSaturationSurface`, `CoincidenceSaturationSurface` e
`RarefactionSaturationSurfaces`. Esta última é usada para construir as compostas,
mas a superfície desenhada é a saturação da rarefação.

Nos nomes dos desenhos, `Minus/Plus` correspondem aos sinais da notação:
`SonicMinusSurface` representa a sônica esquerda e `SonicPlusSurface` a direita.
Os identificadores internos dos registros de desenho e das tarefas dos workers
mantêm seus valores existentes; não são nomes de arquivos nem de objetos matemáticos.

`WavePoint` representa um ponto da variedade, com coordenadas físicas
`{ t, Y, z }` e a tripla auxiliar `coords`. O campo `t` e os limites `tMin/tMax`
continuam representando τ no contrato numérico existente. A escala é chamada
`tauScale`, com atualizador `setTauScale`, na interface e nos cálculos de distância.
A compactificação de z ocorre na camada visual.

`normalizeWavePoint`, `normalizeWaveSegment` e `normalizeWaveSegments` validam
e normalizam pontos. `createWaveCurve`, `createWaveLeaf` e
`createWaveBifoliation` constroem os objetos de domínio. `slow/fast` identificam
famílias características; `minus/plus` identificam direções e projeções, portanto
essas designações não são intercambiáveis.

As fábricas passadas a `useWorkerTask` devem ter identidade estável, por exemplo
declaradas no escopo do módulo. O cache usa essa identidade e os parâmetros
serializados, sem depender do nome da função ou dos nomes gerados pelo minificador.

## Métodos numéricos

O aplicativo combina solução de equações implícitas, amostragem paramétrica adaptativa, continuação, marching squares, extração de isosuperfícies, interseção de malhas, suavização e recorte de polilinhas. Tolerâncias e resolução ficam centralizadas nas configurações numéricas.

As curvas implícitas no espaço de estados são extraídas por contorno em grade. Quando uma curva possui ponto duplo, como \(\pi_-(\operatorname{Hys}^+)\), o app prefere traçar sua normalização parametrizada; isso preserva os dois ramos que passam pelo nó e evita conexões espúrias entre arestas da grade.

As curvas de rarefação e composta mais custosas são calculadas em Web Workers. A interface recebe segmentos serializáveis e mantém a renderização separada do cálculo.

## Execução local

Os valores iniciais de cada caso de Schaeffer–Shearer ficam em
`src/components/panels/schaefferShearerConfig.js`: parâmetros, escalas,
resolução e limites da janela. `defaultParams` e `defaultView`, usados como
referência pelos módulos matemáticos, testes e benchmark, são derivados do caso IV.
Os controles de redefinição usam o caso ativo. Escalas, resolução e janela
personalizadas são salvas por caso no navegador e têm prioridade ao reabrir;
redefinir reaplica os valores declarados no arquivo.

```text
npm install
npm run dev
```

Para verificar uma alteração:

```text
npm test
npm run lint
npm run build
```

Os testes cobrem equações implícitas, compactificação, projeções, interseções, orientação de curvas e pipelines lento e rápido. Mudanças matemáticas devem incluir um teste numérico ou algébrico correspondente.

## Manutenção da documentação

Os seis arquivos Markdown de `docs/` alimentam simultaneamente a leitura no GitHub e a janela de documentação do app. Alterações conceituais devem ser feitas nesses arquivos; o próximo build incorporará o mesmo conteúdo na aplicação.

## Escopo matemático atual

O núcleo implementado cobre a variedade de ondas do modelo de Schaeffer–Shearer, suas projeções, curvas de Hugoniot e rarefação, curvas de inflexão e coincidência, superfícies sônicas, saturações e cadeias compostas usadas pelo solucionador.

A teoria geral permite refinar a variedade em câmaras determinadas pelos sinais do determinante, traço e discriminante de \(DF(U^\pm)-sI\). O aplicativo já utiliza parte dessa estrutura por meio das superfícies sônicas e das saturações da coincidência, mas ainda não oferece uma classificação espectral completa das câmaras, superfícies de Hopf ou choques complexos e subcompressivos. Essa distinção deve ser preservada em futuras extensões e na redação da interface.

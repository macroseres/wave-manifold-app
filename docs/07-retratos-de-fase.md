# Retratos de fase

Use **Retrato de Fase** no painel esquerdo de cada visualização. Os controles
de 3D e 2D são independentes e não exigem o Modo Inspeção. No 3D, basta manter
a superfície característica ativa para Rarefação, sem clicar em pontos.
**Composta K₋** pode ser exibida sozinha. A superfície S⁻ é controlada
exclusivamente pelo botão **Sônica Esquerda**, independentemente do retrato.
Os detalhes da construção estão em [Retrato composto global](08-retrato-composto-global.md).
No 2D, é necessário
selecionar os dois estados `U_L` e `U_R`. Quando o controle está desligado,
a condição de ativação deixa de existir ou a vista muda, o retrato deixa de
ser calculado e desenhado.

## Arquitetura e convenções preservadas

- `characteristic/planeGeometry.js`: a característica é o plano `Y=0`, com
  `C_s` no lado positivo de `t` e `C_f` no negativo.
- `geometry/stateProjections.js`: projeções canônicas `U⁻`, `U⁺`, centro e
  convenção `Z=1/z`, `U⁺−U⁻=(zY,Y)`.
- `surfaceImplicit/state.js`: `waveSpeed`, estado característico e campo
  `rarefactionDerivativeDtDz`.
- `waves/rarefactionLeaf.js` e `rarefactionSegmentsData.js`: construção existente
  de `R₋/R₊`, integração RK4 adaptativa, segmentação e orientação por velocidade.
- `selection/useCharacteristicSelection.js`: os estados já projetados usados
  no plano 2D. A velocidade de `U_L` vem da rotina canônica `waveSpeed`, com
  os parâmetros atuais.
- `geometry/zCompactification.js`: transformação física para a cena,
  `z_visual=2 atan(z)/π`. A escala da cena permanece a do grupo existente.

## 3D

A rotina existente de rarefação produz curvas distribuídas nas duas metades
da característica (quando ambas estão presentes na janela). As sementes
variam em `t`, em seções de `z` separadas pelas raízes de `A` e `P`, com `Y=0`, sem depender de pontos selecionados nem
deslocar polilinhas prontas. A família lenta é ciano e a rápida é rosa.
As setas do retrato de rarefação seguem o campo regularizado (Fτ,Fz), com Fz=P(z),
independentemente da cor e da ordem da polilinha. São suprimidas junto às singularidades e
agregadas em uma geometria. Na composta, a orientação é a convenção matemática
existente de velocidade decrescente de K₋.
As pontas têm tamanho compensado pelas escalas da cena e posições distribuídas
pelo comprimento visual das curvas, evitando fileiras de setas alongadas.

Cada região regular da equação `dt/dz` recebe sementes próprias, incluindo as
duas extremidades compactificadas. Isso evita que as singularidades do caso III
deixem um lado sem curvas por todas as integrações partirem de `z=0`.
Cada região recebe três seções transversais e doze sementes por metade em
cada seção. Sementes próximas de curvas já desenhadas são descartadas para
preencher lacunas sem concentrar curvas sobrepostas. A quantidade final depende
da geometria. Os dados completos ficam guardados antes do recorte à janela em
`t` e da divisão visual em C_s/C_f; o integrador permanece inalterado.
Singularidades, separatrizes e autodireções são opções diretas do painel.
E, J e sônicas usam as camadas já existentes. O cálculo fica em um worker com
cache; mover a câmera ou alternar elementos visuais não modifica as integrais.

## Elementos da composta em S⁻

O painel da composta tem controles independentes para singularidades,
separatrizes e autodireções. Os marcadores usam esfera e anel; os detalhes da
linearização aparecem no hover somente no modo inspeção, que pode ser ativado
na vista 3D sem selecionar estados. S⁻, coincidência e inflexão continuam com
seus próprios controles de camada.

O campo diagnóstico é o núcleo de `(DF(π₋) − sI) Dπ₋`, restrito a S⁻.
Ele é tangente à mesma família produzida pela saturação forward e interseção
existentes; não substitui essa construção. Derivadas da projeção são calculadas
por diferenciação automática de primeira ordem. As cartas `(τ,z)`, `(Y,z)`,
`(T,Z)` e `(X,Z)`, com `Z=1/z`, `T=−z²τ`, `X=zY`, evitam tratar polos de
parametrização como pontos críticos. O infinito tem uma única identidade,
representada nos dois extremos compactificados.

A eliminação algébrica fornece candidatos nas raízes de `(2z−b₂) P Q R`,
onde `R=(b₁+1)²z²−(b₁+1)b₂z+b₁−1`. Cada candidato é verificado nas duas
linhas do campo, numa carta regular. A classificação usa o Jacobiano local;
“centro linear” indica autovalores imaginários, sem afirmar a existência de
um centro não linear. Apenas selas hiperbólicas geram separatrizes. Autovalores
complexos, repetidos ou nulos não geram autodireções artificiais.

As separatrizes são integrações numéricas com controle de erro e continuação
entre cartas; os orçamentos finitos e a detecção de retorno podem limitar ramos
muito longos. Estável/instável refere-se ao campo regularizado na carta do ponto;
as setas continuam usando a convenção de velocidade da composta. Os casos
degenerados `b₁=0`, `b₁=−1` ou `c=0` são explicitamente sinalizados como sem
diagnóstico, preservando o retrato existente.

A densificação acrescenta até duas folhas geradoras por singularidade, com
checagem de proximidade. Os pontos próximos em S⁻ são projetados em U₋ e
levantados à característica com a mesma velocidade. As folhas passam pela rotina
original de rarefação e, depois, pela mesma saturação/interseção da composta.
O worker mantém esses dados em cache; alternar os três controles não reintegra.

Componentes pequenas próximas de centros lineares/focos podem escapar à malha
global de saturação. Quatro sementes locais acrescentam continuações do mesmo
núcleo tangente a S⁻ nessas regiões. Cada amostra é verificada pelo levantamento
canônico à característica, com U₋ e velocidade correspondentes. A integração
acompanha a primeira volta e só fecha a curva quando o retorno numérico coincide
com a semente; não presume que todo centro linear seja um centro não linear.

## 2D e a seleção de estados

As seleções independentes em `C_s` e `C_f`, rotuladas `U_L` e `U_R` no app,
não satisfazem necessariamente Rankine–Hugoniot entre si. Não existe uma
velocidade de choque comum garantida para esse par.

O retrato usa **os dois estados selecionados `U_L` e `U_R`** e a velocidade
já associada ao ponto característico de `U_L`. Não calcula uma nova velocidade
para ajustar esse par. Se o resíduo de Rankine–Hugoniot indicar que `U_R` não
é equilíbrio para essa velocidade, o painel e o marcador informam isso.
Nesse caso, `U_R` é apenas uma referência: não gera separatrizes e não pode
ser destacado como destino de uma conexão heteroclínica.

O fluxo quadrático foi centralizado em `phasePortrait/flow.js`; o Jacobiano
também é reutilizado pelo diagnóstico de Hopf, sem alteração das equações.
O novo integrador vetorial compara um passo RK4 com dois meios passos,
controla erro e deslocamento e limita tempo, tentativas e número de pontos.
As órbitas são limitadas à janela atual do plano existente e recalculadas
apenas quando seleção, parâmetros, janela ou ativação mudam.

Separatrizes (âmbar) partem de perturbações nas direções próprias de equilíbrios sela:
instáveis para frente e estáveis para trás. As demais órbitas são ciano,
com 24 sementes auxiliares distribuídas em dois anéis ao redor do ponto médio
dos estados (apenas as órbitas dentro da janela são desenhadas).
Direções complexas, repetidas ou nulas não geram separatrizes artificiais.
Uma conexão recebe destaque verde somente se `U_R` for equilíbrio e uma órbita que sai de `U_L`
para frente apresentar aproximação sustentada de `U_R`, distância pequena
e resíduo pequeno do campo. Isso é evidência numérica, não prova de existência.
O orçamento finito pode deixar de encontrar conexões muito lentas ou sensíveis.
Não há ligação desenhada automaticamente entre os dois estados.

O campo vetorial opcional não foi acrescentado para manter a interface e o
desenho leves. As curvas e poucas setas são os elementos principais.

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
As setas do retrato de rarefação mantêm a orientação paramétrica de z crescente,
sem invertê-la na mudança de cor. São suprimidas junto às singularidades e
agregadas em uma geometria. Na composta, a orientação é a convenção matemática
existente de velocidade decrescente de K₋.

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

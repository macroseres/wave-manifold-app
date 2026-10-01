# Manual do Wave Manifold Explorer

Versão do app: **0.1.0-dev**. Edição em desenvolvimento; ainda não publicada.

Documento gerado dos capítulos de docs/; edite os arquivos de origem.

## Conteúdo

- [Guia de leitura e primeiros passos](#capitulo-guia)
- [Introdução e fundamentos](#capitulo-introducao)
- [Interface e fluxo de uso](#capitulo-interface)
- [Construção das curvas](#capitulo-curvas)
- [Construção das superfícies](#capitulo-superficies)
- [Inspeção e construção da solução](#capitulo-solucao)
- [Métodos computacionais e desenvolvimento](#capitulo-metodos)
- [Retratos de fase](#capitulo-retratos)
- [Apêndice: retrato composto global](#capitulo-retrato-global)
- [Experimentos e desempenho](#capitulo-experimentos)

---

<a id="capitulo-guia"></a>

# Guia de leitura e primeiros passos

Este manual reúne o uso do Wave Manifold Explorer, seus fundamentos e métodos
computacionais. A edição em desenvolvimento acompanha o app `0.1.0-dev` e prepara
a documentação da primeira entrega numerada, `0.1.0`. A identificação da edição
aparece no cabeçalho da Ajuda e no manual consolidado.

## Percursos de leitura

- **Primeiro uso:** leia [Interface e fluxo de uso](#capitulo-interface),
  depois [Inspeção e construção da solução](#capitulo-solucao).
- **Estudo matemático:** comece por [Introdução e fundamentos](#capitulo-introducao),
  seguido de [Construção das curvas](#capitulo-curvas) e
  [Construção das superfícies](#capitulo-superficies).
- **Retratos de fase:** consulte [Retratos de fase](#capitulo-retratos);
  as rotinas e convenções globais estão no [apêndice técnico](#capitulo-retrato-global).
- **Desenvolvimento:** leia [Métodos computacionais e desenvolvimento](#capitulo-metodos).

## Primeiro experimento: geometria sem selecionar estados

1. Abra a vista **Variedade** e mantenha a superfície característica visível.
2. Na seção **Retrato de Fase** do painel esquerdo, ative **Campo de Rarefação**.
3. Observe as famílias lenta e rápida e use a navegação da cena para compará-las.
4. Ative **Campo Composto em S⁻** para comparar as compostas K₋ com as rarefações.
5. Se desejar ver a superfície que contém a composta, ative **Sônica Esquerda**
   em seu próprio controle. Ativar a composta não ativa essa camada automaticamente.
6. Passe o ponteiro pelos controles e use **Abrir documentação** para consultar
   a definição da construção.

Esse experimento não exige estados selecionados. Ele permite conhecer a
geometria antes de construir uma solução específica.

## Segundo experimento: estados e inspeção

1. Na característica, selecione um ponto da folha lenta e outro da rápida;
   eles determinam os estados `U_L` e `U_R`.
2. Ative **Inspeção** e compare as coordenadas, estados e velocidades das sondas.
3. Alterne para **Estados** e observe as projeções das mesmas construções.
4. Ative **Solução** para examinar os arcos produzidos e a vista **Perfil**.
5. Para o retrato viscoso no plano de estados, consulte o resíduo de
   Rankine–Hugoniot antes de interpretar `U_R` como equilíbrio ou destino de uma conexão.

Escolher dois estados independentemente não garante que formem um choque com
velocidade comum. Um retrato ou uma curva desenhada é uma aproximação numérica;
uma conexão destacada não constitui uma prova matemática de existência.

## Quando um objeto não aparece

- Confira a vista ativa, as camadas e as condições de ativação do controle.
- Para rarefação global 3D, mantenha a característica visível; no retrato viscoso
  2D, selecione os dois estados.
- Confira a janela de cálculo e a resolução. Ramos podem ficar fora da janela
  e componentes pequenas podem escapar a uma malha finita.
- Aguarde os cálculos dos workers antes de interpretar uma ausência como resultado.
- Valores `−` em cartões indicam dados não definidos ou ainda não calculados.

## Como interpretar as coordenadas

A cena usa `(τ, Y, ẑ)`, com `ẑ = 2 atan(z)/π`. Os cálculos, estados e velocidades
usam o valor físico `z`. O nome interno `t` representa `τ`, enquanto o tempo do
perfil da solução é outra variável. As bordas `ẑ = ±1` representam direções no infinito.

## Alcance desta edição

O manual descreve as construções presentes no projeto. A classificação completa
das câmaras da variedade e a seleção de choques complexos e subcompressivos não
estão disponíveis no pipeline de solução. Os limites específicos dos retratos,
da resolução e da integração aparecem nos capítulos correspondentes.

A revisão desta edição organiza o conteúdo e confere sua ligação com o código;
ela não substitui a revisão científica das deduções. Exemplos com estados
numéricos reproduzíveis e capturas de tela ainda precisam ser acrescentados.

---

<a id="capitulo-introducao"></a>

# 1. Introdução e fundamentos

O Wave Manifold Explorer permite estudar geometricamente choques, rarefações e ondas compostas do modelo quadrático \(2\times2\) de Schaeffer–Shearer. O aplicativo relaciona a variedade de ondas, o espaço de estados, o mapa de parâmetros e o perfil da solução.

## O problema a ser resolvido

Considera-se o sistema de duas leis de conservação

\[
U_t+F(U)_x=0,
\qquad
U=(u,v)^{\mathsf T},
\]

com fluxo quadrático

\[
F(u,v)=
\left(
\frac{b_1+1}{2}u^2+\frac{1}{2}v^2+au,
\;uv+cu-\frac{b_2}{2}v^2+av
\right)^{\mathsf T}.
\]

O aplicativo procura resolver o problema de Riemann associado aos dados iniciais constantes por partes

\[
U(x,0)=
\begin{cases}
U_L, & x<0,\\
U_R, & x>0.
\end{cases}
\]

Busca-se uma solução fraca auto-semelhante

\[
U(x,t)=V(\xi),
\qquad
\xi=\frac{x}{t},
\]

que conecte o estado esquerdo \(U_L\) ao estado direito \(U_R\) por uma sequência admissível de ondas elementares. Essas ondas podem ser choques, rarefações ou ondas compostas das famílias lenta e rápida.

Em termos geométricos, o problema consiste em encontrar, na variedade de ondas \(\mathcal W\), uma cadeia orientada que:

1. parta de \(U_L\);
2. respeite as relações de Rankine–Hugoniot ou as curvas integrais características;
3. satisfaça os critérios de admissibilidade e a ordenação das velocidades;
4. termine em \(U_R\).

O perfil exibido pelo app é a projeção dessa cadeia no eixo auto-semelhante \(\xi=x/t\). A variedade 3D e o espaço de estados são ferramentas para construir e verificar a conexão.

## Estrutura característica do modelo

O Jacobiano do fluxo é

\[
DF(u,v)=
\begin{pmatrix}
(b_1+1)u+a & v\\
v+c & u-b_2v+a
\end{pmatrix}.
\]

Seus autovalores \(\lambda_s\leq\lambda_f\) determinam as famílias lenta e rápida. Nas regiões estritamente hiperbólicas eles são reais e distintos; na curva de coincidência, os dois autovalores coincidem. Essa estrutura é o ponto de partida para as superfícies características, sônicas e para as curvas de rarefação usadas no aplicativo.

## A variedade de ondas

Antes de introduzir as coordenadas do app, é importante separar a definição intrínseca da variedade das parametrizações usadas para calculá-la e desenhá-la.

### Coordenadas de estado médio, salto, direção e velocidade

A variedade de ondas pode ser vista inicialmente no espaço de variáveis

\[
(\bar U,X,Z,s),
\qquad
\bar U=(\bar u,\bar v),
\]

onde \(\bar U\) é o estado médio, \(X\) é a amplitude da primeira componente do salto, \(Z\) é sua inclinação e \(s\) é a velocidade de propagação. Nessa carta,

\[
\Delta U=U^+-U^-=X(1,Z)^{\mathsf T}.
\]

Essas cinco quantidades não são independentes. As condições de Rankine–Hugoniot fornecem duas relações: uma define a direção admissível do salto e a outra determina \(s\). Por isso, \(\mathcal W\) é tridimensional.

Essa descrição nasce diretamente da condição de Rankine–Hugoniot. Para dois estados \(U^-\) e \(U^+\), defina

\[
\bar U=\frac{U^-+U^+}{2},
\qquad
\Delta U=U^+-U^-.
\]

Como o fluxo é quadrático, a diferença de fluxos é exatamente

\[
F(U^+)-F(U^-)=DF(\bar U)\,\Delta U.
\]

Portanto, para uma descontinuidade com velocidade \(s\), a relação de Rankine–Hugoniot

\[
F(U^+)-F(U^-)=s\,(U^+-U^-)
\]

é equivalente ao problema de autovalor

\[
DF(\bar U)\,\Delta U=s\,\Delta U.
\]

Esse é o passo geométrico essencial: em vez de procurar diretamente quatro coordenadas de estado e uma velocidade, descreve-se o estado médio, a direção do salto e sua amplitude. A variedade de ondas reúne precisamente as combinações que satisfazem esse problema de autovalor.

Definindo

\[
G(\bar U,Z)=(-Z,1)DF(\bar U)(1,Z)^{\mathsf T},
\]

\[
S(\bar U,Z)=(1,0)DF(\bar U)(1,Z)^{\mathsf T},
\]

as duas relações são

\[
G(\bar U,Z)=0,
\qquad
s=S(\bar U,Z).
\]

Assim, nos cálculos pode-se trabalhar com \((\bar U,X,Z)\), sujeito a \(G=0\), e recuperar a velocidade depois. É nesse sentido que o app trata \(s\) “por fora”: ela não é um quarto grau de liberdade, mas uma função do ponto da variedade.

Para o fluxo de Schaeffer–Shearer usado no app, é útil manter a formulação vetorial completa. Para

\[
p=(\bar U,X,Z,s)\in\mathbb R^5,
\]

defina

\[
\Phi(p)=
\begin{pmatrix}
-s+(b_1+1)\bar u+a+Z\bar v\\
-sZ+Z\bar u+(1-b_2Z)\bar v+aZ+c
\end{pmatrix}.
\]

A variedade é então

\[
\mathcal W=\Phi^{-1}(0).
\]

Quando \(0\) é valor regular de \(\Phi\), essas duas equações em cinco variáveis definem uma variedade suave de dimensão três. A função \(\Phi\) não depende de \(X\); isso é consequência direta da quadraticidade do fluxo e explica por que a amplitude do salto é uma coordenada livre.

Eliminando \(s\), obtém-se a equação da projeção de \(\mathcal W\) nas variáveis \((\bar U,Z)\):

\[
b_1Z\bar u+(Z^2+b_2Z-1)\bar v-c=0.
\]

A velocidade é recuperada pela primeira componente de \(\Phi=0\):

\[
s=(b_1+1)\bar u+a+Z\bar v.
\]

Estas são as equações preferenciais para deduções analíticas. As expressões em \((\tau,Y,z)\) devem ser entendidas como versões transformadas para implementação e visualização.

### Coordenadas \((T,X,Z)\)

Como \(G\) é afim em \(\bar U\), a equação \(G=0\) descreve, para cada \(Z\), uma reta no plano dos estados médios. Seja

\[
\bar U^c(Z)=(\bar u^c(Z),\bar v^c(Z))
\]

o ponto da curva de coincidência associado a \(Z\). Introduzindo um parâmetro \(T\) ao longo dessa reta, escreve-se

\[
\bar u=\bar u^c(Z)-G_{\bar v}(Z)T,
\qquad
\bar v=\bar v^c(Z)+G_{\bar u}(Z)T.
\]

Com isso, \((T,X,Z)\) parametriza a variedade e

\[
U^\pm
=\bar U(T,Z)\pm\frac{X}{2}(1,Z).
\]

A velocidade continua sendo dependente e pode ser avaliada como \(s=S(\bar U(T,Z),Z)\). Para fluxos quadráticos, ela é afim em \(T\).

### Coordenadas \((\tau,Y,z)\) usadas pelo app

O aplicativo usa outra carta, mais conveniente para as equações implementadas. Na região em que as duas cartas se sobrepõem,

\[
Z=\frac{1}{z},
\qquad
X=zY,
\qquad
T=-z^2\tau.
\]

Consequentemente,

\[
X(1,Z)=zY\left(1,\frac1z\right)=Y(z,1).
\]

Portanto, a mesma diferença de estados passa a ser escrita como

\[
\Delta U=Y(z,1)^{\mathsf T}.
\]

Quando \(Y\ne0\), a condição de pertencer a \(\mathcal W\) pode ser escrita de forma escalar como

\[
(1,-z)\,DF(\bar U)(z,1)^{\mathsf T}=0,
\]

e a velocidade é o autovalor correspondente. A coordenada \(\tau\) parametriza a reta de estados médios compatíveis com a direção \(z\). Assim, \((\tau,Y,z)\) fornece três coordenadas para a variedade.

As fórmulas implícitas e paramétricas do código são, sempre que possível, avaliadas nessas coordenadas físicas \((\tau,Y,z)\). A transformação acima deve ser entendida entre cartas: \(z=0\) corresponde à direção \(Z=\infty\), que é tratada diretamente pela carta do app, sem efetuar numericamente uma divisão por zero.

No código, a coordenada \(\tau\) ainda aparece internamente com o nome `t`. Essa convenção preserva a compatibilidade dos cálculos existentes.

### Coordenada visual compactificada

Somente na etapa de desenho, a direção física \(z\in\mathbb R\) é compactificada por

\[
\widehat z=\frac{2}{\pi}\arctan z.
\]

Logo, a cena 3D exibe \((\tau,Y,\widehat z)\), com \(\widehat z\in(-1,1)\), mas os estados, as velocidades e as equações matemáticas continuam sendo calculados em \((\tau,Y,z)\). A compactificação não define uma nova variedade; ela apenas traz as extremidades \(z=\pm\infty\) para uma janela visual finita.

## Estados e projeções

Um ponto \((\tau,Y,z)\in\mathcal W\) determina dois estados

\[
U^-=(u^-,v^-),\qquad U^+=(u^+,v^+).
\]

Definindo o estado central \(\bar U=(\bar u,\bar v)\), as projeções canônicas são

\[
U^\pm=\bar U\pm\frac{Y}{2}(z,1).
\]

No modelo usado pelo aplicativo,

\[
\bar u=u^E(z)+(1+b_2z-z^2)\tau,
\qquad
\bar v=v^E(z)-b_1z\tau,
\]

com

\[
u^E(z)=\frac{cz(2+b_2z)}{b_1(1+z^2)},
\qquad
v^E(z)=-\frac{cz^2}{1+z^2}.
\]

Assim, \(\pi_-(\tau,Y,z)=U^-\) e \(\pi_+(\tau,Y,z)=U^+\). No plano característico \(Y=0\), os dois estados coincidem.

O caso \(Y=0\) não representa um choque com salto nulo a ser descartado. Ele forma a superfície característica \(\mathcal C\) dentro da própria variedade e funciona como fronteira natural entre curvas de choque e curvas características. Trocar os estados \(U^-\) e \(U^+\) corresponde à reflexão \(Y\mapsto -Y\), mantendo \(\bar U\) e \(z\).

## Famílias características

A superfície característica possui duas folhas, associadas às famílias lenta e rápida. Elas são indicadas por \(C_s\) e \(C_f\). A escolha de um ponto em cada folha fornece os estados iniciais usados na inspeção e na construção da solução.

## Parâmetros do modelo

O modelo utiliza os parâmetros \(a\), \(b_1\), \(b_2\) e \(c\). O parâmetro \(a\) desloca a velocidade das ondas, enquanto \(b_1\), \(b_2\) e \(c\) entram na geometria dos estados. O mapa \((b_1,b_2)\) organiza os casos de Schaeffer–Shearer e mostra as curvas de transição \(C_1\), \(C_2\) e \(C_3\).

## Princípio de interpretação

As definições matemáticas determinam os objetos; os métodos numéricos os aproximam; a renderização apenas apresenta os resultados. Por isso, resolução, janela de cálculo e tolerâncias podem alterar a aparência e a precisão numérica, mas não a definição matemática.

## Referência conceitual

A organização geométrica acima segue as ideias de Bradley J. Plohr em *Wave Manifold for Quadratic Models* (rascunho de 22 de junho de 2023), especialmente a redução da condição de Rankine–Hugoniot a um problema de autovalor no estado médio, a inclusão da superfície característica na variedade e a interpretação das superfícies sônicas por invariantes espectrais. A notação foi adaptada às coordenadas \((\tau,Y,z)\) usadas pelo aplicativo.

## Sobre o projeto

O Wave Manifold Explorer é um aplicativo de visualização científica dedicado ao modelo quadrático \(2\times2\). Ele reúne, numa mesma interface, curvas de Hugoniot, rarefações, superfícies sônicas, ondas compostas, reflexão e construção de soluções sobre a variedade.

Informações de autoria e citação estão em `CITATION.cff`; os termos de uso estão em `LICENSE`; e o histórico de versões está em `CHANGELOG.md`, todos na raiz do repositório.

---

<a id="capitulo-interface"></a>

# 2. Interface e fluxo de uso

## Visualizações principais

- **Variedade:** representação de \(\mathcal W\) nas coordenadas visuais \((\tau,Y,\widehat z)\). O cálculo usa a coordenada física \(z\), antes da compactificação.
- **Estados:** projeções \(\pi_-\) e \(\pi_+\) das construções no plano \((u,v)\).
- **Perfil:** perfil da solução em \((x,t=t_0)\) e seus diagnósticos.
- **Parâmetros:** mapa dos casos no plano \((b_1,b_2)\).

## Fluxo básico

1. Escolha um caso de Schaeffer–Shearer ou ajuste os parâmetros.
2. Ative no painel esquerdo as superfícies e curvas de interesse.
3. Clique na superfície característica: um ponto em \(C_s\) determina \(U_L\), enquanto um ponto em \(C_f\) determina \(U_R\).
4. Ative **Inspeção** para examinar curvas ligadas a um estado, tanto na variedade quanto no espaço de estados.
5. Com os dois estados selecionados, ative **Solução** para construir os arcos admissíveis.
6. Compare a variedade 3D, o espaço de estados e o perfil resultante.

## Navegação e ajustes

Na vista 3D, arraste para orbitar e use a roda do mouse ou os botões `+` e `−` para zoom. A rotação automática pode ser ativada pelo botão **Rotação** nos controles da vista 3D. O botão **Exportar** salva a visualização 3D como imagem PNG.

Em **Ajustes**, podem ser alteradas as escalas dos eixos, a resolução numérica, a opacidade e a janela de cálculo em \(Y\), \(\tau\) e \(z\). Uma resolução maior tende a produzir superfícies mais detalhadas, com maior custo de processamento. Na cena, o terceiro eixo mostra \(\widehat z=2\arctan(z)/\pi\), embora os controles e diagnósticos continuem reportando o valor físico \(z\).

## Camadas da cena

O painel esquerdo agrupa as camadas em referências geométricas, superfícies
sônicas e de Hopf, curvas especiais, saturações de histerese, saturações e
extensões da coincidência, curvas de autointerseção e ondas das famílias lenta
e rápida. A seção **Retrato de Fase** reúne os controles dos campos globais.
**Ocultar tudo** e **Mostrar tudo** ajudam a isolar construções;
**Limpar seleções** remove os estados escolhidos.

Ao manter o ponteiro sobre uma camada, aparece um cartão curto com sua definição e seu papel geométrico. O botão **Abrir documentação** leva diretamente ao capítulo relacionado. Esses cartões servem como consulta rápida; as deduções, equações e limitações ficam registradas nos sete capítulos e no apêndice técnico.

Na variedade 3D, passar o ponteiro sobre uma sonda, interseção ou ponto notável mostra outro cartão com \((\tau,Y,z)\), os estados \(U^-\) e \(U^+\) e a velocidade \(s\). Valores indicados por `−` não estão definidos para aquele objeto ou ainda não foram calculados.

## Inspeção no espaço de estados

Com **Inspeção** ativa, clique próximo da projeção de \(C_s\) ou \(C_f\) no plano \((u,v)\) para criar a sonda da família correspondente. Arraste o marcador da sonda para percorrer a característica. A mesma sonda e suas curvas associadas permanecem sincronizadas entre as vistas **Variedade** e **Estados**.

Ao desativar **Inspeção**, as curvas, os marcadores e os rótulos das sondas são ocultados, mas suas posições ficam preservadas. O enquadramento e os estados \(U_L\) e \(U_R\) não são alterados.

---

<a id="capitulo-curvas"></a>

# 3. Construção das curvas

As curvas são calculadas como sequências orientadas de pontos nas coordenadas físicas \((\tau,Y,z)\). Somente ao enviá-las para a cena o app substitui \(z\) por \(\widehat z\). A orientação é parte da construção: ela determina em que sentido a velocidade deve variar e quais trechos podem participar de uma solução admissível.

## Curvas de Hugoniot

Para um estado fixo, a condição de Rankine–Hugoniot define uma curva dentro da variedade. Em \(H_-(U_L)\), mantém-se \(\pi_-=U_L\); em \(H_+(U_R)\), mantém-se \(\pi_+=U_R\). O app constrói a primeira no sentido `forward` e a segunda no sentido `backward`. As rotinas recuperam o outro estado e calculam a velocidade da onda ao longo da curva.

Nas coordenadas \((\bar U,X,Z,s)\), a definição deve ser lida primeiro como

\[
\mathcal H^{\mathrm{forw}}(U^-)
=\left\{(\bar U,X,Z,s)\in\mathcal W:
\bar U-\frac{X}{2}(1,Z)=U^-\right\},
\]

\[
\mathcal H^{\mathrm{back}}(U^+)
=\left\{(\bar U,X,Z,s)\in\mathcal W:
\bar U+\frac{X}{2}(1,Z)=U^+\right\}.
\]

As versões em \((\tau,Y,z)\) usadas pelos controles são imagens dessas curvas pela mudança de coordenadas, e não definições matemáticas distintas.

Na notação exibida nos controles,

\[
\mathcal H^{\mathrm{forw}}(U_L)
=\{P\in\mathcal W:\pi_-(P)=U_L\},
\]

\[
\mathcal H^{\mathrm{back}}(U_R)
=\{P\in\mathcal W:\pi_+(P)=U_R\}.
\]

Ao longo da primeira curva, \(U_+=\pi_+(P)\) e \(s(P)\) variam satisfazendo

\[
F(U_+)-F(U_L)=s(P)(U_+-U_L).
\]

Na segunda, variam \(U_-=\pi_-(P)\) e \(s(P)\), com

\[
F(U_R)-F(U_-)=s(P)(U_R-U_-).
\]

Geometricamente, essas curvas são folhas da folheação de Hugoniot. A reflexão \(Y\mapsto-Y\) troca \(U^-\) por \(U^+\) e relaciona as descrições para frente e para trás.

A velocidade \(s\) associada a \((\tau,Y,z)\) é

\[
s=a+\frac{cz\,[b_1+2+b_2(b_1+1)z]}{b_1(1+z^2)}+Q(z)\tau,
\]

onde

\[
Q(z)=1+b_2(b_1+1)z-(b_1+1)z^2.
\]

## Curvas de rarefação

As rarefações vivem na superfície característica \(\mathcal C\), onde \(Y=0\), e são curvas integrais dos autovetores de \(DF\). A família lenta \(\mathcal R^-(U_L)\) e a família rápida \(\mathcal R^+(U_R)\) são amostradas a partir do estado escolhido, respeitando a orientação do autovalor característico.

Usando a notação dos tooltips, se \(r_s\) e \(r_f\) são os autovetores das famílias lenta e rápida, então

\[
\frac{dU}{d\xi}=r_s(U),\qquad U(0)=U_L,
\]

define \(\mathcal R_s(U_L)\), enquanto

\[
\frac{dU}{d\xi}=r_f(U),\qquad U(0)=U_R,
\]

define \(\mathcal R_f(U_R)\). Na variedade, \(\pi_-(P)=\pi_+(P)=U\) e a velocidade é, respectivamente, \(s(P)=\lambda_s(U)\) ou \(s(P)=\lambda_f(U)\).

Uma rarefação pode ser parametrizada pela velocidade característica enquanto essa velocidade varia estritamente ao longo da curva. Os pontos em que sua derivada direcional se anula formam a curva de inflexão \(\mathcal J\); nela, a parametrização pela velocidade deixa de ser regular e pode começar uma construção composta.

## Curvas compostas

Uma curva composta liga um arco de rarefação a uma família de Hugoniot. O app constrói \(\mathcal K_-\) e \(\mathcal K_+\) por continuação e por interseção com geometrias saturadas. Os trechos são ordenados, unidos e recortados nos pontos matematicamente relevantes.

A composta lenta é a extensão esquerda da rarefação lenta:

\[
\mathcal K_s(U_L)
=\mathcal S^-\cap
\operatorname{sat}_{\mathrm{forw}}(\mathcal R_s(U_L)).
\]

A composta rápida é a extensão direita da rarefação rápida:

\[
\mathcal K_f(U_R)
=\mathcal S^+\cap
\operatorname{sat}_{\mathrm{back}}(\mathcal R_f(U_R)).
\]

Essas identidades explicam o procedimento visual: primeiro satura-se a rarefação pelas folhas de Hugoniot correspondentes; depois toma-se a interseção com a superfície sônica adequada.

## Curvas especiais

- \(\mathcal E\): curva de coincidência.
- \(\mathcal J\): curvas de inflexão lenta e rápida.
- \(\mathcal{DS}\): conjunto de dupla condição sônica.
- \(\operatorname{Hys}^-\) e \(\operatorname{Hys}^+\): curvas de histerese.
- \(\mathcal B^-\) e \(\mathcal B^+\): bifurcações secundárias esquerda e direita.
- \(\operatorname{ext}_\pm(\mathcal E)\): interseções das saturações da coincidência com as superfícies sônicas.

A curva de coincidência \(\mathcal E\) é onde os dois autovalores de \(DF\) coincidem. Ela também pode ser entendida como a envoltória das retas de estado médio com direção característica fixa. Por isso, a projeção da superfície característica no espaço de estados perde regularidade sobre \(\mathcal E\).

Nas coordenadas usadas pelo app,

\[
\mathcal E=\{P\in\mathcal W:Y=0,\ \tau=0\}.
\]

A curva de inflexão reúne os pontos onde a velocidade é crítica ao longo da rarefação:

\[
ds|_{\mathcal R_s}(P)=0
\quad\text{ou}\quad
ds|_{\mathcal R_f}(P)=0.
\]

Ela pertence às duas superfícies sônicas. A interseção destas se decompõe como

\[
\mathcal S^-\cap\mathcal S^+=\mathcal J\cup\mathcal{DS},
\]

de modo que

\[
\mathcal{DS}=(\mathcal S^-\cap\mathcal S^+)\setminus\mathcal J.
\]

Em \(\mathcal{DS}\), a velocidade do choque é característica tanto para \(U^-\) quanto para \(U^+\).

## Histereses e extensões

A histerese esquerda é a extensão da curva de inflexão pela sônica esquerda:

\[
\operatorname{Hys}^-
=\operatorname{ext}_-(\mathcal J)
=\mathcal S^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal J).
\]

Analogamente, a histerese direita é

\[
\operatorname{Hys}^+
=\operatorname{ext}_+(\mathcal J)
=\mathcal S^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal J).
\]

As extensões da coincidência, identificadas na interface por \(\mathcal{BT}^-\) e \(\mathcal{BT}^+\), são

\[
\mathcal{BT}^-
=\operatorname{ext}_-(\mathcal E)
=\mathcal S^-\cap\operatorname{sat}_{\mathrm{forw}}(\mathcal E),
\]

\[
\mathcal{BT}^+
=\operatorname{ext}_+(\mathcal E)
=\mathcal S^+\cap\operatorname{sat}_{\mathrm{back}}(\mathcal E).
\]

Cada uma separa as partes lenta e rápida da superfície sônica correspondente.

## Bifurcações secundárias

O cálculo da bifurcação é feito mais naturalmente antes da mudança para \((\tau,Y,z)\). Defina

\[
P(Z)=Z^2+b_2Z+b_1-1.
\]

Para a curva de Hugoniot forward, o lugar de bifurcação secundária direita é caracterizado por

\[
ZP(Z)=0,
\]

\[
-b_1\bar u-(2Z+b_2)\bar v
+\frac12(Z^2+b_2Z-1)X=0.
\]

Essas condições indicam onde o sistema tangente de \(\mathcal H^{\mathrm{forw}}(U^-)\) perde posto e deixa de determinar uma única direção regular. A fórmula seguinte é a versão transformada e refletida usada para desenhar o ramo esquerdo no app.

A reflexão \((\tau,Y,z)\mapsto(\tau,-Y,z)\) da bifurcação direita fornece

\[
\mathcal B^-:\quad P(z)=0,\qquad
2b_1z(1+z^2)\tau+A(z)Y=0,
\]

com \(P(z)=1+b_2z+(b_1-1)z^2\) e \(A(z)=1+b_2z-z^2\).
Cada raiz real gera uma reta a \(z\) constante, recortada na janela de
\(\tau,Y\). A visualização compactificada inclui raízes além da janela física
de \(z\). Se \(b_2^2-4(b_1-1)<0\), não há essas retas reais.

## Histerese direita e sua projeção

A curva \(\operatorname{Hys}^+\) é a interseção das duas condições implícitas \(S_R=0\) e \(H_R=0\). Na carta \((\bar U,X,Z,s)\), depois de impor a condição sônica, a condição adicional de histerese pode ser escrita como

\[
Q(Z)(2\bar v+ZX)
-\frac12[2Z+b_2(b_1+1)](Z^2+b_1+1)X=0,
\]

com

\[
Q(Z)=Z^2+b_2(b_1+1)Z-b_1-1.
\]

Geometricamente, \(\mathcal S^+\) reúne os pontos críticos de primeira ordem de \(s\) ao longo da Hugoniot forward, enquanto \(\operatorname{Hys}^+\) reúne os pontos críticos de segunda ordem. Assim,

\[
\operatorname{Hys}^+\subset\mathcal S^+\subset\mathcal W.
\]

Somente depois dessas condições serem obtidas faz-se a mudança para \((\tau,Y,z)\). Quando \(b_2=0\), a projeção por \(\pi_-\) admite a parametrização

\[
u(z)=\frac{c(b_1+1)z[3+(1-b_1)z^2]}{b_1[1+3(b_1+1)z^2]},
\]

\[
v(z)=c\frac{1-3(b_1+1)z^2}{1+3(b_1+1)z^2}.
\]

Eliminando \(z\), obtém-se a cúbica implícita

\[
-27b_1^2(b_1+1)u^2(c+v)+(4b_1+5)^2c^3
\]

\[
+3(4b_1+5)(2b_1+1)c^2v-3(5b_1+4)(b_1+2)cv^2-(5b_1+4)^2v^3=0.
\]

Essa forma vale para \(b_1\ne1\); o caso \(b_1=1\) é degenerado. Para \(b_1=8\) e \(c=1\),

\[
u(z)=\frac{9z(3-7z^2)}{8(1+27z^2)},
\qquad
v(z)=\frac{1-27z^2}{1+27z^2}.
\]

## Interseções e recortes

Os pontos de interseção entre Hugoniot, rarefação, inflexão, coincidência e superfícies sônicas funcionam como âncoras ou pontos de parada. A construção final mantém somente os segmentos compatíveis com a orientação e com a janela numérica ativa.

---

<a id="capitulo-superficies"></a>

# 4. Construção das superfícies

## Saturações da histerese esquerda

Para cada ponto \(h(s)\) da curva \(\operatorname{Hys}^-\), o app constrói
as folhas de Hugoniot que conservam, respectivamente, o estado esquerdo e o direito:

\[
\operatorname{sat}_-(\operatorname{Hys}^-)
=\bigcup_s H_-(\pi_-(h(s))),\qquad
\operatorname{sat}_+(\operatorname{Hys}^-)
=\bigcup_s H_+(\pi_+(h(s))).
\]

São duas saturações independentes da mesma curva. Os controles aparecem nessa
ordem em **Saturações de histerese**.
A construção utiliza diretamente `solveLeftHysteresisPoint`, preservando a
definição legada de histerese esquerda do projeto. As malhas são geradas em
worker, com recorte em \(\tau,Y\), compactificação de \(z\) e separação nos polos.

## Superfície característica

A superfície característica \(\mathcal C\) é o conjunto \(Y=0\) dentro da variedade. Nela, os estados esquerdo e direito coincidem e a velocidade \(s\) é um autovalor de \(DF(U)\). Suas folhas lenta e rápida servem de origem para a seleção dos estados iniciais.

De forma equivalente,

\[
\mathcal C
=\{P\in\mathcal W:\pi_-(P)=\pi_+(P)=U\}
=\{P\in\mathcal W:Y=0\}.
\]

A decomposição mostrada na interface é

\[
\mathcal C=\mathcal C_s\cup\mathcal E\cup\mathcal C_f.
\]

Em \(\mathcal C_s\), \(s(P)=\lambda_s(U)\); em \(\mathcal C_f\), \(s(P)=\lambda_f(U)\). A curva \(\mathcal E\) separa as duas folhas e satisfaz \(\lambda_s(U)=\lambda_f(U)\).

Nas coordenadas preferenciais \((\bar U,X,Z,s)\), a superfície característica é simplesmente a seção

\[
\mathcal C
=\{(\bar U,0,Z,s)\in\mathcal W\}.
\]

O lugar de coincidência é obtido impondo que \(s\) seja um autovalor múltiplo de \(DF(\bar U)\). Além de \(\Phi=0\) e \(X=0\), vale

\[
b_1\bar u+(2Z+b_2)\bar v=0.
\]

Portanto, a característica e a coincidência são definidas primeiro nessa carta. As identidades \(Y=0\) e \((\tau,Y)=(0,0)\) são suas expressões depois da mudança de coordenadas usada pelo app.

## Superfícies sônicas

As superfícies sônicas são definidas pela igualdade entre a velocidade da onda e uma velocidade característica de um dos estados. Escrevendo

\[
M_-=DF(U^-)-sI,
\qquad
M_+=DF(U^+)-sI,
\]

tem-se

\[
\mathcal S^-:\det M_-=0,
\qquad
\mathcal S^+:\det M_+=0.
\]

O app distingue a sônica esquerda \(\mathcal S^-\) e a direita \(\mathcal S^+\), separando em cada uma os ramos lento e rápido por meio de um indicador de ramo. Em termos geométricos, a velocidade fica estacionária ao longo da folha de Hugoniot quando ela cruza a superfície sônica correspondente.

Mais precisamente,

\[
\mathcal S^-
=\left\{P\in\mathcal W:
ds|_{\mathcal H^{\mathrm{back}}(U_+)}(P)=0\right\},
\]

\[
\mathcal S^+
=\left\{P\in\mathcal W:
ds|_{\mathcal H^{\mathrm{forw}}(U_-)}(P)=0\right\}.
\]

Pela condição de Bethe–Wendroff, isso equivale a \(s(P)\) ser uma velocidade característica do estado esquerdo em \(\mathcal S^-\), ou do estado direito em \(\mathcal S^+\). As decomposições utilizadas nos controles são

\[
\mathcal S^-=\mathcal S^-_s\cup\mathcal{BT}^-\cup\mathcal S^-_f,
\qquad
\mathcal S^+=\mathcal S^+_s\cup\mathcal{BT}^+\cup\mathcal S^+_f.
\]

### Cálculo preferencial em \((\bar U,X,Z,s)\)

Considere a curva de Hugoniot forward que mantém \(U^-\) fixo. Um vetor tangente satisfaz simultaneamente

\[
D\Phi(p)[\dot p]=0,
\qquad
dU^-=0.
\]

Ao impor também \(\dot s=0\), obtém-se um sistema homogêneo para \((\dot X,\dot Z)\), com matriz

\[
B_+(p)=
\begin{pmatrix}
\frac12(Z^2+b_1+1) & \bar v+\frac12ZX\\
\frac12(2Z-b_2Z^2) & -s+\bar u-b_2\bar v+a+\frac12(1-b_2Z)X
\end{pmatrix}.
\]

A sônica direita é, portanto,

\[
\mathcal S^+
=\{p\in\mathcal W:\det B_+(p)=0\}.
\]

Eliminando \(s\) por meio de \(\Phi=0\), essa condição torna-se

\[
b_1(Z^2+b_1+1)\bar u
+[Z^3+(b_1+3)Z+b_2(b_1+1)]\bar v
+\frac12Q(Z)X=0,
\]

onde

\[
Q(Z)=Z^2+b_2(b_1+1)Z-b_1-1.
\]

Essa formulação preserva diretamente o significado geométrico: \(\mathcal S^+\) é o lugar onde \(s\), restrita à curva de Hugoniot com \(U^-\) fixo, possui um ponto crítico de primeira ordem. A sônica esquerda é obtida pelo cálculo análogo mantendo \(U^+\) fixo.

### Forma usada pelo app

Com

\[
P(z)=1+b_2z+(b_1-1)z^2,
\qquad
Q(z)=1+b_2(b_1+1)z-(b_1+1)z^2,
\]

a sônica direita é o nível zero de

\[
-2b_1(1+z^2)[(b_1+1)z^3-b_2+3z]\tau
 +(1+z^2)Q(z)Y+2cP(z).
\]

A sônica esquerda é obtida pela simetria \(Y\mapsto-Y\).

## Invariantes que organizam a geometria

Três invariantes das matrizes \(M_\pm\) explicam as principais fronteiras da variedade:

- \(\det M_\pm=0\): superfícies características e sônicas, onde \(s\) coincide com uma velocidade característica.
- \(\operatorname{disc}M_\pm=0\): saturações da coincidência, onde as duas velocidades características do estado coincidem.
- \(\operatorname{tr}M_\pm=0\), na região elíptica: superfícies de Hopf, onde muda o sentido espiral da linearização viscosa.

As superfícies de Hopf exibidas pelo app são definidas por

\[
\mathcal{Hopf}^\pm
=\{P\in\mathcal W:
\operatorname{tr}M_\pm(P)=0,\ \det M_\pm(P)\geq0\}.
\]

Nessas condições, os autovalores de \(M_\pm\) são imaginários puros ou nulos. As superfícies ajudam a visualizar a subdivisão espectral da variedade, mas não são atualmente usadas para selecionar os arcos do pipeline de solução.

## Superfícies saturadas

Saturar uma curva significa reunir folhas de Hugoniot que partem dos seus pontos. O aplicativo inclui:

- a saturação de \(\operatorname{Hys}^+\) por \(H_-\);
- \(\operatorname{sat}_-(\mathcal E)\) e \(\operatorname{sat}_+(\mathcal E)\);
- a saturação das rarefações lenta e rápida, usada na construção das compostas.

Para uma curva \(\Gamma\subset\mathcal W\), as duas orientações podem ser escritas como

\[
\operatorname{sat}_{\mathrm{forw}}(\Gamma)
=\bigcup_{P\in\Gamma}
\mathcal H^{\mathrm{forw}}(\pi_-(P)),
\]

\[
\operatorname{sat}_{\mathrm{back}}(\Gamma)
=\bigcup_{P\in\Gamma}
\mathcal H^{\mathrm{back}}(\pi_+(P)).
\]

Assim, `forward` conserva o estado esquerdo de cada gerador e `backward` conserva o estado direito. Essa convenção vale para as saturações da coincidência, das histereses e das rarefações.

As extensões \(\operatorname{ext}_-(\mathcal E)\) e \(\operatorname{ext}_+(\mathcal E)\) surgem da interseção das saturações da coincidência com as superfícies sônicas correspondentes.

Na linguagem espectral, saturar \(\mathcal E\) propaga pela folheação de Hugoniot os pontos onde o discriminante de \(DF\) se anula. Isso explica por que essas superfícies são fronteiras naturais entre regiões com diferentes tipos de velocidades características.

## Autointerseções das saturações

Uma curva marcada com asterisco, como

\[
\operatorname{sat}_{\mathrm{forw}}^*(\operatorname{Hys}^+),
\]

é o lugar onde duas folhas distintas da mesma superfície saturada se encontram. Um ponto \(Q\) pertence a essa autointerseção quando existem \(P_1\ne P_2\) em \(\operatorname{Hys}^+\) tais que

\[
Q\in
\mathcal H^{\mathrm{forw}}(\pi_-(P_1))
\cap
\mathcal H^{\mathrm{forw}}(\pi_-(P_2)),
\]

com \(\pi_-(P_1)\ne\pi_-(P_2)\). A definição backward para \(\operatorname{Hys}^-\) é análoga, trocando \(\pi_-\) por \(\pi_+\) e as folhas forward pelas backward.

## Construção numérica da malha

As superfícies implícitas são avaliadas numa grade das coordenadas físicas \((\tau,Y,z)\), limitada pela janela de cálculo. A extração da isosuperfície gera triângulos, que depois são classificados, recortados e enviados à cena 3D. A resolução controla a densidade da grade.

## Compactificação de \(z\)

Algumas construções usam uma representação compactificada da coordenada \(z\) para tratar ramos que se prolongam além de uma janela finita. A compactificação vem depois da mudança \((T,X,Z)\mapsto(\tau,Y,z)\): ela não participa da definição de \(U^\pm\), de \(s\) nem das equações implícitas.

A coordenada visual usada pelo app é

\[
\widehat z=\frac{2}{\pi}\arctan z,
\]

de modo que \(z\in\mathbb R\) é representado por \(\widehat z\in(-1,1)\). A transformação inversa é

\[
z=\tan\left(\frac{\pi}{2}\widehat z\right).
\]

Portanto, o pipeline de uma superfície é:

1. avaliar sua equação em \((\tau,Y,z)\);
2. extrair e recortar a malha ainda em coordenadas físicas;
3. converter apenas a posição do terceiro eixo para \(\widehat z\);
4. inverter a compactificação quando uma interação visual precisar recuperar estados ou velocidades.

As duas bordas \(\widehat z=\pm1\) representam as direções assintóticas \(z=\pm\infty\). Elas não são valores físicos finitos de \(z\).

---

<a id="capitulo-solucao"></a>

# 5. Inspeção e construção da solução

## Modo de inspeção

Na vista **Variedade**, o modo de inspeção pode ser ativado sem estados selecionados,
inclusive para consultar marcadores dos retratos. Na vista **Estados**, ele exige
ao menos um estado inicial selecionado. Uma sonda lenta e uma sonda rápida podem
ser criadas e movidas tanto na variedade quanto no espaço de estados. Ao arrastar
uma sonda com `Ctrl` na vista 3D, ela procura o ponto mais próximo entre as curvas disponíveis.

Para cada sonda, o app pode mostrar as duas orientações de Hugoniot e a rarefação associada. Marcadores de interseção e informações do ponto ajudam a comparar estados, coordenadas e velocidades.

O painel de inspeção apresenta \((\tau,Y,z)\), a velocidade \(s\) e os dois estados \((u^-,v^-)\) e \((u^+,v^+)\). Os mesmos dados são preservados quando o usuário alterna entre **Variedade** e **Estados**.

## Modo solução

O modo solução exige a seleção de um estado na família lenta e outro na rápida. A cadeia computacional produz três grupos:

- parte lenta;
- parte rápida;
- reflexo rápido, quando aplicável.

Cada grupo pode combinar arcos de Hugoniot, rarefação e composta. Os arcos são classificados como locais ou não locais conforme a origem da rarefação usada na construção.

## Admissibilidade e orientação

Os segmentos são orientados a partir de suas âncoras e filtrados segundo a variação da velocidade. Interseções sônicas, pontos de inflexão e encontros entre curvas delimitam os trechos que podem permanecer na solução.

As convenções implementadas são: a rarefação lenta percorre o sentido de velocidade crescente; a rarefação rápida percorre o sentido de velocidade decrescente; os choques e as compostas são recortados de acordo com a orientação admissível da cadeia correspondente.

Para interpretar um choque, sejam \(\lambda_s(U)<\lambda_f(U)\) as velocidades características. O critério clássico de Lax exige uma das configurações:

\[
\text{choque lento:}\quad
\lambda_s(U^-)>s,
\qquad
\lambda_s(U^+)<s<\lambda_f(U^+),
\]

\[
\text{choque rápido:}\quad
\lambda_s(U^-)<s<\lambda_f(U^-),
\qquad
\lambda_f(U^+)<s.
\]

Equivalentemente, os sinais dos autovalores de \(M_-=DF(U^-)-sI\) e \(M_+=DF(U^+)-sI\) determinam o tipo de choque. Essa leitura conecta os recortes pelas superfícies sônicas às desigualdades de Lax.

O texto de referência também discute choques subcompressivos e choques em regiões de autovalores complexos. Essas classes fornecem contexto para uma subdivisão mais completa da variedade, mas não são atualmente classificadas nem apresentadas como soluções pelo app.

## Perfil e diagnósticos

Os arcos ativos são projetados no perfil da solução em \((x,t=t_0)\). O painel de diagnósticos apresenta os pontos notáveis, os estados associados e as velocidades calculadas. Esses dados devem ser interpretados junto com as curvas exibidas na variedade e no espaço de estados.

Ao inspecionar um ponto de choque, uma verificação útil é comparar \(s\) com \(\lambda_s\) e \(\lambda_f\) nos dois estados projetados. Ao inspecionar uma sônica, uma dessas diferenças deve se aproximar de zero. Na superfície característica, \(U^-=U^+\) e \(s\) coincide com o autovalor da folha selecionada.

---

<a id="capitulo-metodos"></a>

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

### Cadeia de coordenadas

A implementação segue a seguinte separação conceitual:

1. \((\bar U,X,Z,s)\): descrição de Rankine–Hugoniot no espaço ampliado; \(s\) é determinado pelas demais variáveis.
2. \((\bar U,X,Z)\), com \(G(\bar U,Z)=0\): descrição reduzida da variedade.
3. \((T,X,Z)\): parametrização das retas de estados médios que resolvem \(G=0\).
4. \((\tau,Y,z)\): coordenadas físicas usadas pelas entidades e pelas equações do app.
5. \((\tau,Y,\widehat z)\): coordenadas usadas exclusivamente para posicionar a geometria na cena.

Na sobreposição das cartas 3 e 4,

\[
Z=1/z,\qquad X=zY,\qquad T=-z^2\tau.
\]

Os objetos de domínio armazenam \((\tau,Y,z)\), não \(\widehat z\). Consequentemente, projeções de estado, velocidade, resíduos implícitos e testes devem receber o valor físico \(z\). A compactificação pertence à camada geométrica e deve ser aplicada exatamente uma vez.

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

Execute `npm run check` para executar análise de código, testes e build em
sequência, interrompendo na primeira falha. Os comandos também podem ser
executados individualmente:

```text
npm test
npm run lint
npm run build
```

Os testes cobrem equações implícitas, compactificação, projeções, interseções, orientação de curvas e pipelines lento e rápido. Mudanças matemáticas devem incluir um teste numérico ou algébrico correspondente.

## Manutenção da documentação

O guia de leitura, os sete capítulos e o apêndice técnico de `docs/` alimentam
simultaneamente a leitura no GitHub e a janela de documentação do app.
`docs/manual.json` define o catálogo comum da Ajuda e do manual consolidado.
O apêndice `08-retrato-composto-global.md` também pode ser aberto pelo link no
capítulo 7. Alterações conceituais devem ser feitas nesses arquivos; o próximo
build incorporará o mesmo conteúdo na aplicação.

Execute `npm run docs:manual` para gerar uma edição Markdown completa em
`artifacts/manual/`, identificada pela versão de `package.json`. Não edite essa
saída; regenere-a após revisar os capítulos. Para lançar uma versão, preserve
código e documentação na mesma tag, conforme `VERSIONING.md` na raiz do projeto.

## Escopo matemático atual

O núcleo implementado cobre a variedade de ondas do modelo de Schaeffer–Shearer, suas projeções, curvas de Hugoniot e rarefação, curvas de inflexão e coincidência, superfícies sônicas, saturações e cadeias compostas usadas pelo solucionador.

A teoria geral permite refinar a variedade em câmaras determinadas pelos sinais do determinante, traço e discriminante de \(DF(U^\pm)-sI\). O aplicativo visualiza superfícies sônicas, saturações da coincidência e superfícies de Hopf, mas ainda não oferece uma classificação automática completa das câmaras nem seleciona choques complexos e subcompressivos no pipeline de solução. Essa distinção deve ser preservada em futuras extensões e na redação da interface.

---

<a id="capitulo-retratos"></a>

# 7. Retratos de fase

Use **Retrato de Fase** no painel esquerdo de cada visualização. Os controles
de 3D e 2D são independentes e não exigem o Modo Inspeção. No 3D, basta manter
a superfície característica ativa para Rarefação, sem clicar em pontos.
**Composta K₋** pode ser exibida sozinha. A superfície S⁻ é controlada
exclusivamente pelo botão **Sônica Esquerda**, independentemente do retrato.
Os detalhes da construção estão em [Retrato composto global](#capitulo-retrato-global).
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

Na extração do retrato, a igualdade entre a velocidade da composta e a da
rarefação geradora seleciona a folha sônica antes de montar as curvas.
O fator correspondente ao salto nulo é removido dessa equação. Assim, o
cruzamento com a outra folha não fragmenta um laço em trechos desconectados;
a pertença à família geradora continua sendo verificada nos pontos extraídos.

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

---

<a id="capitulo-retrato-global"></a>

# Apêndice. Retratos globais de rarefação e composta

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

## Registro histórico de validação da implementação

Os números abaixo pertencem à entrega original do retrato, anterior ao controle
explícito de versões. Não representam a contagem atual de testes nem uma
validação nova do manual. As verificações desta revisão estão em `REVISAO.md`.

- Referência antes das mudanças: 110 testes existentes passaram.
- Suíte final após a seleção da família geradora: 119 testes passaram.
- ESLint passou em todos os arquivos JavaScript/JSX alterados nesta implementação.
- Build Vite concluído; apenas aviso de tamanho do bundle principal/Three.
- Navegador: composta sem estados selecionados, sobreposição com rarefação,
  separatrizes e autodireções, e sincronização do controle de J com a camada existente.
- A alternância dos elementos visuais não exibe novo cálculo nem altera os dados
  do worker; esses controles não entram na chave do cache.

---

<a id="capitulo-experimentos"></a>

# Experimentos e desempenho

## Salvar e retomar

Abra **Experimentos** na barra superior, escolha um nome e pressione **Salvar JSON**.
O arquivo contém a versão do app e do formato, parâmetros, janela física, resolução,
escalas, camadas, estados selecionados, sondas, opções dos retratos e câmera 3D.
Use **Abrir JSON** para restaurar. Arquivos inválidos são recusados antes de alterar
o experimento atual; arquivos de outra versão do app exibem sua versão de origem.
Geometria calculada é reconstruída, evitando arquivos grandes. Zoom e deslocamento
das vistas 2D não fazem parte do formato inicial. Mantenha uma cópia do JSON antes
de atualizar o app. O limite de arquivo é 1 MB e o formato atual é versão 1.

## Histórico e exemplos

**Desfazer** e **Refazer** conservam até 40 alterações nesta sessão. Os atalhos são
Ctrl+Z e Ctrl+Shift+Z (Cmd no macOS). Edição de texto mantém seus atalhos habituais.
Uma nova alteração após desfazer descarta o caminho de refazer. Importações e
exemplos também podem ser desfeitos. O histórico não é salvo no arquivo JSON.

Os exemplos substituem o experimento atual; salve-o antes se quiser conservá-lo:

- **Rarefação no caso IV**: carrega os parâmetros do caso IV e exibe o retrato 3D
  com singularidades e separatrizes.
- **Rarefação no caso III-A**: carrega os parâmetros III-A e a mesma configuração
  de retrato, permitindo comparar as estruturas dos casos.
- **Dois estados**: usa o caso IV, UL em (t,Y,z)=(0.15,0,0) e UR em (-0.15,0,0),
  abre o plano de estados e ativa a inspeção. São condições iniciais para explorar;
  o exemplo não declara uma solução de Riemann validada.

## Interação e cálculos

Ao arrastar um estado, a prévia atualiza no máximo uma vez por quadro e mantém
curvas e retratos calculados durante o gesto. Ao soltar, o app recalcula o resultado.
A indicação inferior mostra cálculos ativos e permite **Cancelar**; após cancelamento
ou erro, **Tentar novamente** inicia os cálculos necessários. O painel de tempos
mostra as últimas tarefas concluídas. A contagem indica tarefas, não uma porcentagem
de progresso numérico. Reduza a resolução quando precisar explorar rapidamente.

Ajuda, plano de estados, solução e mapa de parâmetros são carregados quando usados.
Isso reduz o pacote inicial; a primeira abertura dessas vistas exige carregar seus
módulos. A biblioteca Three continua sendo um pacote grande.

## Verificação e desenvolvimento

`npm run check` executa lint, testes e build, mostrando um resumo. O log completo
fica em `artifacts/check/latest.log`; em falhas, a saída inclui os diagnósticos finais.
`npm run benchmark` mede a geração de geometria para comparar alterações no mesmo
computador. Não representa FPS nem tempo universal de carregamento.

A medição inicial desta melhoria, caso IV e resolução 40, encontrou medianas próximas
de 396 ms (sonicLeft), 394 ms (sonicRight), 413 ms (saturatedHys), 77 ms (saturatedE)
e 18 ms (selfIntersection), após aquecimento. Otimizações numéricas futuras devem
comparar esses tempos e preservar os testes físicos.

O projeto permanece em **0.1.0-dev**; o procedimento para preparar e registrar a
primeira versão 0.1.0 está em VERSIONING.md na raiz do repositório. AGENTS.md e
docs/PROJECT_MAP.md orientam leituras focadas para reduzir contexto repetido nas
próximas tarefas. Isso evita trabalho desnecessário, sem prometer uma redução fixa
de tokens.

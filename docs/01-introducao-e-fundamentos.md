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

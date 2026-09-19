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

A variedade \(\mathcal W\) é exibida nas coordenadas \((\tau,Y,z)\). Cada ponto representa uma relação entre dois estados conectados por uma onda e contém a informação necessária para recuperar os estados esquerdo e direito e a velocidade da onda.

No código, a coordenada \(\tau\) ainda aparece internamente com o nome `t`. Essa convenção preserva a compatibilidade dos cálculos existentes.

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

## Famílias características

A superfície característica possui duas folhas, associadas às famílias lenta e rápida. Elas são indicadas por \(C_s\) e \(C_f\). A escolha de um ponto em cada folha fornece os estados iniciais usados na inspeção e na construção da solução.

## Parâmetros do modelo

O modelo utiliza os parâmetros \(a\), \(b_1\), \(b_2\) e \(c\). O parâmetro \(a\) desloca a velocidade das ondas, enquanto \(b_1\), \(b_2\) e \(c\) entram na geometria dos estados. O mapa \((b_1,b_2)\) organiza os casos de Schaeffer–Shearer e mostra as curvas de transição \(C_1\), \(C_2\) e \(C_3\).

## Princípio de interpretação

As definições matemáticas determinam os objetos; os métodos numéricos os aproximam; a renderização apenas apresenta os resultados. Por isso, resolução, janela de cálculo e tolerâncias podem alterar a aparência e a precisão numérica, mas não a definição matemática.

## Sobre o projeto

O Wave Manifold Explorer é um aplicativo de visualização científica dedicado ao modelo quadrático \(2\times2\). Ele reúne, numa mesma interface, curvas de Hugoniot, rarefações, superfícies sônicas, ondas compostas, reflexão e construção de soluções sobre a variedade.

Informações de autoria e citação estão em `CITATION.cff`; os termos de uso estão em `LICENSE`; e o histórico de versões está em `CHANGELOG.md`, todos na raiz do repositório.

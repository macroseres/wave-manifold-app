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

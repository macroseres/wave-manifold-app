# 3. Construção das curvas

As curvas são representadas por sequências orientadas de pontos na variedade \((\tau,Y,z)\). A orientação é parte da construção: ela determina em que sentido a velocidade deve variar e quais trechos podem participar de uma solução admissível.

## Curvas de Hugoniot

Para um estado fixo, a condição de Rankine–Hugoniot define uma curva dentro da variedade. Em \(H_-(U_L)\), mantém-se \(\pi_-=U_L\); em \(H_+(U_R)\), mantém-se \(\pi_+=U_R\). O app constrói a primeira no sentido `forward` e a segunda no sentido `backward`. As rotinas recuperam o outro estado e calculam a velocidade da onda ao longo da curva.

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

Uma rarefação pode ser parametrizada pela velocidade característica enquanto essa velocidade varia estritamente ao longo da curva. Os pontos em que sua derivada direcional se anula formam a curva de inflexão \(\mathcal J\); nela, a parametrização pela velocidade deixa de ser regular e pode começar uma construção composta.

## Curvas compostas

Uma curva composta liga um arco de rarefação a uma família de Hugoniot. O app constrói \(\mathcal K_-\) e \(\mathcal K_+\) por continuação e por interseção com geometrias saturadas. Os trechos são ordenados, unidos e recortados nos pontos matematicamente relevantes.

## Curvas especiais

- \(\mathcal E\): curva de coincidência.
- \(\mathcal J\): curvas de inflexão lenta e rápida.
- \(\mathcal{DS}\): conjunto de dupla sonicidade.
- \(\operatorname{Hys}^-\) e \(\operatorname{Hys}^+\): curvas de histerese.
- \(\mathcal B^-\) e \(\mathcal B^+\): bifurcações secundárias esquerda e direita.
- \(\operatorname{ext}_\pm(\mathcal E)\): interseções das saturações da coincidência com as superfícies sônicas.

A curva de coincidência \(\mathcal E\) é onde os dois autovalores de \(DF\) coincidem. Ela também pode ser entendida como a envoltória das retas de estado médio com direção característica fixa. Por isso, a projeção da superfície característica no espaço de estados perde regularidade sobre \(\mathcal E\).

## Bifurcação secundária esquerda

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

A curva \(\operatorname{Hys}^+\) é a interseção das duas condições implícitas \(S_R=0\) e \(H_R=0\). Quando \(b_2=0\), sua projeção por \(\pi_-\) admite a parametrização

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

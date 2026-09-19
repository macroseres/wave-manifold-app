# 3. Construção das curvas

As curvas são representadas por sequências orientadas de pontos na variedade \((\tau,Y,z)\). A orientação é parte da construção: ela determina em que sentido a velocidade deve variar e quais trechos podem participar de uma solução admissível.

## Curvas de Hugoniot

Para um estado fixo, a condição de Rankine–Hugoniot define uma folha. O app constrói \(H_-(U_L)\), orientada no sentido `forward`, e \(H_+(U_R)\), orientada no sentido `backward`. As rotinas recuperam os estados ligados ao ponto da variedade e calculam a velocidade da onda.

A velocidade \(s\) associada a \((\tau,Y,z)\) é

\[
s=a+\frac{cz\,[b_1+2+b_2(b_1+1)z]}{b_1(1+z^2)}+Q(z)\tau,
\]

onde

\[
Q(z)=1+b_2(b_1+1)z-(b_1+1)z^2.
\]

## Curvas de rarefação

As rarefações seguem a folha característica correspondente. A família lenta \(\mathcal R^-(U_L)\) e a família rápida \(\mathcal R^+(U_R)\) são amostradas a partir do estado escolhido, respeitando a orientação do autovalor característico.

## Curvas compostas

Uma curva composta liga um arco de rarefação a uma família de Hugoniot. O app constrói \(\mathcal K_-\) e \(\mathcal K_+\) por continuação e por interseção com geometrias saturadas. Os trechos são ordenados, unidos e recortados nos pontos matematicamente relevantes.

## Curvas especiais

- \(\mathcal E\): curva de coincidência.
- \(\mathcal J\): curvas de inflexão lenta e rápida.
- \(\mathcal{DS}\): conjunto de dupla sonicidade.
- \(\operatorname{Hys}^-\) e \(\operatorname{Hys}^+\): curvas de histerese.
- \(\mathcal B^+\): bifurcação secundária direita.
- \(\operatorname{ext}_\pm(\mathcal E)\): interseções das saturações da coincidência com as superfícies sônicas.

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

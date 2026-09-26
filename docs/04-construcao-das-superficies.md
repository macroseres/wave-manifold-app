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
ordem em **Superfícies e fronteiras**, abaixo de \(\mathcal B^-\).
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

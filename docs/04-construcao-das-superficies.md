# 4. Construção das superfícies

## Superfície característica

A superfície característica \(\mathcal C\) contém os pontos em que os estados esquerdo e direito coincidem. Suas folhas lenta e rápida servem de origem para a seleção dos estados iniciais.

## Superfícies sônicas

As superfícies sônicas são definidas implicitamente pela igualdade entre a velocidade da onda e uma velocidade característica. O app distingue a sônica esquerda \(\mathcal S^-\) e a direita \(\mathcal S^+\), separando em cada uma os ramos lento e rápido por meio de um indicador de ramo.

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

## Superfícies saturadas

Saturar uma curva significa reunir folhas de Hugoniot que partem dos seus pontos. O aplicativo inclui:

- a saturação de \(\operatorname{Hys}^+\) por \(H_-\);
- \(\operatorname{sat}_-(\mathcal E)\) e \(\operatorname{sat}_+(\mathcal E)\);
- a saturação das rarefações lenta e rápida, usada na construção das compostas.

As extensões \(\operatorname{ext}_-(\mathcal E)\) e \(\operatorname{ext}_+(\mathcal E)\) surgem da interseção das saturações da coincidência com as superfícies sônicas correspondentes.

## Construção numérica da malha

As superfícies implícitas são avaliadas numa grade limitada pela janela de desenho. A extração da isosuperfície gera triângulos, que depois são classificados, recortados e enviados à cena 3D. A resolução controla a densidade da grade.

## Compactificação de \(z\)

Algumas construções usam uma representação compactificada da coordenada \(z\) para tratar ramos que se prolongam além de uma janela finita. A conversão é aplicada na geometria e desfeita quando um estado físico precisa ser recuperado.

A coordenada visual usada pelo app é

\[
\widehat z=\frac{2}{\pi}\arctan z,
\]

de modo que \(z\in\mathbb R\) é representado por \(\widehat z\in(-1,1)\). A compactificação altera apenas a visualização; as equações continuam sendo avaliadas na coordenada física \(z\).

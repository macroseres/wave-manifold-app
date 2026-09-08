# 4. Construção das superfícies

## Superfície característica

A superfície característica \(\mathcal C\) contém os pontos em que os estados esquerdo e direito coincidem. Suas folhas lenta e rápida servem de origem para a seleção dos estados iniciais.

## Superfícies sônicas

As superfícies sônicas são definidas implicitamente pela igualdade entre a velocidade da onda e uma velocidade característica. O app distingue a sônica esquerda \(\mathcal S^-\) e a direita \(\mathcal S^+\), separando em cada uma os ramos lento e rápido por meio de um indicador de ramo.

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

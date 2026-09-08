# 3. Construção das curvas

As curvas são representadas por sequências orientadas de pontos na variedade \((\tau,Y,z)\). A orientação é parte da construção: ela determina em que sentido a velocidade deve variar e quais trechos podem participar de uma solução admissível.

## Curvas de Hugoniot

Para um estado fixo, a condição de Rankine–Hugoniot define uma folha. O app constrói \(H_-(U_L)\), orientada no sentido `forward`, e \(H_+(U_R)\), orientada no sentido `backward`. As rotinas recuperam os estados ligados ao ponto da variedade e calculam a velocidade da onda.

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

## Interseções e recortes

Os pontos de interseção entre Hugoniot, rarefação, inflexão, coincidência e superfícies sônicas funcionam como âncoras ou pontos de parada. A construção final mantém somente os segmentos compatíveis com a orientação e com a janela numérica ativa.

# 5. Inspeção e construção da solução

## Modo de inspeção

O modo de inspeção fica disponível depois que ao menos um estado inicial é selecionado. Uma sonda pode ser criada e movida sobre a variedade. Ao arrastá-la com `Ctrl`, ela procura o ponto mais próximo entre as curvas disponíveis.

Para cada sonda, o app pode mostrar as duas orientações de Hugoniot e a rarefação associada. Marcadores de interseção e informações do ponto ajudam a comparar estados, coordenadas e velocidades.

## Modo solução

O modo solução exige a seleção de um estado na família lenta e outro na rápida. A cadeia computacional produz três grupos:

- parte lenta;
- parte rápida;
- reflexo rápido, quando aplicável.

Cada grupo pode combinar arcos de Hugoniot, rarefação e composta. Os arcos são classificados como locais ou não locais conforme a origem da rarefação usada na construção.

## Admissibilidade e orientação

Os segmentos são orientados a partir de suas âncoras e filtrados segundo a variação da velocidade. Interseções sônicas, pontos de inflexão e encontros entre curvas delimitam os trechos que podem permanecer na solução.

## Perfil e diagnósticos

Os arcos ativos são projetados no perfil da solução em \((x,t=t_0)\). O painel de diagnósticos apresenta os pontos notáveis, os estados associados e as velocidades calculadas. Esses dados devem ser interpretados junto com as curvas exibidas na variedade e no espaço de estados.

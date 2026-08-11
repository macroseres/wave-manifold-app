# Wave Manifold App

Versao atual da visualizacao das superficies e curvas:

- a interface mostra a variedade nas coordenadas `tau, Y, z`;
- o nome interno `t` permanece no codigo para preservar os calculos existentes;
- clique direito abre o painel textual de inspecao quando aplicado em curvas, marcadores, superficie caracteristica ou sonica esquerda;
- os marcadores de direcao da velocidade usam cones 3D;
- os cones usam escala compensada (`arrowScale`) para nao ficarem achatados quando a cena e escalada;
- as cores originais das curvas foram preservadas;
- clique normal seleciona somente a caracteristica lenta `C^s`;
- `Shift+click` seleciona somente a caracteristica rapida `C_f`;
- a selecao por clique na sonica esquerda foi desativada; a inspecao por clique direito continua disponivel;
- apos selecionar uma das caracteristicas, Hugoniot, rarefacao e composta continuam sendo desenhadas normalmente.

## Ajuste visual das Hugoniot

- O botao do painel **Hugoniot** oculta/mostra as curvas de Hugoniot selecionadas.
- As curvas de Hugoniot sao desenhadas com traco continuo.
- A parte de admissibilidade foi removida da interface e do desenho das curvas.

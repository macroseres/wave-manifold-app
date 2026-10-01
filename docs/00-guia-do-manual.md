# Guia de leitura e primeiros passos

Este manual reúne o uso do Wave Manifold Explorer, seus fundamentos e métodos
computacionais. A edição em desenvolvimento acompanha o app `0.1.0-dev` e prepara
a documentação da primeira entrega numerada, `0.1.0`. A identificação da edição
aparece no cabeçalho da Ajuda e no manual consolidado.

## Percursos de leitura

- **Primeiro uso:** leia [Interface e fluxo de uso](02-interface-e-fluxo-de-uso.md),
  depois [Inspeção e construção da solução](05-inspecao-e-solucao.md).
- **Estudo matemático:** comece por [Introdução e fundamentos](01-introducao-e-fundamentos.md),
  seguido de [Construção das curvas](03-construcao-das-curvas.md) e
  [Construção das superfícies](04-construcao-das-superficies.md).
- **Retratos de fase:** consulte [Retratos de fase](07-retratos-de-fase.md);
  as rotinas e convenções globais estão no [apêndice técnico](08-retrato-composto-global.md).
- **Desenvolvimento:** leia [Métodos computacionais e desenvolvimento](06-metodos-e-desenvolvimento.md).

## Primeiro experimento: geometria sem selecionar estados

1. Abra a vista **Variedade** e mantenha a superfície característica visível.
2. Na seção **Retrato de Fase** do painel esquerdo, ative **Campo de Rarefação**.
3. Observe as famílias lenta e rápida e use a navegação da cena para compará-las.
4. Ative **Campo Composto em S⁻** para comparar as compostas K₋ com as rarefações.
5. Se desejar ver a superfície que contém a composta, ative **Sônica Esquerda**
   em seu próprio controle. Ativar a composta não ativa essa camada automaticamente.
6. Passe o ponteiro pelos controles e use **Abrir documentação** para consultar
   a definição da construção.

Esse experimento não exige estados selecionados. Ele permite conhecer a
geometria antes de construir uma solução específica.

## Segundo experimento: estados e inspeção

1. Na característica, selecione um ponto da folha lenta e outro da rápida;
   eles determinam os estados `U_L` e `U_R`.
2. Ative **Inspeção** e compare as coordenadas, estados e velocidades das sondas.
3. Alterne para **Estados** e observe as projeções das mesmas construções.
4. Ative **Solução** para examinar os arcos produzidos e a vista **Perfil**.
5. Para o retrato viscoso no plano de estados, consulte o resíduo de
   Rankine–Hugoniot antes de interpretar `U_R` como equilíbrio ou destino de uma conexão.

Escolher dois estados independentemente não garante que formem um choque com
velocidade comum. Um retrato ou uma curva desenhada é uma aproximação numérica;
uma conexão destacada não constitui uma prova matemática de existência.

## Quando um objeto não aparece

- Confira a vista ativa, as camadas e as condições de ativação do controle.
- Para rarefação global 3D, mantenha a característica visível; no retrato viscoso
  2D, selecione os dois estados.
- Confira a janela de cálculo e a resolução. Ramos podem ficar fora da janela
  e componentes pequenas podem escapar a uma malha finita.
- Aguarde os cálculos dos workers antes de interpretar uma ausência como resultado.
- Valores `−` em cartões indicam dados não definidos ou ainda não calculados.

## Como interpretar as coordenadas

A cena usa `(τ, Y, ẑ)`, com `ẑ = 2 atan(z)/π`. Os cálculos, estados e velocidades
usam o valor físico `z`. O nome interno `t` representa `τ`, enquanto o tempo do
perfil da solução é outra variável. As bordas `ẑ = ±1` representam direções no infinito.

## Alcance desta edição

O manual descreve as construções presentes no projeto. A classificação completa
das câmaras da variedade e a seleção de choques complexos e subcompressivos não
estão disponíveis no pipeline de solução. Os limites específicos dos retratos,
da resolução e da integração aparecem nos capítulos correspondentes.

A revisão desta edição organiza o conteúdo e confere sua ligação com o código;
ela não substitui a revisão científica das deduções. Exemplos com estados
numéricos reproduzíveis e capturas de tela ainda precisam ser acrescentados.

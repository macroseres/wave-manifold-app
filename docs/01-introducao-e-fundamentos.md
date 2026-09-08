# 1. Introdução e fundamentos

O Wave Manifold Explorer permite estudar geometricamente ondas de choque, rarefações e ondas compostas do modelo quadrático (2\times2) de Schaeffer–Shearer. O aplicativo relaciona três representações: a variedade de ondas, o espaço de estados e o perfil da solução.

## A variedade de ondas

A variedade \(\mathcal W\) é exibida nas coordenadas \((\tau,Y,z)\). Cada ponto representa uma relação entre dois estados conectados por uma onda e contém a informação necessária para recuperar os estados esquerdo e direito e a velocidade da onda.

No código, a coordenada \(\tau\) ainda aparece internamente com o nome `t`. Essa convenção preserva a compatibilidade dos cálculos existentes.

## Famílias características

A superfície característica possui duas folhas, associadas às famílias lenta e rápida. Elas são indicadas por \(C_s\) e \(C_f\). A escolha de um ponto em cada folha fornece os estados iniciais usados na inspeção e na construção da solução.

## Parâmetros do modelo

O modelo utiliza os parâmetros `a`, `b1`, `b2` e `c`. O mapa \((b_1,b_2)\) organiza os casos de Schaeffer–Shearer e mostra as curvas de transição \(C_1\), \(C_2\) e \(C_3\). Alterar esses parâmetros pode modificar a topologia dos objetos geométricos exibidos.

## Princípio de interpretação

As definições matemáticas determinam os objetos; os métodos numéricos os aproximam; a renderização apenas apresenta os resultados. Por isso, resolução, janela de cálculo e tolerâncias podem alterar a aparência e a precisão numérica, mas não a definição matemática.

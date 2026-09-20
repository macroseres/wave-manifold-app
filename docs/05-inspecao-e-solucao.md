# 5. Inspeção e construção da solução

## Modo de inspeção

O modo de inspeção fica disponível depois que ao menos um estado inicial é selecionado. Uma sonda lenta e uma sonda rápida podem ser criadas e movidas tanto na variedade quanto no espaço de estados. Ao arrastar uma sonda com `Ctrl` na vista 3D, ela procura o ponto mais próximo entre as curvas disponíveis.

Para cada sonda, o app pode mostrar as duas orientações de Hugoniot e a rarefação associada. Marcadores de interseção e informações do ponto ajudam a comparar estados, coordenadas e velocidades.

O painel de inspeção apresenta \((\tau,Y,z)\), a velocidade \(s\) e os dois estados \((u^-,v^-)\) e \((u^+,v^+)\). Os mesmos dados são preservados quando o usuário alterna entre **Variedade** e **Estados**.

## Modo solução

O modo solução exige a seleção de um estado na família lenta e outro na rápida. A cadeia computacional produz três grupos:

- parte lenta;
- parte rápida;
- reflexo rápido, quando aplicável.

Cada grupo pode combinar arcos de Hugoniot, rarefação e composta. Os arcos são classificados como locais ou não locais conforme a origem da rarefação usada na construção.

## Admissibilidade e orientação

Os segmentos são orientados a partir de suas âncoras e filtrados segundo a variação da velocidade. Interseções sônicas, pontos de inflexão e encontros entre curvas delimitam os trechos que podem permanecer na solução.

As convenções implementadas são: a rarefação lenta percorre o sentido de velocidade crescente; a rarefação rápida percorre o sentido de velocidade decrescente; os choques e as compostas são recortados de acordo com a orientação admissível da cadeia correspondente.

Para interpretar um choque, sejam \(\lambda_s(U)<\lambda_f(U)\) as velocidades características. O critério clássico de Lax exige uma das configurações:

\[
\text{choque lento:}\quad
\lambda_s(U^-)>s,
\qquad
\lambda_s(U^+)<s<\lambda_f(U^+),
\]

\[
\text{choque rápido:}\quad
\lambda_s(U^-)<s<\lambda_f(U^-),
\qquad
\lambda_f(U^+)<s.
\]

Equivalentemente, os sinais dos autovalores de \(M_-=DF(U^-)-sI\) e \(M_+=DF(U^+)-sI\) determinam o tipo de choque. Essa leitura conecta os recortes pelas superfícies sônicas às desigualdades de Lax.

O texto de referência também discute choques subcompressivos e choques em regiões de autovalores complexos. Essas classes fornecem contexto para uma subdivisão mais completa da variedade, mas não são atualmente classificadas nem apresentadas como soluções pelo app.

## Perfil e diagnósticos

Os arcos ativos são projetados no perfil da solução em \((x,t=t_0)\). O painel de diagnósticos apresenta os pontos notáveis, os estados associados e as velocidades calculadas. Esses dados devem ser interpretados junto com as curvas exibidas na variedade e no espaço de estados.

Ao inspecionar um ponto de choque, uma verificação útil é comparar \(s\) com \(\lambda_s\) e \(\lambda_f\) nos dois estados projetados. Ao inspecionar uma sônica, uma dessas diferenças deve se aproximar de zero. Na superfície característica, \(U^-=U^+\) e \(s\) coincide com o autovalor da folha selecionada.

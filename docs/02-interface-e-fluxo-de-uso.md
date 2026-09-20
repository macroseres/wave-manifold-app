# 2. Interface e fluxo de uso

## Visualizações principais

- **Variedade:** variedade de ondas \(\mathcal W\) em três dimensões.
- **Estados:** projeções \(\pi_-\) e \(\pi_+\) das construções no plano \((u,v)\).
- **Perfil:** perfil da solução em \((x,t=t_0)\) e seus diagnósticos.
- **Parâmetros:** mapa dos casos no plano \((b_1,b_2)\).

## Fluxo básico

1. Escolha um caso de Schaeffer–Shearer ou ajuste os parâmetros.
2. Ative no painel esquerdo as superfícies e curvas de interesse.
3. Fazer clique na superfície característica, se o clique for na \(C_s\) o ponto determina \(U_L\) e se o clique for na \(C_f\) o ponto determina \(U_R\).
4. Ative **Inspeção** para examinar curvas ligadas a um estado, tanto na variedade quanto no espaço de estados.
5. Com os dois estados selecionados, ative **Solução** para construir os arcos admissíveis.
6. Compare a variedade 3D, o espaço de estados e o perfil resultante.

## Navegação e ajustes

Na vista 3D, arraste para orbitar e use a roda do mouse ou os botões `+` e `−` para zoom. A rotação automática pode ser ativada na barra superior. O botão **Exportar** salva a visualização 3D como imagem PNG.

Em **Ajustes**, podem ser alteradas as escalas dos eixos, a resolução numérica, a opacidade e a janela de desenho em \(Y\), \(\tau\) e \(z\). Uma resolução maior tende a produzir superfícies mais detalhadas, com maior custo de processamento.

## Camadas da cena

O painel esquerdo agrupa as camadas em referências geométricas, superfícies e fronteiras, família lenta e família rápida. **Ocultar tudo** e **Mostrar tudo** ajudam a isolar construções; **Limpar seleções** remove os estados escolhidos.

## Inspeção no espaço de estados

Com **Inspeção** ativa, clique próximo da projeção de \(C_s\) ou \(C_f\) no plano \((u,v)\) para criar a sonda da família correspondente. Arraste o marcador da sonda para percorrer a característica. A mesma sonda e suas curvas associadas permanecem sincronizadas entre as vistas **Variedade** e **Estados**.

Ao desativar **Inspeção**, as curvas, os marcadores e os rótulos das sondas são ocultados, mas suas posições ficam preservadas. O enquadramento e os estados \(U_L\) e \(U_R\) não são alterados.

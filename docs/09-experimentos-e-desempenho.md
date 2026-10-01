# Experimentos e desempenho

## Salvar e retomar

Abra **Experimentos** na barra superior, escolha um nome e pressione **Salvar JSON**.
O arquivo contém a versão do app e do formato, parâmetros, janela física, resolução,
escalas, camadas, estados selecionados, sondas, opções dos retratos e câmera 3D.
Use **Abrir JSON** para restaurar. Arquivos inválidos são recusados antes de alterar
o experimento atual; arquivos de outra versão do app exibem sua versão de origem.
Geometria calculada é reconstruída, evitando arquivos grandes. Zoom e deslocamento
das vistas 2D não fazem parte do formato inicial. Mantenha uma cópia do JSON antes
de atualizar o app. O limite de arquivo é 1 MB e o formato atual é versão 1.

## Histórico e exemplos

**Desfazer** e **Refazer** conservam até 40 alterações nesta sessão. Os atalhos são
Ctrl+Z e Ctrl+Shift+Z (Cmd no macOS). Edição de texto mantém seus atalhos habituais.
Uma nova alteração após desfazer descarta o caminho de refazer. Importações e
exemplos também podem ser desfeitos. O histórico não é salvo no arquivo JSON.

Os exemplos substituem o experimento atual; salve-o antes se quiser conservá-lo:

- **Rarefação no caso IV**: carrega os parâmetros do caso IV e exibe o retrato 3D
  com singularidades e separatrizes.
- **Rarefação no caso III-A**: carrega os parâmetros III-A e a mesma configuração
  de retrato, permitindo comparar as estruturas dos casos.
- **Dois estados**: usa o caso IV, UL em (t,Y,z)=(0.15,0,0) e UR em (-0.15,0,0),
  abre o plano de estados e ativa a inspeção. São condições iniciais para explorar;
  o exemplo não declara uma solução de Riemann validada.

## Interação e cálculos

Ao arrastar um estado, a prévia atualiza no máximo uma vez por quadro e mantém
curvas e retratos calculados durante o gesto. Ao soltar, o app recalcula o resultado.
A indicação inferior mostra cálculos ativos e permite **Cancelar**; após cancelamento
ou erro, **Tentar novamente** inicia os cálculos necessários. O painel de tempos
mostra as últimas tarefas concluídas. A contagem indica tarefas, não uma porcentagem
de progresso numérico. Reduza a resolução quando precisar explorar rapidamente.

Ajuda, plano de estados, solução e mapa de parâmetros são carregados quando usados.
Isso reduz o pacote inicial; a primeira abertura dessas vistas exige carregar seus
módulos. A biblioteca Three continua sendo um pacote grande.

## Verificação e desenvolvimento

`npm run check` executa lint, testes e build, mostrando um resumo. O log completo
fica em `artifacts/check/latest.log`; em falhas, a saída inclui os diagnósticos finais.
`npm run benchmark` mede a geração de geometria para comparar alterações no mesmo
computador. Não representa FPS nem tempo universal de carregamento.

A medição inicial desta melhoria, caso IV e resolução 40, encontrou medianas próximas
de 396 ms (sonicLeft), 394 ms (sonicRight), 413 ms (saturatedHys), 77 ms (saturatedE)
e 18 ms (selfIntersection), após aquecimento. Otimizações numéricas futuras devem
comparar esses tempos e preservar os testes físicos.

O projeto permanece em **0.1.0-dev**; o procedimento para preparar e registrar a
primeira versão 0.1.0 está em VERSIONING.md na raiz do repositório. AGENTS.md e
docs/PROJECT_MAP.md orientam leituras focadas para reduzir contexto repetido nas
próximas tarefas. Isso evita trabalho desnecessário, sem prometer uma redução fixa
de tokens.

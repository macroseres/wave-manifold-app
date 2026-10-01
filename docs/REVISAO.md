# Revisão do manual — 29/09/2026

Escopo: organização editorial para `0.1.0`, com o app ainda em `0.1.0-dev`.
Foram lidos o índice, os sete capítulos, o suplemento e os seis documentos
dos volumes removidos no commit `17a4e5c`. A revisão não certifica todas as
deduções matemáticas nem a completude do solucionador.

## Inventário

| Parte | Conteúdo existente | Resultado da revisão |
| --- | --- | --- |
| Guia de leitura | Não havia entrada para novos usuários. | Acrescentados percursos, dois experimentos e consulta de problemas comuns. |
| 1. Fundamentos | Modelo, Rankine–Hugoniot, cartas, projeções e compactificação. | Preservado; precisa de revisão científica independente das deduções. |
| 2. Interface | Vistas, seleção, ajustes, camadas e sondas. | Corrigidos a localização da rotação e os grupos de camadas. |
| 3. Curvas | Hugoniot, rarefação, composta, histerese e bifurcações. | Preservado; faltam exemplos numéricos guiados. |
| 4. Superfícies | Característica, sônicas, Hopf, saturações e malhas. | Corrigido o grupo das saturações de histerese; faltam figuras. |
| 5. Solução | Inspeção, orientação, admissibilidade e perfil. | Corrigida a ativação de Inspeção sem estados na vista 3D. |
| 6. Métodos | Arquitetura, coordenadas, workers, testes e escopo. | Acrescentados catálogo, geração do manual e preservação por tag. |
| 7. Retratos | Uso 3D/2D, campos, singularidades e limites. | Incluído no índice principal e mantida a ligação com o apêndice. |
| Apêndice | Construção global, implementação e validação antiga. | Incluído na Ajuda; resultados antigos identificados como históricos. |

## Documentos removidos

O estado imediatamente anterior a `17a4e5c` contém:

- `Volume_I/00_FrontMatter.md`: uma frase sobre o propósito do livro.
- `Volume_I/01_Introduction.md`: uma introdução e quatro princípios arquiteturais.
- `Volume_I/README.md` e os índices dos volumes II, III e IV: títulos e
  espaços reservados para futuros capítulos.

Os princípios úteis (definição matemática, aproximação numérica, apresentação
e compartilhamento dos pipelines local/não local) já estão cobertos pelo manual
e pelo código. Não foram restaurados volumes vazios como se fossem capítulos
concluídos. Seus arquivos originais permanecem consultáveis no Git.

## Conferências com o código

- `src/App.jsx`: Inspeção é permitida na vista 3D ou com um estado selecionado;
  a solução exige os dois estados iniciais.
- `src/app/scene/WaveSceneViewport.jsx`: botão Rotação nos controles 3D.
- `src/app/inspection/PhasePortraitProvider.jsx`: rarefação 3D depende da
  característica; retrato viscoso depende dos estados; composta tem controle próprio.
- `src/components/panels/DocumentationViewer.jsx`: catálogo compartilhado,
  identificação pela versão do pacote e navegação interna para capítulos Markdown.

## Lacunas antes de considerar o manual final

- Ampliar os três exemplos guiados com resultados científicos esperados e validados.
- Capturar imagens das vistas e relacionar suas legendas com os capítulos.
- Revisar cientificamente fórmulas, degenerescências e convenções de orientação.
- Completar a referência bibliográfica com uma fonte acessível e identificável.
- Ampliar a revisão visual para outras janelas e fazer uma edição PDF com fórmulas renderizadas.

## Validação técnica

O gerador verifica a leitura das fontes, identificadores duplicados e links
Markdown para capítulos ausentes; o build verifica a incorporação dos arquivos
na aplicação. Nesta revisão, o manual foi gerado, 132 testes passaram,
ESLint e build Vite passaram (com o aviso existente de tamanho de bundle).
Os comandos foram executados diretamente com Node porque a instalação local
do comando npm aponta para um arquivo ausente.

No navegador, foram conferidos o cabeçalho de versão, as nove seções,
o guia, os parágrafos e listas com continuação, o link do guia para retratos
e o link de retratos para o apêndice, que abre dentro da Ajuda. A conferência
visual foi feita na janela disponível; outras larguras e a revisão científica
não são substituídas por essas verificações.

## Melhorias de interação — 0.1.0-dev

O capítulo 09 documenta experimentos JSON, histórico, exemplos e cálculos.
A verificação final desta etapa passou com 138 testes, ESLint e build.
No navegador foram conferidos os exemplos, desfazer/refazer, exportação e
importação de JSON. A imagem de conferência está em
`artifacts/manual/melhorias-0.1.0-dev.png`. O manual consolidado foi regenerado
com dez seções. O aviso de tamanho da biblioteca Three permanece.

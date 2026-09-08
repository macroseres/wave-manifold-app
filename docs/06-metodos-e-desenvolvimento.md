# 6. Métodos computacionais e desenvolvimento

## Organização do código

- `src/entities/`: definições e construções matemáticas por domínio.
- `src/geometry/`: geração, projeção, interseção e tratamento de geometrias.
- `src/components/`: apresentação das curvas, superfícies, painéis e vistas.
- `src/app/`: estado e coordenação dos fluxos da interface.
- `src/workers/`: cálculos de curvas executados fora da thread principal.
- `tests/`: testes das entidades, métodos numéricos e pipelines de solução.

O princípio arquitetural é manter o cálculo independente de React e Three.js sempre que possível. Componentes visuais consomem pontos, segmentos e malhas já construídos pelas camadas matemáticas.

## Métodos numéricos

O aplicativo combina solução de equações implícitas, amostragem paramétrica adaptativa, continuação, marching squares, extração de isosuperfícies, interseção de malhas, suavização e recorte de polilinhas. Tolerâncias e resolução ficam centralizadas nas configurações numéricas.

## Execução local

```text
npm install
npm run dev
```

Para verificar uma alteração:

```text
npm test
npm run lint
npm run build
```

## Manutenção da documentação

Os seis arquivos Markdown de `docs/` alimentam simultaneamente a leitura no GitHub e a janela de documentação do app. Alterações conceituais devem ser feitas nesses arquivos; o próximo build incorporará o mesmo conteúdo na aplicação.

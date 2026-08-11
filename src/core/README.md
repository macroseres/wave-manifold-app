# Núcleo matemático da Wave Manifold Explorer

Esta pasta separa cálculo e renderização.

- `types/mathTypes.js`: contratos `Vec3`, `WaveCurve`, `WaveSurface`, `WaveLeaf`.
- `waves/hugoniotLeaf.js`: folhas orientadas `H_-` e `H_+`.
- `waves/rarefactionLeaf.js`: folhas orientadas `R_-` e `R_+`.
- `intersections/stateCurveIntersection.js`: interseção por estados/parametrização, sem Three.js.
- `continuation/newton.js`: Newton genérico para a próxima substituição das buscas por malha.
- `continuation/pseudoArclength.js`: contrato inicial para continuação pseudo-arco.

Convenções implementadas:

- `H_-`: orientada por `ds < 0`.
- `H_+`: orientada por `ds > 0`.
- `R_-`: orientada por `dλ = ds > 0` sobre a característica.
- `R_+`: orientada por `dλ = ds < 0` sobre a característica.

A interface React/Three.js deve chamar este núcleo e apenas desenhar os pontos retornados.

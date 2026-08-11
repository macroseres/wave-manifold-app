# Organização dos componentes

Esta pasta está separada por função visual/matemática:

- `scene/`: elementos gerais da cena 3D, como eixos.
- `panel/`: painel lateral, controles, legenda e rótulos LaTeX.
- `surfaces/`: superfícies renderizadas no espaço `(\tau,Y,z)`.
- `curves/`: curvas matemáticas desenhadas na cena.
- `projections/`: projeções e visualizações auxiliares de soluções.
- `utils/`: helpers pequenos usados por componentes.

Curvas principais:

- `curves/HugoniotCurve.jsx`: `H_-(U_L)` e `H_+(U_R)`.
- `curves/RarefactionCurve.jsx`: rarefações `\mathcal{R}_-` e `\mathcal{R}_+`.
- `curves/RarefactionArcCurve.jsx`: arco de rarefação `R_s`.
- `curves/ShockCurve.jsx`: arco choque `S_s`.
- `curves/CompositeCurve.jsx`: compostas `\mathcal{K}_-`, `\mathcal{K}_+` e arco composto `K_-`.
- `curves/SonicIntersectionCurves.jsx`: inflexões `\mathcal{J}_-`, `\mathcal{J}_+` e dupla sônica `\mathcal{DS}`.
- `curves/CoincidenceCurve.jsx`: coincidência `\mathcal{E}`.
- `curves/SecondaryRightBifurcationCurve.jsx`: bifurcação secundária `\mathcal{B}_R`.

Superfícies principais:

- `surfaces/CharacteristicSurface.jsx`: características `\mathcal{C}_s` e `\mathcal{C}_f`.
- `surfaces/SonicRightSurface.jsx`: sônica direita `\mathcal{S}^+`.
- `surfaces/SonicLeftSurface.jsx`: sônica esquerda `\mathcal{S}^-`.
- `surfaces/SaturatedCoincidenceSurface.jsx`: saturação da coincidência `\mathcal{SCC}`.
- `surfaces/SaturatedSurface.jsx`: superfície saturada original.

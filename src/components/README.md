# Componentes por objeto desenhado

Os desenhos ficam em `objects/`, agrupados pelo objeto matemático. Curvas e
superfícies do mesmo objeto ficam juntas, incluindo suas saturações.

| Pasta em `objects/` | Arquivos e objetos desenhados |
| --- | --- |
| `characteristic/` | `CharacteristicSurface.jsx`: característica C, com folhas lenta e rápida |
| `hugoniot/` | `HugoniotCurve.jsx`: folhas H₋ e H₊ |
| `rarefaction/` | `RarefactionCurve.jsx`, `RarefactionArcCurve.jsx`: rarefações e seus arcos; `RarefactionSaturationSurfaces.jsx`: saturações das rarefações lenta e rápida |
| `composite/` | `CompositeCurves.jsx`: curvas compostas lenta e rápida |
| `sonic/` | `SonicMinusSurface.jsx`: S⁻; `SonicPlusSurface.jsx`: S⁺ |
| `coincidence/` | `CoincidenceCurve.jsx`: E; `CoincidenceSaturationSurface.jsx`: sat₋(E) e sat₊(E); `CoincidenceExtensionCurves.jsx`: ext₋(E) e ext₊(E) |
| `hysteresis/` | `HysteresisCurves.jsx`: Hys⁻ e Hys⁺; `HysteresisSaturationSurface.jsx`: suas saturações; `HysteresisSaturationSelfIntersectionCurve.jsx`: curva dupla da saturação |
| `bifurcation/` | `SecondaryMinusBifurcationCurve.jsx`: B⁻; `SecondaryPlusBifurcationCurve.jsx`: B⁺ |
| `inflection/` | `InflectionCurves.jsx`: inflexões lenta e rápida J₋ e J₊ |
| `doubleSonic/` | `DoubleSonicCurve.jsx`: dupla sônica DS |
| `hopf/` | `HopfSurface.jsx`: superfícies de Hopf |
| `solution/` | `AdmissibleArcCurve.jsx`: arcos admissíveis das famílias de ondas |
| `shared/` | `CurveSegments.jsx`, `OrientedArcMarkers.jsx`, `smoothCurve.js`: desenho de segmentos, marcadores e suavização compartilhados |

A saturação usada na construção das compostas é gerada pela **rarefação**;
por isso seu arquivo fica em `rarefaction/RarefactionSaturationSurfaces.jsx`.
Inflexão e dupla sônica têm arquivos separados, mesmo sendo calculadas por
interseções de superfícies.

Os geradores de malhas correspondentes ficam em `src/geometry/`:
`hysteresisSaturationGeometry.js`, `coincidenceSaturationGeometry.js` e
`rarefactionSaturationGeometry.js`.

`scene/` reúne eixos e coordenação visual; `panels/` reúne controles, legendas e
vistas auxiliares. Hooks compartilhados ficam em `src/hooks/`, e a coordenação
dos painéis em `src/app/panels/`.

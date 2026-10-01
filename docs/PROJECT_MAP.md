# Project map

| Responsibility | Entry point |
| --- | --- |
| App coordination and selection | `src/App.jsx`, `src/app/selection/useCharacteristicSelection.js` |
| State, undo and redo | `src/app/state/waveAppState.js` |
| Experiment format and validation | `src/app/experiments/experimentFormat.js` |
| Experiment UI and examples | `src/components/panels/ExperimentControls.jsx` |
| 3D scene and camera | `src/app/scene/WaveSceneViewport.jsx`, `CameraControllers.jsx` |
| 2D, solution and parameter views | `src/components/panels/OverlayStage.jsx` |
| Worker tasks, cache and cancellation | `src/hooks/useWorkerTask.js`, `src/hooks/workerPool.js` |
| Computation status and timings | `src/hooks/computationStatus.js` |
| Mathematical definitions | `src/entities/`; locate the object before editing |
| Numerical limits | `src/config/numerics.js` |
| Case defaults and saved drawing settings | `src/components/panels/schaefferShearerConfig.js`, `schaefferCaseStorage.js` |
| Help and versioned manual | `docs/manual.json`, `src/components/panels/DocumentationViewer.jsx` |

Commands: `npm run dev`, `npm test`, `npm run lint`, `npm run build`,
`npm run check`, `npm run docs:manual`.
For a focused test: `node --test tests/<file>.test.js`.

Do not read generated `dist/`, the lockfile or the full manual to locate an implementation.
Use searches and targeted excerpts. Success output should report counts and durations;
only failures need full diagnostics. Profiling precedes changes to numerical accuracy.

# Working on Wave Manifold Explorer

- Read `docs/PROJECT_MAP.md` first, then only the files needed for the task.
- Preserve uncommitted user changes. Do not regenerate or revert tracked `dist/` without checking its current diff.
- Mathematical definitions and physical coordinates `(t=τ,Y,z)` are authoritative. Compactify z exactly once for display.
- Reuse existing entities for local/nonlocal pipelines; do not add another mathematical implementation in a component.
- Use focused regression tests during numerical changes. Run `npm run check` once at completion; repeat only after relevant changes or failures.
- Keep tool output concise: summarize successful checks; retain diagnostics for failures.
- Update `CHANGELOG.md` for user-visible changes and the relevant manual chapter. Generate with `npm run docs:manual`.
- Package and lockfile versions must agree. Do not mark a release published until its commit/tag exists.
- No delegation is required. Keep instructions here short; detailed explanations belong in the documentation.

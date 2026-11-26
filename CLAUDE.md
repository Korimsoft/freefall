# freefall

A casual arcade game: a page and its TypeScript in `app/`, bundled and served by Vite (`vite.config.js`).

## Commands

- Package manager: pnpm (version in `packageManager` in package.json). Never use npm or yarn, and never commit a `package-lock.json`.
- Install: `pnpm install`
- Build: `pnpm build` (`vite build`) bundles what `app/index.html` loads (`app/src/game.ts` and everything it imports, and the stylesheet) into `dist/index.html` and hashed files in `dist/assets/`, with relative paths (`base: './'`). The tests and `fixtures.ts` are not imported by the game, so they are not in the bundle. `tsc` only type checks.
- Sources import each other without a file ending (`./ball`); Vite and Jest find the `.ts` file.
- esbuild is still installed, as an optional peer of Vite and ts-jest. Its install script stays off (`allowBuilds` in `pnpm-workspace.yaml`): it is not needed, because its binary comes as a platform package.
- Develop: `pnpm dev` (Vite's dev server at http://localhost:5173, updates the page on every save).
- Run the built game: `pnpm start` (builds, then serves `dist/` with `vite preview`), then open http://localhost:8080
- Test: `pnpm test` (Jest with ts-jest, jsdom); type check: `pnpm typecheck`.
- Jest runs on the jsdom installed in the project through `jest-environment.js` (built on `@jest/environment-jsdom-abstract`), not on `jest-environment-jsdom`, which still pins jsdom 26 and with it the deprecated `whatwg-encoding`. Update jsdom with `pnpm add -D jsdom@latest`.
- Tests are TypeScript files next to the code they test in `app/src` (e.g. `ball.test.ts`), with shared test helpers in `app/src/fixtures.ts`. The build leaves them out of `dist/`.
- TypeScript stays on 6.x: ts-jest does not support TypeScript 7 yet.

## Releases

- Every merge into `main` is released by `.github/workflows/release.yml`: it builds, pushes the tag `v<n>`, one more than the highest `v<n>` tag, and makes a GitHub release `v<n>` with `dist/` zipped as `freefall-v<n>.zip`. It commits nothing.
- The git tags hold the release version. `version` in package.json is not the release version: never change it to match a release.
- Never push `v*` tags yourself.
- Never push to `main` directly: work on a branch and open a pull request into `main`.

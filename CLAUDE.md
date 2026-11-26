# freefall

A casual arcade game: static files in `app/`, served by a small Express server (`index.js`).

## Commands

- Package manager: pnpm (version in `packageManager` in package.json). Never use npm or yarn, and never commit a `package-lock.json`.
- Install: `pnpm install`
- Build: `pnpm build` (`scripts/build.js`) copies `app/` without its `.ts` files into `dist/` and compiles `app/src` with `tsconfig.build.json` into `dist/src`, leaving out the tests and `fixtures.ts`.
- Sources import each other by their `.ts` file name (`./ball.ts`). `rewriteRelativeImportExtensions` in `tsconfig.json` makes the build emit `./ball.js`, the name the browser loads; ts-jest does the same, and Jest maps it back to the `.ts` file (`moduleNameMapper` in `jest.config.js`).
- Run: `pnpm start` (builds, then serves `dist/`), then open http://localhost:8080
- Test: `pnpm test` (Jest with ts-jest, jsdom); type check: `pnpm typecheck`.
- Tests are TypeScript files next to the code they test in `app/src` (e.g. `ball.test.ts`), with shared test helpers in `app/src/fixtures.ts`. The build leaves them out of `dist/`.
- TypeScript stays on 6.x: ts-jest does not support TypeScript 7 yet.

## Releases

- Every merge into `main` is released by `.github/workflows/release.yml`: it builds, pushes the tag `v<n>`, one more than the highest `v<n>` tag, and makes a GitHub release `v<n>` with `dist/` zipped as `freefall-v<n>.zip`. It commits nothing.
- The git tags hold the release version. `version` in package.json is not the release version: never change it to match a release.
- Never push `v*` tags yourself.
- Never push to `main` directly: work on a branch and open a pull request into `main`.

# freefall

A casual arcade game: static files in `app/`, served by a small Express server (`index.js`).

## Commands

- Package manager: pnpm (version in `packageManager` in package.json). Never use npm or yarn, and never commit a `package-lock.json`.
- Install: `pnpm install`
- Run: `pnpm start`, then open http://localhost:8080
- Test: `pnpm test` (Jest with ts-jest, jsdom); type check: `pnpm typecheck`. There is no build step yet.
- Tests are TypeScript files next to the code they test in `app/src` (e.g. `ball.test.ts`), with shared test helpers in `app/src/fixtures.ts`. `index.js` keeps them from being served.
- TypeScript stays on 6.x: ts-jest does not support TypeScript 7 yet.

## Releases

- Every merge into `main` is released by `.github/workflows/release.yml`: it pushes the tag `v<n>`, one more than the highest `v<n>` tag. It commits nothing.
- The git tags hold the release version. `version` in package.json is not the release version: never change it to match a release.
- Never push `v*` tags yourself.
- Never push to `main` directly: work on a branch and open a pull request into `main`.

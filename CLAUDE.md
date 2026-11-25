# freefall

A casual arcade game: static files in `app/`, served by a small Express server (`index.js`).

## Commands

- Package manager: pnpm (version in `packageManager` in package.json). Never use npm or yarn, and never commit a `package-lock.json`.
- Install: `pnpm install`
- Run: `pnpm start`, then open http://localhost:8080
- There are no tests and no build step yet.

## Releases

- Every merge into `main` is released by `.github/workflows/release.yml`: it pushes the tag `v<n>`, one more than the highest `v<n>` tag. It commits nothing.
- The git tags hold the release version. `version` in package.json is not the release version: never change it to match a release.
- Never push `v*` tags yourself.
- Never push to `main` directly: work on a branch and open a pull request into `main`.

# freefall
A casual arcade game

## Running

```
pnpm install
pnpm start
```

The game is served at http://localhost:8080.

## Releasing

Every pull request merged into `main` is a release. The Release workflow raises the whole-number `version` in `package.json` by one, commits it as "Release <n>" and tags that commit `v<n>`. Do not change `version` or push `v*` tags by hand.

Direct pushes to `main` are forbidden: every change goes through a pull request.

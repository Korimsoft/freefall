# freefall
A casual arcade game

## Running

```
pnpm install
pnpm start
```

The game is served at http://localhost:8080.

## Testing

```
pnpm test
pnpm typecheck
```

The tests are Jest tests written in TypeScript, next to the code they test (`app/src/ball.test.ts` tests `app/src/ball.js`). The server does not serve `*.test.ts` files or `fixtures.ts` to players.

## Releasing

Every pull request merged into `main` is a release. The Release workflow tags the merge commit `v<n>`, one more than the highest `v<n>` tag so far. Nothing is committed back to `main`, so the git tags hold the real version and `version` in `package.json` stays `1.0.0`. Do not push `v*` tags by hand.

Direct pushes to `main` are forbidden: every change goes through a pull request.

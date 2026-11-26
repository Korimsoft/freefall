# freefall
A casual arcade game

## Running

```
pnpm install
pnpm start
```

`pnpm start` builds the game into `dist/` and serves it at http://localhost:8080. To only build, run `pnpm build`.

While working on the game, run `pnpm dev` instead: it serves the game at http://localhost:5173 and updates the page every time you save a file.

## Playing

Steer the falling ball with the left and right arrow keys. On a phone or tablet (a device whose main pointer is a finger), two buttons in the bottom corners of the screen do the same while held. When both are held, lifting one sends the ball the way of the one still held.

## Testing

```
pnpm test
pnpm typecheck
```

The game and its tests are written in TypeScript; the tests are Jest tests next to the code they test (`app/src/ball.test.ts` tests `app/src/ball.ts`). The build bundles, with Vite, what `app/index.html` loads: `app/src/game.ts` with the code it imports, and the stylesheet. The `*.test.ts` files and `fixtures.ts` are not part of the game's imports, so players never get them.

## Releasing

Every pull request merged into `main` is a release. The Release workflow builds the game, tags the merge commit `v<n>`, one more than the highest `v<n>` tag so far, and makes a GitHub release `v<n>` with the built game as `freefall-v<n>.zip`. Nothing is committed back to `main`, so the git tags hold the real version and `version` in `package.json` stays `1.0.0`. Do not push `v*` tags by hand.

Direct pushes to `main` are forbidden: every change goes through a pull request.

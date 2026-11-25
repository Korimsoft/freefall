import { Ball } from './ball.js';
import { Renderer } from './renderer.js';
import { givenABall, givenACanvasDrawingInto, givenAFakeContext, givenAPlatform, Platform } from './fixtures';

const BOARD_300_BY_500 = { width: 300, height: 500 };

function moveTimes(ball: Ball, times: number, platforms: Platform[]): void {
    for (let move = 0; move < times; move++) {
        ball.move(platforms);
    }
}

describe('Ball', () => {
    it('starts where it is put', () => {
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });

        expect(ball).toMatchObject({ x: 150, y: 30, radius: 10 });
    });

    it('starts at rest: its first move only drops it by gravity, 0.1 px', () => {
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });

        ball.move([]);

        expect(ball.x).toBe(150);
        expect(ball.y).toBeCloseTo(30.1);
    });

    it('goes back to where it started, at rest, when asked', () => {
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        ball.goRight();
        moveTimes(ball, 5, []);

        ball.toInitialPosition();
        expect(ball).toMatchObject({ x: 150, y: 30 });

        ball.move([]);
        expect(ball.x).toBe(150);
        expect(ball.y).toBeCloseTo(30.1);
    });

    it('moves 5 px sideways per move while going left or right, and stops when told', () => {
        const ball = givenABall({ x: 150, y: 100, radius: 10, board: BOARD_300_BY_500 });

        ball.goRight();
        ball.move([]);
        expect(ball.x).toBe(155);

        ball.goLeft();
        moveTimes(ball, 2, []);
        expect(ball.x).toBe(145);

        ball.stopHorizontal();
        ball.move([]);
        expect(ball.x).toBe(145);
    });

    it('falls 0.1 px further on each move than on the move before', () => {
        const ball = givenABall({ x: 150, y: 100, radius: 10, board: BOARD_300_BY_500 });

        ball.move([]);
        expect(ball.y).toBeCloseTo(100.1);
        ball.move([]);
        expect(ball.y).toBeCloseTo(100.3);
        ball.move([]);
        expect(ball.y).toBeCloseTo(100.6);
    });

    it('hits a trap when its top edge goes above the board', () => {
        // top edge at 5.1 − 10 < 0 after one move
        const ball = givenABall({ x: 150, y: 5, radius: 10, board: BOARD_300_BY_500 });
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.hitsTrap).toHaveBeenCalledTimes(1);
        expect(ball.y).toBeCloseTo(5.1);
    });

    it('stops with its bottom edge on the bottom of the board and hits a trap there', () => {
        const ball = givenABall({ x: 150, y: 495, radius: 10, board: BOARD_300_BY_500 });
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.y).toBe(500 - 10);
        expect(ball.hitsTrap).toHaveBeenCalledTimes(1);
    });

    it('hits no trap in the middle of the board', () => {
        const ball = givenABall({ x: 150, y: 250, radius: 10, board: BOARD_300_BY_500 });
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.hitsTrap).not.toHaveBeenCalled();
    });

    it('cannot leave the board through its sides', () => {
        const leftBall = givenABall({ x: 12, y: 100, radius: 10, board: BOARD_300_BY_500 });
        leftBall.goLeft();
        leftBall.move([]);

        const rightBall = givenABall({ x: 288, y: 100, radius: 10, board: BOARD_300_BY_500 });
        rightBall.goRight();
        rightBall.move([]);

        expect(leftBall.x).toBe(10);
        expect(rightBall.x).toBe(300 - 10);
    });

    it('lands on a platform and bounces up with the platform speed and a quarter of its own', () => {
        const platform = givenAPlatform({ x: 100, y: 100, speed: -3 });
        const ball = givenABall({ x: 150, y: 80, radius: 10, board: BOARD_300_BY_500 });

        // From rest it falls 0.1·n(n+1)/2 px in n moves: 9.1 px after 13 moves
        // (bottom edge at 99.1, above the platform), 10.5 px after 14 (on it).
        moveTimes(ball, 13, [platform]);
        expect(ball.y).toBeCloseTo(89.1);
        ball.move([platform]);
        expect(ball.y).toBe(90);

        // It was falling 1.4 px a move; it now rises 3 + 1.4 / 4 = 3.35 px,
        // less 0.1 of gravity.
        ball.move([]);
        expect(ball.y).toBeCloseTo(90 - 3.25);
    });

    it('is stopped by the left side of a platform while going right', () => {
        const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
        const ball = givenABall({ x: 90, y: 105, radius: 10, board: BOARD_300_BY_500 });
        ball.goRight();

        ball.move([platform]);

        expect(ball.x).toBe(100 - 10);
    });

    it('is stopped by the right side of a platform while going left', () => {
        const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
        const ball = givenABall({ x: 210, y: 105, radius: 10, board: BOARD_300_BY_500 });
        ball.goLeft();

        ball.move([platform]);

        // right edge of the 100 px wide platform, plus the radius
        expect(ball.x).toBe(200 + 10);
    });

    it('draws itself with the renderer', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });

        ball.render(renderer);

        expect(ctx.arc).toHaveBeenCalledWith(150, 30, 10, 0, 2 * Math.PI);
    });
});

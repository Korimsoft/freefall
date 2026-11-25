import { Ball } from './ball.js';
import { Renderer } from './renderer.js';
import { givenACanvasDrawingInto, givenAFakeContext, givenAPlatform, givenBoardDimensions } from './fixtures';

const RADIUS = 10;

function givenABall(x = 150, y = 100): Ball {
    return new Ball(x, y, RADIUS, givenBoardDimensions());
}

describe('Ball', () => {
    it('starts at its initial position without moving', () => {
        const ball = givenABall(150, 30);

        expect(ball).toMatchObject({ x: 150, y: 30, radius: RADIUS, speedX: 0, speedY: 0 });
    });

    it('goes back to its initial position and stops when asked', () => {
        const ball = givenABall(150, 30);
        ball.goRight();
        ball.move([]);
        ball.move([]);

        ball.toInitialPosition();

        expect(ball).toMatchObject({ x: 150, y: 30, speedX: 0, speedY: 0 });
    });

    it('moves 5 px sideways per move while going left or right, and stops when told', () => {
        const ball = givenABall(150);

        ball.goRight();
        ball.move([]);
        expect(ball.x).toBe(155);

        ball.goLeft();
        ball.move([]);
        ball.move([]);
        expect(ball.x).toBe(145);

        ball.stopHorizontal();
        ball.move([]);
        expect(ball.x).toBe(145);
    });

    it('falls faster each move, gaining 0.1 of downward speed per move', () => {
        const ball = givenABall(150, 100);

        ball.move([]);
        expect(ball.speedY).toBeCloseTo(0.1);
        expect(ball.y).toBeCloseTo(100.1);

        ball.move([]);
        expect(ball.speedY).toBeCloseTo(0.2);
        expect(ball.y).toBeCloseTo(100.3);
    });

    it('hits a trap when it touches the top of the board', () => {
        const ball = givenABall(150, 5);
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.hitsTrap).toHaveBeenCalledTimes(1);
        expect(ball.y).toBeCloseTo(5.1);
    });

    it('stops at the bottom of the board and hits a trap there', () => {
        const ball = givenABall(150, 495);
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.y).toBe(490);
        expect(ball.hitsTrap).toHaveBeenCalledTimes(1);
    });

    it('hits no trap in the middle of the board', () => {
        const ball = givenABall(150, 250);
        ball.hitsTrap = jest.fn();

        ball.move([]);

        expect(ball.hitsTrap).not.toHaveBeenCalled();
    });

    it('cannot leave the board through its sides', () => {
        const leftBall = givenABall(12);
        leftBall.goLeft();
        leftBall.move([]);

        const rightBall = givenABall(288);
        rightBall.goRight();
        rightBall.move([]);

        expect(leftBall.x).toBe(10);
        expect(rightBall.x).toBe(290);
    });

    it('lands on a platform and bounces off it with the platform speed and a quarter of its own', () => {
        const platform = givenAPlatform({ x: 100, y: 100, speed: -3 });
        const ball = givenABall(150, 88);
        ball.speedY = 4;

        ball.move([platform]);

        expect(ball.y).toBe(90);
        expect(ball.speedY).toBeCloseTo(-3 - 4.1 * 0.25);
    });

    it('is stopped by the left side of a platform while going right', () => {
        const platform = givenAPlatform({ x: 100, y: 100 });
        const ball = givenABall(90, 105);
        ball.goRight();

        ball.move([platform]);

        expect(ball.x).toBe(90);
    });

    it('is stopped by the right side of a platform while going left', () => {
        const platform = givenAPlatform({ x: 100, y: 100 });
        const ball = givenABall(210, 105);
        ball.goLeft();

        ball.move([platform]);

        expect(ball.x).toBe(210);
    });

    it('draws itself with the renderer', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall(150, 30);
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball, platforms: [] });

        ball.render(renderer);

        expect(ctx.arc).toHaveBeenCalledWith(150, 30, RADIUS, 0, 2 * Math.PI);
    });
});

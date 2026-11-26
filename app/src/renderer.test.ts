import { Renderer } from './renderer';
import { givenABall, givenACanvasDrawingInto, givenAFakeContext, givenAPlatform } from './fixtures';

const BOARD_300_BY_500 = { width: 300, height: 500 };

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('Renderer', () => {
    it('draws a frame: clears the canvas, draws the ball, then every platform over it', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const platforms = [givenAPlatform({ x: 0, y: 200, speed: 0 }), givenAPlatform({ x: 150, y: 400, speed: 0 })];
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms });

        renderer.draw();

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 500);
        expect(ctx.arc).toHaveBeenCalledWith(150, 30, 10, 0, 2 * Math.PI);
        expect(ctx.rect.mock.calls).toEqual([[0, 200, 100, 10], [150, 400, 100, 10]]);
        expect(ctx.clearRect.mock.invocationCallOrder[0]).toBeLessThan(ctx.arc.mock.invocationCallOrder[0]);
        expect(ctx.arc.mock.invocationCallOrder[0]).toBeLessThan(ctx.rect.mock.invocationCallOrder[0]);
    });

    it('draws the board in board units on a canvas with more pixels than units', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const canvas = givenACanvasDrawingInto(ctx, BOARD_300_BY_500);
        canvas.width = 750;
        canvas.height = 1250;
        const renderer = new Renderer(canvas, { ball, platforms: [] });

        renderer.draw();

        expect(ctx.setTransform).toHaveBeenCalledWith(2.5, 0, 0, 2.5, 0, 0);
        expect(ctx.setTransform.mock.invocationCallOrder[0]).toBeLessThan(ctx.clearRect.mock.invocationCallOrder[0]);
        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 500);
        expect(ctx.arc).toHaveBeenCalledWith(150, 30, 10, 0, 2 * Math.PI);
    });

    it('keeps drawing a frame per animation frame until stopped', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });

        renderer.draw();
        jest.advanceTimersToNextFrame();
        jest.advanceTimersToNextFrame();
        expect(ctx.clearRect).toHaveBeenCalledTimes(3);

        renderer.stop();
        jest.advanceTimersToNextFrame();
        expect(ctx.clearRect).toHaveBeenCalledTimes(3);
    });

    it('draws what the ball and platforms look like at the time of each frame', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });
        renderer.draw();

        ball.x = 170;
        jest.advanceTimersToNextFrame();

        expect(ctx.arc).toHaveBeenLastCalledWith(170, 30, 10, 0, 2 * Math.PI);
    });

    it('draws the ball as a white-outlined circle lit from its upper left', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });

        renderer.drawBall(ball);

        // lit from half the radius up and left of the centre
        expect(ctx.createRadialGradient).toHaveBeenCalledWith(150 - 5, 30 - 5, 1, 150 - 5, 30 - 5, 10);
        expect(ctx.gradient.addColorStop.mock.calls).toEqual([
            [0, 'rgba(255, 255, 255, 0.75)'],
            [1, 'rgba(200, 200, 200, 0.5)'],
        ]);
        expect(ctx.fillStyle).toBe(ctx.gradient);
        expect(ctx.strokeStyle).toBe('#FFFFFF');
        expect(ctx.arc).toHaveBeenCalledWith(150, 30, 10, 0, 2 * Math.PI);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });

    it('draws a platform as a white-outlined, see-through rectangle', () => {
        const ctx = givenAFakeContext();
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });

        renderer.drawPlatform(givenAPlatform({ x: 100, y: 200, speed: 0 }));

        expect(ctx.fillStyle).toBe('rgba(0, 0, 0, 0)');
        expect(ctx.strokeStyle).toBe('#FFFFFF');
        expect(ctx.rect).toHaveBeenCalledWith(100, 200, 100, 10);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });
});

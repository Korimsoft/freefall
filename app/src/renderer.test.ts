import { Ball } from './ball.js';
import { Renderer } from './renderer.js';
import { givenACanvasDrawingInto, givenAFakeContext, givenAPlatform, givenBoardDimensions } from './fixtures';

function givenABall(): Ball {
    return new Ball(150, 30, 10, givenBoardDimensions());
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('Renderer', () => {
    it('draws a frame: clears the board, draws the ball, then every platform, and asks for the next frame', () => {
        jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
        const ctx = givenAFakeContext();
        const platforms = [givenAPlatform({ x: 0, y: 200 }), givenAPlatform({ x: 150, y: 400 })];
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball: givenABall(), platforms });

        renderer.draw();

        expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 500);
        expect(ctx.rect.mock.calls).toEqual([[0, 200, 100, 10], [150, 400, 100, 10]]);
        expect(ctx.clearRect.mock.invocationCallOrder[0]).toBeLessThan(ctx.arc.mock.invocationCallOrder[0]);
        expect(ctx.arc.mock.invocationCallOrder[0]).toBeLessThan(ctx.rect.mock.invocationCallOrder[0]);
        expect(window.requestAnimationFrame).toHaveBeenCalledWith(renderer.draw);
    });

    it('keeps drawing a frame per animation frame until stopped', () => {
        jest.useFakeTimers();
        const ctx = givenAFakeContext();
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball: givenABall(), platforms: [] });

        renderer.draw();
        jest.advanceTimersToNextFrame();
        jest.advanceTimersToNextFrame();
        expect(ctx.clearRect).toHaveBeenCalledTimes(3);

        renderer.stop();
        jest.advanceTimersToNextFrame();
        expect(ctx.clearRect).toHaveBeenCalledTimes(3);
        jest.useRealTimers();
    });

    it('cancels the requested frame when stopped', () => {
        jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(42);
        jest.spyOn(window, 'cancelAnimationFrame');
        const renderer = new Renderer(givenACanvasDrawingInto(givenAFakeContext()), { ball: givenABall(), platforms: [] });
        renderer.draw();

        renderer.stop();

        expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
    });

    it('draws the ball as a white-outlined circle lit from its upper left', () => {
        const ctx = givenAFakeContext();
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball: givenABall(), platforms: [] });

        renderer.drawBall(givenABall());

        expect(ctx.createRadialGradient).toHaveBeenCalledWith(145, 25, 1, 145, 25, 10);
        expect(ctx.gradient.addColorStop.mock.calls).toEqual([
            [0, 'rgba(255, 255, 255, 0.75)'],
            [1, 'rgba(200, 200, 200, 0.5)'],
        ]);
        expect(ctx.fillStyle).toBe(ctx.gradient);
        expect(ctx.strokeStyle).toBe('#FFFFFF');
        expect(ctx.arc).toHaveBeenCalledWith(150, 30, 10, 0, 2 * Math.PI);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
    });

    it('draws a platform as a white-outlined, see-through rectangle', () => {
        const ctx = givenAFakeContext();
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball: givenABall(), platforms: [] });

        renderer.drawPlatform(givenAPlatform({ x: 100, y: 200 }));

        expect(ctx.fillStyle).toBe('rgba(0, 0, 0, 0)');
        expect(ctx.strokeStyle).toBe('#FFFFFF');
        expect(ctx.rect).toHaveBeenCalledWith(100, 200, 100, 10);
        expect(ctx.stroke).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
    });
});

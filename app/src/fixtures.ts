import { Ball } from './ball';
import { PlatformGenerator } from './platform';

export type Size = {
    width: number,
    height: number,
};

export type Platform = PlatformGenerator['lastPlatform'];

export type FakeGradient = {
    addColorStop: jest.Mock,
};

export type FakeContext = {
    clearRect: jest.Mock,
    createRadialGradient: jest.Mock,
    save: jest.Mock,
    restore: jest.Mock,
    beginPath: jest.Mock,
    arc: jest.Mock,
    rect: jest.Mock,
    stroke: jest.Mock,
    fill: jest.Mock,
    setTransform: jest.Mock,
    fillStyle: unknown,
    strokeStyle: unknown,
    gradient: FakeGradient,
};

export function givenABall(ball: { x: number, y: number, radius: number, board: Size }): Ball {
    return new Ball(ball.x, ball.y, ball.radius, ball.board);
}

// Platform is not exported yet, so this takes the motionless placeholder platform
// that a new generator holds. The TypeScript migration exports Platform and
// replaces this with `new Platform(x, y, speed)`.
export function givenAPlatform(platform: { x: number, y: number, speed: number }): Platform {
    const placeholder = new PlatformGenerator({ width: 0, height: 0 }).lastPlatform;
    placeholder.x = platform.x;
    placeholder.y = platform.y;
    placeholder.speed = platform.speed;
    return placeholder;
}

export function givenAFakeContext(): FakeContext {
    const gradient = { addColorStop: jest.fn() };
    return {
        clearRect: jest.fn(),
        createRadialGradient: jest.fn(() => gradient),
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        rect: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        setTransform: jest.fn(),
        fillStyle: undefined,
        strokeStyle: undefined,
        gradient,
    };
}

// jsdom has neither layout nor a 2D context, so the canvas gets the size a browser
// would lay it out at and a context that records the drawing calls.
export function givenACanvasDrawingInto(
    ctx: FakeContext,
    layoutSize: Size,
    canvas: HTMLCanvasElement = document.createElement('canvas'),
): HTMLCanvasElement {
    Object.defineProperty(canvas, 'offsetWidth', { value: layoutSize.width });
    Object.defineProperty(canvas, 'offsetHeight', { value: layoutSize.height });
    jest.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    return canvas;
}

// Math.random gives these numbers in order and then keeps giving the last one.
export function givenRandomNumbers(...numbers: number[]): void {
    const random = jest.spyOn(Math, 'random');
    for (const number of numbers) {
        random.mockReturnValueOnce(number);
    }
    random.mockReturnValue(numbers[numbers.length - 1]);
}

export function givenGameMarkup(): string {
    return `
        <div class="center">
            <div class="title">Freefall</div>
            <div class="game">
                <div class="board" id="board">
                    <canvas id="canvas" tabindex="0"></canvas>
                    <game-hud id="hud"></game-hud>
                    <game-menu id="menu"></game-menu>
                </div>
            </div>
        </div>
        <game-controls id="controls"></game-controls>`;
}

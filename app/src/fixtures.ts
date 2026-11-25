import { PlatformGenerator } from './platform.js';

export type BoardDimensions = {
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
    fillStyle: unknown,
    strokeStyle: unknown,
    gradient: FakeGradient,
};

export const BOARD_WIDTH = 300;
export const BOARD_HEIGHT = 500;

export function givenBoardDimensions(): BoardDimensions {
    return { width: BOARD_WIDTH, height: BOARD_HEIGHT };
}

// The generator's initial platform is a real, motionless Platform, which avoids
// going through Math.random just to get one.
export function givenAPlatform(position: { x: number, y: number, speed?: number }): Platform {
    const platform = new PlatformGenerator(givenBoardDimensions()).lastPlatform;
    platform.x = position.x;
    platform.y = position.y;
    platform.speed = position.speed ?? 0;
    return platform;
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
        fillStyle: undefined,
        strokeStyle: undefined,
        gradient,
    };
}

// jsdom has neither layout nor a 2D context, so the canvas gets the board's size
// and a context that records the drawing calls.
export function givenACanvasDrawingInto(ctx: FakeContext, canvas = document.createElement('canvas')): HTMLCanvasElement {
    Object.defineProperty(canvas, 'offsetWidth', { value: BOARD_WIDTH });
    Object.defineProperty(canvas, 'offsetHeight', { value: BOARD_HEIGHT });
    jest.spyOn(canvas, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
    return canvas;
}

export function givenGameMarkup(): string {
    return `
        <div class="center">
            <div class="title">Freefall</div>
            <div class="game">
                <div id="game-stats" class="game-stats">
                    <span id="score" class="left">Score: <span id="score-counter">0</span></span>
                    <span id="lives" class="right"><span id="lives-counter"></span></span>
                </div>
                <canvas id="canvas" tabindex="0"></canvas>
            </div>
            <div class="game-controls" id="game-controls">
                <button id="start" class="game-control">Start</button>
                <button id="about" class="game-control">About</button>
            </div>
        </div>`;
}

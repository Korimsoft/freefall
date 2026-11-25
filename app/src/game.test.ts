import {
    FakeContext,
    givenACanvasDrawingInto,
    givenAFakeContext,
    givenGameMarkup,
    givenRandomNumbers,
    Size,
} from './fixtures';

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const GAME_TICK_MS = 20;
const PLATFORM_TICK_MS = 200;
// Game ticks (20 ms) and animation frames (16 ms) line up again every 80 ms,
// so between two frames 80 ms apart exactly 4 game ticks have run.
const FOUR_TICKS_BETWEEN_FRAMES_MS = 80;
// The game sets its canvas to 300 × 500 px; a browser lays it out at that size.
const CANVAS_300_BY_500 = { width: 300, height: 500 };
// The first random number of each platform tick is the chance roll: 0.99 is
// never below 0.5, so no platform ever appears.
const NO_PLATFORMS = [0.99];
// The game puts the ball, radius 10, at the middle of the board (300 / 2) and
// three radii down, so it starts at (150, 30) and touches the bottom of the
// 500 px board below y = 490. From rest it falls 0.1·n(n+1)/2 px in n ticks:
// 456 px after 95 ticks (y = 486), 465.6 px after 96 (past 490).
const TICKS_TO_FALL_TO_THE_BOTTOM = 96;
const ONE_FALL_TO_THE_BOTTOM_MS = TICKS_TO_FALL_TO_THE_BOTTOM * GAME_TICK_MS;
// A platform is made at y = 500 and rises 3 px per tick: after 167 ticks it is
// at 500 − 3 · 167 = −1, over the top.
const TICKS_FOR_A_PLATFORM_TO_RISE_OVER_THE_TOP = 167;

type GamePage = {
    ctx: FakeContext,
    canvas: HTMLCanvasElement,
    startButton: HTMLButtonElement,
    lives: () => string,
    score: () => string,
    drawnBall: () => { x: number, y: number },
};

function elementById<T extends HTMLElement>(id: string, type: new () => T): T {
    const element = document.getElementById(id);
    if (!(element instanceof type)) {
        throw new Error(`The page has no ${type.name} with id "${id}"`);
    }
    return element;
}

// game.js sets itself up on the page as soon as it is imported, so every test
// imports a fresh copy into a fresh page.
async function givenTheGamePage(page: { canvasLayout: Size, randomNumbers: number[] }): Promise<GamePage> {
    givenRandomNumbers(...page.randomNumbers);
    document.body.innerHTML = givenGameMarkup();
    const ctx = givenAFakeContext();
    const canvas = givenACanvasDrawingInto(ctx, page.canvasLayout, elementById('canvas', HTMLCanvasElement));
    await jest.isolateModulesAsync(async () => {
        await import('./game.js');
    });

    return {
        ctx,
        canvas,
        startButton: elementById('start', HTMLButtonElement),
        lives: () => elementById('lives-counter', HTMLElement).innerHTML,
        score: () => elementById('score-counter', HTMLElement).innerHTML,
        drawnBall: () => {
            const [x, y] = ctx.arc.mock.lastCall ?? [];
            return { x, y };
        },
    };
}

function press(keyCode: number): void {
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode }));
}

function release(keyCode: number): void {
    window.dispatchEvent(new KeyboardEvent('keyup', { keyCode }));
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('game page before the start', () => {
    it('sizes the canvas to 300 × 500 px', async () => {
        const { canvas } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        expect(canvas.getAttribute('width')).toBe('300px');
        expect(canvas.getAttribute('height')).toBe('500px');
    });

    it('draws nothing and runs no game', async () => {
        const { ctx, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        jest.advanceTimersByTime(1000);

        expect(ctx.arc).not.toHaveBeenCalled();
        expect(score()).toBe('0');
    });
});

describe('starting a game', () => {
    it('disables Start, focuses the canvas and shows 3 lives and a score of 0', async () => {
        const { startButton, canvas, lives, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        startButton.click();

        expect(startButton.disabled).toBe(true);
        expect(document.activeElement).toBe(canvas);
        expect(lives()).toBe('3');
        expect(score()).toBe('0');
    });

    it('draws the ball at the top middle of the board', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        startButton.click();

        expect(drawnBall()).toEqual({ x: 150, y: 30 });
    });
});

describe('a running game', () => {
    it('lets the ball fall and scores the whole pixels it has fallen', async () => {
        const { startButton, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();

        jest.advanceTimersByTime(10 * GAME_TICK_MS);

        // 0.1 + 0.2 + … + 1.0 = 5.5 px after 10 ticks
        expect(score()).toBe('5');
    });

    it('moves the ball 5 px right per tick while the right arrow is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        press(KEY_RIGHT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(20);
    });

    it('moves the ball 5 px left per tick while the left arrow is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        press(KEY_LEFT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(-20);
    });

    it('stops the ball sideways when the key is released', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        press(KEY_RIGHT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        release(KEY_RIGHT);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(before);
    });

    it('ignores other keys, leaving the ball in the middle of the board', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();

        press(KEY_UP);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(150);
    });

    it('costs a life when the ball reaches the bottom and puts the ball back at the top', async () => {
        const { startButton, lives, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();

        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS - GAME_TICK_MS);
        expect(lives()).toBe('3');

        jest.advanceTimersByTime(GAME_TICK_MS);
        expect(lives()).toBe('2');
        jest.advanceTimersToNextFrame();
        expect(drawnBall()).toEqual({ x: 150, y: 30 });
    });

    it('keeps the score while the ball is put back at the top', async () => {
        const { startButton, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();

        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS - GAME_TICK_MS);
        const scoreBeforeLifeLost = score();
        jest.advanceTimersByTime(GAME_TICK_MS);

        // 456 px fallen in 95 ticks; adding up 0.1 steps may land just below 456
        expect(Number(scoreBeforeLifeLost)).toBeGreaterThanOrEqual(455);
        expect(Number(scoreBeforeLifeLost)).toBeLessThanOrEqual(456);
        expect(score()).toBe(scoreBeforeLifeLost);
    });
});

describe('game over', () => {
    async function givenAGameAfterThreeFalls(): Promise<GamePage> {
        const page = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        page.startButton.click();
        jest.advanceTimersByTime(3 * ONE_FALL_TO_THE_BOTTOM_MS);
        return page;
    }

    it('comes after the third life is lost, with a "You died" alert', async () => {
        const { lives } = await givenAGameAfterThreeFalls();

        expect(lives()).toBe('0');
        expect(window.alert).toHaveBeenCalledTimes(1);
        expect(window.alert).toHaveBeenCalledWith('You died');
    });

    it('enables Start again', async () => {
        const { startButton } = await givenAGameAfterThreeFalls();

        expect(startButton.disabled).toBe(false);
    });

    it('stops the game and the drawing', async () => {
        const { ctx, score } = await givenAGameAfterThreeFalls();
        const scoreAtGameOver = score();
        const framesAtGameOver = ctx.clearRect.mock.calls.length;

        jest.advanceTimersByTime(2000);

        expect(score()).toBe(scoreAtGameOver);
        expect(ctx.clearRect).toHaveBeenCalledTimes(framesAtGameOver);
        expect(window.alert).toHaveBeenCalledTimes(1);
    });

    it('lets a new game start with 3 lives', async () => {
        const { startButton, lives } = await givenAGameAfterThreeFalls();

        startButton.click();

        expect(lives()).toBe('3');
        expect(startButton.disabled).toBe(true);
    });
});

describe('platforms in a running game', () => {
    // The first platform tick rolls 0 (below 0.5: make a platform), then a place
    // roll r puts it at x = r · (300 − 100); every later chance roll is 0.99.
    const ONE_PLATFORM_AT_X_50 = [0, 0.25, 0.99];
    const ONE_PLATFORM_AT_X_100_UNDER_THE_BALL = [0, 0.5, 0.99];

    it('appears at the bottom on a platform tick (every 200 ms) and is drawn', async () => {
        const { startButton, ctx } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: ONE_PLATFORM_AT_X_50 });
        startButton.click();

        jest.advanceTimersByTime(PLATFORM_TICK_MS - 10);
        expect(ctx.rect).not.toHaveBeenCalled();

        // to the first animation frame after the platform tick, at 208 ms
        jest.advanceTimersByTime(18);
        const [x, y, width, height] = ctx.rect.mock.lastCall ?? [];
        expect({ x, width, height }).toEqual({ x: 50, width: 100, height: 10 });
        // made at 500 px; it may already have risen one tick by the next frame
        expect(y).toBeGreaterThanOrEqual(497);
        expect(y).toBeLessThanOrEqual(500);
    });

    it('rises 3 px per game tick', async () => {
        const { startButton, ctx } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: ONE_PLATFORM_AT_X_50 });
        startButton.click();
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS * 3);
        const before = ctx.rect.mock.lastCall?.[1];

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(ctx.rect.mock.lastCall?.[1]).toBe(before - 12);
    });

    it('is gone once it has risen over the top', async () => {
        const { startButton, ctx } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: ONE_PLATFORM_AT_X_50 });
        startButton.click();
        jest.advanceTimersByTime(PLATFORM_TICK_MS + TICKS_FOR_A_PLATFORM_TO_RISE_OVER_THE_TOP * GAME_TICK_MS);

        ctx.rect.mockClear();
        jest.advanceTimersToNextFrame();

        expect(ctx.rect).not.toHaveBeenCalled();
    });

    it('catches the falling ball, which then stops scoring', async () => {
        const { startButton, lives, score } = await givenTheGamePage({
            canvasLayout: CANVAS_300_BY_500,
            randomNumbers: ONE_PLATFORM_AT_X_100_UNDER_THE_BALL,
        });
        startButton.click();
        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS);
        const scoreOnThePlatform = score();

        // without the platform, the ball would have hit the bottom by now
        jest.advanceTimersByTime(500);

        expect(lives()).toBe('3');
        expect(score()).toBe(scoreOnThePlatform);
    });

    it('carries the ball up over the top, which costs a life', async () => {
        const { startButton, lives } = await givenTheGamePage({
            canvasLayout: CANVAS_300_BY_500,
            randomNumbers: ONE_PLATFORM_AT_X_100_UNDER_THE_BALL,
        });
        startButton.click();

        // caught: no life lost by the time the ball would have hit the bottom
        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS);
        expect(lives()).toBe('3');

        jest.advanceTimersByTime(
            PLATFORM_TICK_MS + TICKS_FOR_A_PLATFORM_TO_RISE_OVER_THE_TOP * GAME_TICK_MS - ONE_FALL_TO_THE_BOTTOM_MS,
        );
        expect(lives()).toBe('2');
    });
});

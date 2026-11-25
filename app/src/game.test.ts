import { FakeContext, givenACanvasDrawingInto, givenAFakeContext, givenGameMarkup } from './fixtures';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const GAME_TICK_MS = 20;
// Game ticks (20 ms) and animation frames (16 ms) line up again every 80 ms,
// so between two frames 80 ms apart exactly 4 game ticks have run.
const FOUR_TICKS_BETWEEN_FRAMES_MS = 80;
const ONE_FALL_TO_THE_BOTTOM_MS = 96 * GAME_TICK_MS;

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
async function givenTheGamePage(): Promise<GamePage> {
    document.body.innerHTML = givenGameMarkup();
    const ctx = givenAFakeContext();
    const canvas = givenACanvasDrawingInto(ctx, elementById('canvas', HTMLCanvasElement));
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
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('game page before the start', () => {
    it('sizes the canvas to 300 × 500 px', async () => {
        const { canvas } = await givenTheGamePage();

        expect(canvas.getAttribute('width')).toBe('300px');
        expect(canvas.getAttribute('height')).toBe('500px');
    });

    it('draws nothing and runs no game', async () => {
        const { ctx, score } = await givenTheGamePage();

        jest.advanceTimersByTime(1000);

        expect(ctx.arc).not.toHaveBeenCalled();
        expect(score()).toBe('0');
    });
});

describe('starting a game', () => {
    it('disables Start, focuses the canvas and shows 3 lives and a score of 0', async () => {
        const { startButton, canvas, lives, score } = await givenTheGamePage();

        startButton.click();

        expect(startButton.disabled).toBe(true);
        expect(document.activeElement).toBe(canvas);
        expect(lives()).toBe('3');
        expect(score()).toBe('0');
    });

    it('draws the ball at the top middle of the board', async () => {
        const { startButton, drawnBall } = await givenTheGamePage();

        startButton.click();

        expect(drawnBall()).toEqual({ x: 150, y: 30 });
    });
});

describe('a running game', () => {
    it('lets the ball fall and scores the whole pixels it has fallen', async () => {
        const { startButton, score } = await givenTheGamePage();
        startButton.click();

        jest.advanceTimersByTime(10 * GAME_TICK_MS);

        // 0.1 + 0.2 + … + 1.0 = 5.5 px after 10 ticks
        expect(score()).toBe('5');
    });

    it('moves the ball 5 px right per tick while the right arrow is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage();
        startButton.click();
        press(KEY_RIGHT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(20);
    });

    it('moves the ball 5 px left per tick while the left arrow is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage();
        startButton.click();
        press(KEY_LEFT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(-20);
    });

    it('stops the ball sideways when the key is released', async () => {
        const { startButton, drawnBall } = await givenTheGamePage();
        startButton.click();
        press(KEY_RIGHT);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        release(KEY_RIGHT);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(before);
    });

    it('ignores other keys', async () => {
        const { startButton, drawnBall } = await givenTheGamePage();
        startButton.click();

        press(38);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(150);
    });

    it('costs a life when the ball reaches the bottom and puts the ball back at the top', async () => {
        const { startButton, lives, drawnBall } = await givenTheGamePage();
        startButton.click();

        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS - GAME_TICK_MS);
        expect(lives()).toBe('3');

        jest.advanceTimersByTime(GAME_TICK_MS);
        expect(lives()).toBe('2');
        jest.advanceTimersToNextFrame();
        expect(drawnBall()).toEqual({ x: 150, y: 30 });
    });

    it('keeps the score while the ball is put back at the top', async () => {
        const { startButton, score } = await givenTheGamePage();
        startButton.click();

        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS - GAME_TICK_MS);
        const scoreBeforeLifeLost = score();
        jest.advanceTimersByTime(GAME_TICK_MS);

        expect(Number(scoreBeforeLifeLost)).toBeGreaterThan(450);
        expect(score()).toBe(scoreBeforeLifeLost);
    });
});

describe('game over', () => {
    async function givenAGameAfterThreeFalls(): Promise<GamePage> {
        const page = await givenTheGamePage();
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
    function givenOnePlatformAt(randomX: number): void {
        jest.mocked(Math.random)
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(randomX)
            .mockReturnValue(0.99);
    }

    it('appears at the bottom on a platform tick (every 200 ms) and is drawn', async () => {
        givenOnePlatformAt(0.25);
        const { startButton, ctx } = await givenTheGamePage();
        startButton.click();

        jest.advanceTimersByTime(190);
        expect(ctx.rect).not.toHaveBeenCalled();

        jest.advanceTimersByTime(18);
        const [x, y, width, height] = ctx.rect.mock.lastCall ?? [];
        expect({ x, width, height }).toEqual({ x: 50, width: 100, height: 10 });
        // made at 500 px; it may already have risen one tick by the next frame
        expect(y).toBeGreaterThanOrEqual(497);
        expect(y).toBeLessThanOrEqual(500);
    });

    it('rises 3 px per game tick', async () => {
        givenOnePlatformAt(0.25);
        const { startButton, ctx } = await givenTheGamePage();
        startButton.click();
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS * 3);
        const before = ctx.rect.mock.lastCall?.[1];

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(ctx.rect.mock.lastCall?.[1]).toBe(before - 12);
    });

    it('is gone once it has risen over the top', async () => {
        givenOnePlatformAt(0.25);
        const { startButton, ctx } = await givenTheGamePage();
        startButton.click();
        // made at 200 ms at 500 px, over the top after 167 more ticks
        jest.advanceTimersByTime(200 + 167 * GAME_TICK_MS);

        ctx.rect.mockClear();
        jest.advanceTimersToNextFrame();

        expect(ctx.rect).not.toHaveBeenCalled();
    });

    it('catches the falling ball, which then stops scoring', async () => {
        givenOnePlatformAt(0.5);
        const { startButton, lives, score } = await givenTheGamePage();
        startButton.click();
        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS);
        const scoreOnThePlatform = score();

        jest.advanceTimersByTime(500);

        expect(lives()).toBe('3');
        expect(score()).toBe(scoreOnThePlatform);
    });

    it('carries the ball up over the top, which costs a life', async () => {
        givenOnePlatformAt(0.5);
        const { startButton, lives } = await givenTheGamePage();
        startButton.click();

        jest.advanceTimersByTime(200 + 167 * GAME_TICK_MS);

        expect(lives()).toBe('2');
    });
});

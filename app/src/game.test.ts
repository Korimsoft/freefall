import { within } from '@testing-library/dom';
import {
    FakeContext,
    givenACanvasDrawingInto,
    givenAFakeContext,
    givenGameMarkup,
    givenRandomNumbers,
    Size,
} from './fixtures';
import { LIFE_BLINK_MS } from './hud';

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
    menu: HTMLElement,
    gameOverMessage: HTMLElement,
    finalScore: () => string,
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
        await import('./game');
    });

    const menu = elementById('menu', HTMLElement);
    const hud = elementById('hud', HTMLElement);
    // The Game Over message is hidden at first, and getByRole skips hidden elements.
    const gameOverMessage = within(menu).getByText('Game Over').parentElement as HTMLElement;

    return {
        ctx,
        canvas,
        startButton: within(menu).getByRole('button', { name: 'Start' }),
        menu,
        gameOverMessage,
        finalScore: () => within(gameOverMessage).getByText(/Score:/).textContent?.replace('Score: ', '') ?? '',
        lives: () => String(hud.querySelectorAll('.life:not(.life-lost)').length),
        score: () => within(hud).getByText(/Score:/).textContent?.replace('Score: ', '') ?? '',
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

function touchButton(name: 'Left' | 'Right'): HTMLElement {
    return within(elementById('controls', HTMLElement)).getByRole('button', { name });
}

function hold(name: 'Left' | 'Right', pointerId = 1): void {
    touchButton(name).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId }));
}

function lift(name: 'Left' | 'Right', pointerId = 1): void {
    touchButton(name).dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId }));
}

beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('game page before the start', () => {
    it('gives the canvas 300 × 500 pixels on a screen without touch controls', async () => {
        const { canvas } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        expect(canvas.width).toBe(300);
        expect(canvas.height).toBe(500);
    });

    it('shows the menu over the board, without the Game Over message', async () => {
        const { menu, gameOverMessage } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        expect(menu.hidden).toBe(false);
        expect(gameOverMessage.hidden).toBe(true);
    });

    it('draws nothing and runs no game', async () => {
        const { ctx, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        jest.advanceTimersByTime(1000);

        expect(ctx.arc).not.toHaveBeenCalled();
        expect(score()).toBe('0');
    });
});

describe('starting a game', () => {
    it('hides the menu, focuses the canvas and shows 3 lives and a score of 0', async () => {
        const { startButton, menu, canvas, lives, score } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });

        startButton.click();

        expect(menu.hidden).toBe(true);
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

    it('blinks the leftmost life ball when a life is lost and then takes it away', async () => {
        const { startButton } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        const lifeBalls = () => Array.from(document.querySelectorAll('#hud .life'))
            .map(ball => ball.classList.contains('life-lost') ? 'blinking' : 'ball');
        startButton.click();
        expect(lifeBalls()).toEqual(['ball', 'ball', 'ball']);

        jest.advanceTimersByTime(ONE_FALL_TO_THE_BOTTOM_MS);
        expect(lifeBalls()).toEqual(['blinking', 'ball', 'ball']);

        jest.advanceTimersByTime(LIFE_BLINK_MS);
        expect(lifeBalls()).toEqual(['ball', 'ball']);
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

describe('touch controls in a running game', () => {
    it('move the ball 5 px right per tick while Right is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        hold('Right');
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(20);
    });

    it('move the ball 5 px left per tick while Left is held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        hold('Left');
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(-20);
    });

    it('stop the ball sideways when the button is lifted', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        hold('Right');
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        lift('Right');
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(before);
    });

    it('send the ball left again when Right is lifted while Left is still held', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        startButton.click();
        hold('Left', 1);
        hold('Right', 2);
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);
        lift('Right', 2);
        const before = drawnBall().x;

        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x - before).toBe(-20);
    });

    it('do nothing before the game is started', async () => {
        const { startButton, drawnBall } = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        hold('Right');

        startButton.click();
        jest.advanceTimersByTime(FOUR_TICKS_BETWEEN_FRAMES_MS);

        expect(drawnBall().x).toBe(150);
    });
});

describe('game over', () => {
    async function givenAGameAfterThreeFalls(): Promise<GamePage> {
        const page = await givenTheGamePage({ canvasLayout: CANVAS_300_BY_500, randomNumbers: NO_PLATFORMS });
        page.startButton.click();
        jest.advanceTimersByTime(3 * ONE_FALL_TO_THE_BOTTOM_MS);
        return page;
    }

    it('comes after the third life is lost and shows the menu again with "Game Over" and the final score', async () => {
        const { lives, score, menu, gameOverMessage, finalScore } = await givenAGameAfterThreeFalls();

        expect(lives()).toBe('0');
        expect(menu.hidden).toBe(false);
        expect(gameOverMessage.hidden).toBe(false);
        expect(gameOverMessage.textContent).toContain('Game Over');
        // three falls of 456 px each
        expect(Number(finalScore())).toBeGreaterThan(1300);
        expect(finalScore()).toBe(score());
    });

    it('shows the same final score as the counter when the last life is lost at the top', async () => {
        // every platform tick makes a platform at x = 100, under the ball, so the
        // ball is always carried up over the top
        const platformsUnderTheBall = Array.from({ length: 200 }, () => [0, 0.5]).flat();
        const { startButton, menu, score, finalScore } = await givenTheGamePage({
            canvasLayout: CANVAS_300_BY_500,
            randomNumbers: platformsUnderTheBall,
        });
        startButton.click();

        jest.advanceTimersByTime(30000);

        expect(menu.hidden).toBe(false);
        expect(finalScore()).toBe(score());
    });

    it('stops the game and the drawing', async () => {
        const { ctx, score } = await givenAGameAfterThreeFalls();
        const scoreAtGameOver = score();
        const framesAtGameOver = ctx.clearRect.mock.calls.length;

        jest.advanceTimersByTime(2000);

        expect(score()).toBe(scoreAtGameOver);
        expect(ctx.clearRect).toHaveBeenCalledTimes(framesAtGameOver);
    });

    it('lets a new game start with 3 lives and hides the menu again', async () => {
        const { startButton, menu, lives } = await givenAGameAfterThreeFalls();

        startButton.click();

        expect(lives()).toBe('3');
        expect(menu.hidden).toBe(true);
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

    it('scores nothing for putting the ball back at the top after it was carried over', async () => {
        const { startButton, lives, score } = await givenTheGamePage({
            canvasLayout: CANVAS_300_BY_500,
            randomNumbers: ONE_PLATFORM_AT_X_100_UNDER_THE_BALL,
        });
        startButton.click();
        // the ball rests on the platform and goes over the top a few ticks
        // before the platform does, so step tick by tick to the tick that costs the life
        let scoreBeforeTheTop = score();
        for (let tick = 0; lives() === '3' && tick < 1000; tick++) {
            scoreBeforeTheTop = score();
            jest.advanceTimersByTime(GAME_TICK_MS);
        }

        expect(lives()).toBe('2');
        expect(score()).toBe(scoreBeforeTheTop);
    });
});

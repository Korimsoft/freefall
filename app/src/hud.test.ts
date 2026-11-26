import { GameHud, LIFE_BLINK_MS } from './hud';

type HudPage = {
    hud: GameHud,
    score: () => string,
    balls: () => HTMLElement[],
    blinking: () => boolean[],
};

function givenAHud(): HudPage {
    document.body.innerHTML = '';
    const hud = document.createElement('game-hud') as GameHud;
    document.body.append(hud);
    const balls = () => Array.from(hud.querySelectorAll<HTMLElement>('.lives .life'));
    return {
        hud,
        score: () => hud.querySelector('.score-counter')?.textContent ?? '',
        balls,
        blinking: () => balls().map(ball => ball.classList.contains('life-lost')),
    };
}

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
});

describe('GameHud', () => {
    it('shows a score of 0 and no balls before the first game', () => {
        const { hud, score, balls } = givenAHud();

        expect(hud).toBeInstanceOf(GameHud);
        expect(hud.textContent).toContain('Score:');
        expect(score()).toBe('0');
        expect(balls()).toHaveLength(0);
    });

    it('shows the score in whole points', () => {
        const { hud, score } = givenAHud();

        hud.show({ lives: 3, score: 41.9 });

        expect(score()).toBe('41');
    });

    it('shows one ball per life', () => {
        const { hud, balls, blinking } = givenAHud();

        hud.show({ lives: 3, score: 0 });

        expect(balls()).toHaveLength(3);
        expect(blinking()).toEqual([false, false, false]);
    });

    it('blinks the leftmost ball when a life is lost', () => {
        const { hud, blinking } = givenAHud();
        hud.show({ lives: 3, score: 0 });

        hud.show({ lives: 2, score: 0 });

        expect(blinking()).toEqual([true, false, false]);
    });

    it('blinks the lost ball three times, 300 ms each', () => {
        const { hud, balls } = givenAHud();
        hud.show({ lives: 3, score: 0 });

        hud.show({ lives: 2, score: 0 });

        expect(balls()[0].style.animationDuration).toBe('300ms');
        expect(balls()[0].style.animationIterationCount).toBe('3');
        expect(LIFE_BLINK_MS).toBe(900);
    });

    it('removes the blinking ball once it has blinked', () => {
        const { hud, balls, blinking } = givenAHud();
        hud.show({ lives: 3, score: 0 });
        hud.show({ lives: 2, score: 0 });

        jest.advanceTimersByTime(LIFE_BLINK_MS - 1);
        expect(balls()).toHaveLength(3);

        jest.advanceTimersByTime(1);
        expect(blinking()).toEqual([false, false]);
    });

    it('leaves the balls alone when only the score changes', () => {
        const { hud, balls, blinking } = givenAHud();
        hud.show({ lives: 3, score: 0 });
        const ballsBefore = balls();

        hud.show({ lives: 3, score: 10 });

        expect(balls()).toEqual(ballsBefore);
        expect(blinking()).toEqual([false, false, false]);
    });

    it('blinks the next ball to the right when another life is lost during a blink', () => {
        const { hud, balls, blinking } = givenAHud();
        hud.show({ lives: 3, score: 0 });
        hud.show({ lives: 2, score: 0 });

        hud.show({ lives: 1, score: 0 });

        expect(blinking()).toEqual([true, true, false]);
        jest.advanceTimersByTime(LIFE_BLINK_MS);
        expect(balls()).toHaveLength(1);
    });

    it('shows a full row of plain balls when a new game starts during a blink', () => {
        const { hud, balls, blinking } = givenAHud();
        hud.show({ lives: 3, score: 0 });
        hud.show({ lives: 2, score: 0 });

        hud.show({ lives: 3, score: 0 });
        jest.advanceTimersByTime(LIFE_BLINK_MS);

        expect(balls()).toHaveLength(3);
        expect(blinking()).toEqual([false, false, false]);
    });
});

import { PlatformGenerator } from './platform.ts';
import { Renderer } from './renderer.ts';
import {
    givenABall,
    givenACanvasDrawingInto,
    givenAFakeContext,
    givenAPlatform,
    givenRandomNumbers,
    Platform,
    Size,
} from './fixtures.ts';

const BOARD_300_BY_500 = { width: 300, height: 500 };

function givenAGenerator(board: Size): { generator: PlatformGenerator, generated: jest.Mock } {
    const generator = new PlatformGenerator(board);
    const generated = jest.fn();
    generator.platformGenerated = generated;
    return { generator, generated };
}

function generatedPlatform(generated: jest.Mock): Platform {
    return generated.mock.calls[0][0] as Platform;
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('PlatformGenerator', () => {
    it('makes no platform when the chance roll is 0.5 or more', () => {
        givenRandomNumbers(0.5);
        const { generator, generated } = givenAGenerator(BOARD_300_BY_500);

        generator.randomPlatform();

        expect(generated).not.toHaveBeenCalled();
    });

    it('makes a 100 × 10 px platform rising 3 px per move at the bottom, at a random place across the board', () => {
        // chance roll 0.49 (< 0.5), then place roll 0.25
        givenRandomNumbers(0.49, 0.25);
        const { generator, generated } = givenAGenerator(BOARD_300_BY_500);

        generator.randomPlatform();

        expect(generated).toHaveBeenCalledTimes(1);
        expect(generatedPlatform(generated)).toMatchObject({
            // 0.25 of the room left beside a 100 px platform on a 300 px board
            x: 0.25 * (300 - 100),
            y: 500,
            width: 100,
            height: 10,
            speed: -3,
        });
    });

    it('makes the next platform only once the last one has risen more than 30 px', () => {
        givenRandomNumbers(0);
        const { generator, generated } = givenAGenerator(BOARD_300_BY_500);
        generator.randomPlatform();
        const first = generatedPlatform(generated);

        // 10 moves of 3 px: exactly 30 px
        for (let move = 0; move < 10; move++) {
            first.move();
        }
        generator.randomPlatform();
        expect(generated).toHaveBeenCalledTimes(1);

        first.move();
        generator.randomPlatform();
        expect(generated).toHaveBeenCalledTimes(2);
    });
});

describe('Platform', () => {
    it('moves by its speed', () => {
        const platform = givenAPlatform({ x: 100, y: 200, speed: -3 });

        platform.move();

        expect(platform.y).toBe(197);
    });

    it('reports itself once it is over the top of the board', () => {
        const platform = givenAPlatform({ x: 100, y: 2, speed: -3 });
        platform.overTop = jest.fn();

        platform.move();

        expect(platform.overTop).toHaveBeenCalledWith(platform);
    });

    it('is not over the top while it is still at 0', () => {
        const platform = givenAPlatform({ x: 100, y: 3, speed: -3 });
        platform.overTop = jest.fn();

        platform.move();

        expect(platform.overTop).not.toHaveBeenCalled();
    });

    describe('top, for a 100 × 10 px platform at (100, 100) and a ball of radius 10', () => {
        it.each([
            ['ball above the middle, touching it', 150, 95, true],
            ['ball bottom exactly on the platform', 150, 90, true],
            ['ball centre exactly on the platform', 150, 100, true],
            ['ball just above', 150, 89, false],
            ['ball centre below the platform top', 150, 101, false],
            ['ball centre on the left edge', 100, 95, false],
            ['ball centre on the right edge', 200, 95, false],
        ])('%s (x %d, y %d) → %s', (_case, x, y, hits) => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x, y, radius: 10, board: BOARD_300_BY_500 });

            expect(platform.ballHitsTop(ball)).toBe(hits);
        });
    });

    describe('left side, for a 100 × 10 px platform at (100, 100) and a ball of radius 10', () => {
        it('is hit by a ball going right whose width covers the left edge', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 95, y: 105, radius: 10, board: BOARD_300_BY_500 });
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(true);
        });

        it('is not hit by a ball that is not going right', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 95, y: 105, radius: 10, board: BOARD_300_BY_500 });

            expect(platform.ballHitsLeft(ball)).toBe(false);
        });

        it('is not hit by a ball still left of the edge', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 89, y: 105, radius: 10, board: BOARD_300_BY_500 });
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(false);
        });

        it.each([
            ['covering the top edge', 100, true],
            ['covering the bottom edge', 115, true],
            ['above the platform', 80, false],
            ['below the platform', 125, false],
        ])('with the ball %s (y %d) → %s', (_case, y, hits) => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 95, y, radius: 10, board: BOARD_300_BY_500 });
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(hits);
        });
    });

    describe('right side, for a 100 × 10 px platform at (100, 100) and a ball of radius 10', () => {
        it('is hit by a ball going left whose width covers the right edge', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 205, y: 105, radius: 10, board: BOARD_300_BY_500 });
            ball.goLeft();

            expect(platform.ballHitsRight(ball)).toBe(true);
        });

        it('is not hit by a ball going right', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 205, y: 105, radius: 10, board: BOARD_300_BY_500 });
            ball.goRight();

            expect(platform.ballHitsRight(ball)).toBe(false);
        });

        it('is not hit by a ball above the platform', () => {
            const platform = givenAPlatform({ x: 100, y: 100, speed: 0 });
            const ball = givenABall({ x: 205, y: 80, radius: 10, board: BOARD_300_BY_500 });
            ball.goLeft();

            expect(platform.ballHitsRight(ball)).toBe(false);
        });
    });

    it('draws itself with the renderer', () => {
        const ctx = givenAFakeContext();
        const platform = givenAPlatform({ x: 100, y: 200, speed: 0 });
        const ball = givenABall({ x: 150, y: 30, radius: 10, board: BOARD_300_BY_500 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx, BOARD_300_BY_500), { ball, platforms: [] });

        platform.render(renderer);

        expect(ctx.rect).toHaveBeenCalledWith(100, 200, 100, 10);
    });
});

import { Ball } from './ball.js';
import { PLATFORM_HEIGHT, PLATFORM_SPEED, PLATFORM_WIDTH, PlatformGenerator } from './platform.js';
import { Renderer } from './renderer.js';
import {
    BOARD_HEIGHT,
    givenACanvasDrawingInto,
    givenAFakeContext,
    givenAPlatform,
    givenBoardDimensions,
    Platform,
} from './fixtures';

const RADIUS = 10;

function givenABall(x: number, y: number): Ball {
    return new Ball(x, y, RADIUS, givenBoardDimensions());
}

function givenAGenerator(): { generator: PlatformGenerator, generated: jest.Mock } {
    const generator = new PlatformGenerator(givenBoardDimensions());
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

describe('platform constants', () => {
    it('makes platforms 100 × 10 px that rise 3 px per move', () => {
        expect(PLATFORM_WIDTH).toBe(100);
        expect(PLATFORM_HEIGHT).toBe(10);
        expect(PLATFORM_SPEED).toBe(-3);
    });
});

describe('PlatformGenerator', () => {
    it('makes no platform when the chance roll is 0.5 or more', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
        const { generator, generated } = givenAGenerator();

        generator.randomPlatform();

        expect(generated).not.toHaveBeenCalled();
    });

    it('makes a rising platform at the bottom, at a random place across the board', () => {
        jest.spyOn(Math, 'random').mockReturnValueOnce(0.49).mockReturnValueOnce(0.25);
        const { generator, generated } = givenAGenerator();

        generator.randomPlatform();

        expect(generated).toHaveBeenCalledTimes(1);
        expect(generatedPlatform(generated)).toMatchObject({
            x: 50,
            y: BOARD_HEIGHT,
            width: 100,
            height: 10,
            speed: -3,
        });
    });

    it('makes the next platform only once the last one has risen more than 30 px', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const { generator, generated } = givenAGenerator();
        generator.randomPlatform();
        const first = generatedPlatform(generated);

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

    describe('ball on top', () => {
        const platform = givenAPlatform({ x: 100, y: 100 });

        it.each([
            ['ball above the middle, touching it', 150, 95, true],
            ['ball bottom exactly on the platform', 150, 90, true],
            ['ball centre exactly on the platform', 150, 100, true],
            ['ball just above', 150, 89, false],
            ['ball centre below the platform top', 150, 101, false],
            ['ball centre on the left edge', 100, 95, false],
            ['ball centre on the right edge', 200, 95, false],
        ])('%s → %s', (_case, x, y, hits) => {
            expect(platform.ballHitsTop(givenABall(x, y))).toBe(hits);
        });
    });

    describe('ball on the left side', () => {
        const platform = givenAPlatform({ x: 100, y: 100 });

        it('is hit by a ball going right whose width covers the left edge', () => {
            const ball = givenABall(95, 105);
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(true);
        });

        it('is not hit by a ball that is not going right', () => {
            expect(platform.ballHitsLeft(givenABall(95, 105))).toBe(false);
        });

        it('is not hit by a ball still left of the edge', () => {
            const ball = givenABall(89, 105);
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(false);
        });

        it.each([
            ['covering the top edge', 100, true],
            ['covering the bottom edge', 115, true],
            ['above the platform', 80, false],
            ['below the platform', 125, false],
        ])('with the ball %s → %s', (_case, y, hits) => {
            const ball = givenABall(95, y);
            ball.goRight();

            expect(platform.ballHitsLeft(ball)).toBe(hits);
        });
    });

    describe('ball on the right side', () => {
        const platform = givenAPlatform({ x: 100, y: 100 });

        it('is hit by a ball going left whose width covers the right edge', () => {
            const ball = givenABall(205, 105);
            ball.goLeft();

            expect(platform.ballHitsRight(ball)).toBe(true);
        });

        it('is not hit by a ball going right', () => {
            const ball = givenABall(205, 105);
            ball.goRight();

            expect(platform.ballHitsRight(ball)).toBe(false);
        });

        it('is not hit by a ball above the platform', () => {
            const ball = givenABall(205, 80);
            ball.goLeft();

            expect(platform.ballHitsRight(ball)).toBe(false);
        });
    });

    it('draws itself with the renderer', () => {
        const ctx = givenAFakeContext();
        const platform = givenAPlatform({ x: 100, y: 200 });
        const renderer = new Renderer(givenACanvasDrawingInto(ctx), { ball: givenABall(150, 30), platforms: [] });

        platform.render(renderer);

        expect(ctx.rect).toHaveBeenCalledWith(100, 200, 100, 10);
    });
});

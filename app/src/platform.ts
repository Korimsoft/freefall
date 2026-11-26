import type { Ball, Size } from './ball';
import type { Renderer } from './renderer';

export const PLATFORM_WIDTH = 100;
export const PLATFORM_HEIGHT = 10;
export const PLATFORM_SPEED = -3;

const MINIMUM_PLATFORM_DISTANCE = 30;
const PLATFORM_PROBABILITY = .5;

export class Platform {
    x: number;
    y: number;
    width = PLATFORM_WIDTH;
    height = PLATFORM_HEIGHT;
    speed: number;
    overTop: (platform: Platform) => void = () => {};

    constructor(x: number, y: number, speed: number) {
        this.x = x;
        this.y = y;
        this.speed = speed;
    }

    move(): void {
        this.y += this.speed;
        this.hitTop();
    }

    hitTop(): void {
        if (this.y < 0) {
            this.overTop(this);
        }
    }

    ballHitsTop(ball: Ball): boolean {
        const xCriterium = (this.x < ball.x) && (ball.x < (this.x + this.width));
        const yCriterium = (this.y <= (ball.y + ball.radius)) && (ball.y <= this.y);

        return xCriterium && yCriterium;
    }

    ballHitsLeft(ball: Ball): boolean {
        const directionCriterium = ball.speedX > 0;
        const xCriterium = (ball.x - ball.radius) < this.x && this.x < (ball.x + ball.radius);

        return directionCriterium && xCriterium && isYoverlap(this, ball);
    }

    ballHitsRight(ball: Ball): boolean {
        const rightEdge = this.x + this.width;
        const directionCriterium = ball.speedX < 0;
        const xCriterium = (ball.x - ball.radius) < rightEdge && rightEdge < (ball.x + ball.radius);

        return directionCriterium && xCriterium && isYoverlap(this, ball);
    }

    render(renderer: Renderer): void {
        renderer.drawPlatform(this);
    }
}

export class PlatformGenerator {
    boardDimensions: Size;
    yOrigin: number;
    lastPlatform: Platform = new Platform(0, 0, 0);
    platformGenerated: (platform: Platform) => void = () => {};

    constructor(boardDimensions: Size) {
        this.boardDimensions = boardDimensions;
        this.yOrigin = boardDimensions.height;
    }

    randomPlatform(): void {
        if (Math.random() < PLATFORM_PROBABILITY && this.yOrigin - this.lastPlatform.y > MINIMUM_PLATFORM_DISTANCE) {
            const xOrigin = Math.floor(Math.random() * (this.boardDimensions.width - PLATFORM_WIDTH));
            const platform = new Platform(xOrigin, this.yOrigin, PLATFORM_SPEED);
            this.lastPlatform = platform;
            this.platformGenerated(platform);
        }
    }
}

function isYoverlap(platform: Platform, ball: Ball): boolean {
    const topInInterval = ball.y - ball.radius < platform.y && platform.y < ball.y + ball.radius;
    const bottomInInterval = ball.y - ball.radius < platform.y + platform.height && platform.y + platform.height < ball.y + ball.radius;
    return topInInterval || bottomInInterval;
}

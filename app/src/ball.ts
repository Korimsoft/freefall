import type { Platform } from './platform';
import type { Renderer } from './renderer';

export type Size = {
    width: number,
    height: number,
};

const BALL_HORIZONTAL_SPEED = 5;
const GRAVITY = .1;
const BOUNCE = .25;

export class Ball {
    x: number;
    initialX: number;
    y: number;
    initialY: number;
    radius: number;
    speedX = 0;
    speedY = 0;
    boardDimensions: Size;
    hitsTrap: () => void = () => {};

    constructor(x: number, y: number, radius: number, boardDimensions: Size) {
        this.x = x;
        this.initialX = x;
        this.y = y;
        this.initialY = y;
        this.radius = radius;
        this.boardDimensions = boardDimensions;
    }

    toInitialPosition(): void {
        this.x = this.initialX;
        this.y = this.initialY;
        this.speedX = 0;
        this.speedY = 0;
    }

    goLeft(): void {
        this.speedX = -BALL_HORIZONTAL_SPEED;
    }

    goRight(): void {
        this.speedX = BALL_HORIZONTAL_SPEED;
    }

    stopHorizontal(): void {
        this.speedX = 0;
    }

    move(platforms: Platform[]): void {
        this.x = this.x + this.speedX;

        this.speedY += GRAVITY;
        this.y = this.y + this.speedY;
        this.hitTop();
        this.hitSide();
        this.hitBottom();
        for (const platform of platforms.filter(p => Math.abs(p.y - this.y) <= 50)) {
            this.hitPlatform(platform);
        }
    }

    hitTop(): void {
        if (this.y - this.radius < 0) {
            this.hitsTrap();
        }
    }

    hitBottom(): void {
        const bottom = this.boardDimensions.height - this.radius;
        if (this.y > bottom) {
            this.y = bottom;
            this.hitsTrap();
        }
    }

    hitPlatform(platform: Platform): void {
        if (platform.ballHitsTop(this)) {
            this.y = platform.y - this.radius;
            this.speedY = platform.speed - Math.abs(this.speedY * BOUNCE);
        } else if (platform.ballHitsLeft(this)) {
            this.x = platform.x - this.radius;
        } else if (platform.ballHitsRight(this)) {
            this.x = platform.x + platform.width + this.radius;
        }
    }

    hitSide(): void {
        const leftSide = this.radius;
        const rightSide = this.boardDimensions.width - this.radius;

        if (this.x < leftSide) {
            this.x = leftSide;
        } else if (this.x > rightSide) {
            this.x = rightSide;
        }
    }

    render(renderer: Renderer): void {
        renderer.drawBall(this);
    }
}

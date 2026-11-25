import type { Ball } from './ball.js';
import type { Platform } from './platform.js';

const BALL_FILL_LIGHT = 'rgba(255, 255, 255, 0.75)';
const BALL_FILL = 'rgba(200, 200, 200, 0.5)';
const BALL_STROKE = '#FFFFFF';

const PLATFORM_STROKE = '#FFFFFF';
const PLATFORM_FILL = 'rgba(0, 0, 0, 0)';

export type GameState = {
    ball: Ball,
    platforms: Platform[],
};

export class Renderer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameState: GameState;
    frameRequest = 0;

    constructor(canvas: HTMLCanvasElement, gameState: GameState) {
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('The canvas has no 2D context');
        }
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameState = gameState;
    }

    // An arrow function, so that requestAnimationFrame calls it with this bound.
    draw = (): void => {
        this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
        this.gameState.ball.render(this);

        for (const platform of this.gameState.platforms) {
            platform.render(this);
        }

        this.frameRequest = window.requestAnimationFrame(this.draw);
    };

    stop(): void {
        window.cancelAnimationFrame(this.frameRequest);
    }

    drawBall(ball: Ball): void {
        const gradientX = ball.x - Math.floor(ball.radius / 2);
        const gradientY = ball.y - Math.floor(ball.radius / 2);
        const ballFillGradient = this.ctx.createRadialGradient(gradientX, gradientY, 1, gradientX, gradientY, ball.radius);

        ballFillGradient.addColorStop(0, BALL_FILL_LIGHT);
        ballFillGradient.addColorStop(1, BALL_FILL);

        this.ctx.save();
        this.ctx.fillStyle = ballFillGradient;
        this.ctx.strokeStyle = BALL_STROKE;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPlatform(platform: Platform): void {
        this.ctx.save();
        this.ctx.fillStyle = PLATFORM_FILL;
        this.ctx.strokeStyle = PLATFORM_STROKE;
        this.ctx.beginPath();
        this.ctx.rect(platform.x, platform.y, platform.width, platform.height);
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.restore();
    }
}

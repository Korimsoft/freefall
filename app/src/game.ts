import { Ball, Size } from './ball.js';
import { Renderer } from './renderer.js';
import { Platform, PlatformGenerator } from './platform.js';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;

const GAME_LOOP_PERIOD = 20;
const GENERATOR_LOOP_PERIOD = 200;

const BALL_RADIUS = 10;

type View = {
    canvas: HTMLCanvasElement,
    startButton: HTMLButtonElement,
    livesCounter: HTMLElement,
    scoreCounter: HTMLElement,
};

function elementById<T extends HTMLElement>(id: string, type: new () => T): T {
    const element = document.getElementById(id);
    if (!(element instanceof type)) {
        throw new Error(`The page has no ${type.name} with id "${id}"`);
    }
    return element;
}

const initView = (): View => {
    const canvas = elementById('canvas', HTMLCanvasElement);
    canvas.setAttribute('width', '300px');
    canvas.setAttribute('height', '500px');

    return {
        canvas,
        startButton: elementById('start', HTMLButtonElement),
        livesCounter: elementById('lives-counter', HTMLElement),
        scoreCounter: elementById('score-counter', HTMLElement),
    };
};

class Application {
    view: View;
    canvas: HTMLCanvasElement;
    boardDimensions: Size;
    platformGenerator: PlatformGenerator;
    renderer?: Renderer;
    gameLoop?: number;
    platformGeneratorLoop?: number;

    constructor(view: View) {
        this.view = view;
        this.canvas = view.canvas;
        this.boardDimensions = {
            width: this.canvas.offsetWidth,
            height: this.canvas.offsetHeight,
        };

        this.platformGenerator = new PlatformGenerator(this.boardDimensions);

        this.view.startButton.onclick = (e) => this.startClick(e);
    }

    startClick(event: MouseEvent): void {
        event.preventDefault();

        this.view.startButton.setAttribute('disabled', 'true');

        this.view.canvas.focus();

        const platformGenerator = new PlatformGenerator(this.boardDimensions);
        const ball = new Ball(Math.floor(this.boardDimensions.width / 2), 3 * BALL_RADIUS, BALL_RADIUS, this.boardDimensions);
        const game = new Game(ball, this.boardDimensions, platformGenerator);
        const renderer = new Renderer(this.canvas, game);

        window.onkeydown = (e) => this.keyDown(e.keyCode, game);
        window.onkeyup = () => this.keyUp(game);

        game.gameStatsChanged = (gs) => this.updateGameStats(gs);
        game.gameStarted(() => this.gameOver());

        this.renderer = renderer;
        renderer.draw();
        this.gameLoop = window.setInterval(() => game.onGameLoopTick(), GAME_LOOP_PERIOD);
        this.platformGeneratorLoop = window.setInterval(() => game.onGeneratorLoopTick(), GENERATOR_LOOP_PERIOD);
    }

    gameOver(): void {
        alert('You died');
        this.view.startButton.removeAttribute('disabled');
        clearInterval(this.gameLoop);
        clearInterval(this.platformGeneratorLoop);
        this.renderer?.stop();
    }

    updateGameStats(gameStats: GameStats): void {
        this.view.livesCounter.innerHTML = String(gameStats.lives);
        this.view.scoreCounter.innerHTML = String(Math.floor(gameStats.score));
    }

    keyDown(currentKey: number, gameState: Game): void {
        if (gameState.running) {
            if (currentKey == KEY_LEFT) {
                gameState.ball.goLeft();
            }
            if (currentKey == KEY_RIGHT) {
                gameState.ball.goRight();
            }
        }
    }

    keyUp(game: Game): void {
        game.ball.stopHorizontal();
    }
}

class Game {
    ball: Ball;
    boardDimensions: Size;
    platformGenerator: PlatformGenerator;
    platforms: Platform[] = [];
    gameStats = new GameStats(0, 0);
    running = false;
    gameStatsChanged: (gameStats: GameStats) => void = () => {};

    constructor(ball: Ball, boardDimensions: Size, platformGenerator: PlatformGenerator) {
        this.ball = ball;
        this.boardDimensions = boardDimensions;
        this.platformGenerator = platformGenerator;
        this.platformGenerator.platformGenerated = (p) => this.onPlatformGenerated(p);
    }

    onGeneratorLoopTick(): void {
        this.platformGenerator.randomPlatform();
    }

    onGameLoopTick(): void {
        for (const platform of this.platforms) {
            platform.move();
        }
        const ballYOriginal = this.ball.y;
        this.ball.move(this.platforms);
        const scoreDiff = this.ball.y - ballYOriginal;
        if (scoreDiff > 0) {
            this.gameStats.score += scoreDiff;
            this.gameStatsChanged(this.gameStats);
        }
    }

    onPlatformGenerated(platform: Platform): void {
        platform.overTop = (p) => this.onPlatformOverTop(p);
        this.platforms.push(platform);
    }

    onPlatformOverTop(platform: Platform): void {
        platform.overTop = () => {};
        this.platforms = this.platforms.filter(p => p !== platform);
    }

    gameStarted(gameOverHandler: () => void): void {
        this.gameStats.lives = 3;
        this.running = true;
        this.ball.hitsTrap = () => {
            this.lifeLost();
            if (this.gameStats.lives <= 0) {
                this.running = false;
                gameOverHandler();
            }
        };
        this.gameStatsChanged(this.gameStats);
    }

    lifeLost(): void {
        this.gameStats.lives--;
        this.ball.toInitialPosition();
        this.gameStatsChanged(this.gameStats);
    }
}

class GameStats {
    lives: number;
    score: number;

    constructor(lives: number, score: number) {
        this.lives = lives;
        this.score = score;
    }
}

new Application(initView());

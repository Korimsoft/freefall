const BLINK_PERIOD_MS = 300;
const BLINKS = 3;
export const LIFE_BLINK_MS = BLINK_PERIOD_MS * BLINKS;

const LIFE_CLASS = 'life';
const LIFE_LOST_CLASS = 'life-lost';

export type HudStats = {
    lives: number,
    score: number,
};

export class Hud {
    scoreCounter: HTMLElement;
    lives: HTMLElement;

    constructor(scoreCounter: HTMLElement, lives: HTMLElement) {
        this.scoreCounter = scoreCounter;
        this.lives = lives;
    }

    show(stats: HudStats): void {
        this.scoreCounter.textContent = String(Math.floor(stats.score));

        const standing = this.standingLives();
        if (stats.lives > standing.length) {
            this.showFullRow(stats.lives);
        } else {
            // Blinking balls are always the leftmost ones, so the next loss takes the first ball still standing.
            standing.slice(0, standing.length - stats.lives).forEach(life => this.loseLife(life));
        }
    }

    private standingLives(): HTMLElement[] {
        return Array.from(this.lives.querySelectorAll<HTMLElement>(`.${LIFE_CLASS}:not(.${LIFE_LOST_CLASS})`));
    }

    private showFullRow(lives: number): void {
        this.lives.replaceChildren();
        for (let i = 0; i < lives; i++) {
            const life = document.createElement('span');
            life.className = LIFE_CLASS;
            this.lives.append(life);
        }
    }

    private loseLife(life: HTMLElement): void {
        life.classList.add(LIFE_LOST_CLASS);
        life.style.animationDuration = `${BLINK_PERIOD_MS}ms`;
        life.style.animationIterationCount = String(BLINKS);
        window.setTimeout(() => life.remove(), LIFE_BLINK_MS);
    }
}

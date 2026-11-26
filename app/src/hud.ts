import { defineOnce } from './custom-element';

const BLINK_PERIOD_MS = 300;
const BLINKS = 3;
export const LIFE_BLINK_MS = BLINK_PERIOD_MS * BLINKS;

const LIFE_CLASS = 'life';
const LIFE_LOST_CLASS = 'life-lost';

export type HudStats = {
    lives: number,
    score: number,
};

class GameHudElement extends HTMLElement {
    private rendered = false;
    private scoreCounter?: HTMLElement;
    private lives?: HTMLElement;

    connectedCallback(): void {
        // Moving the HUD connects it again, which must not reset the score and the balls.
        if (this.rendered) {
            return;
        }
        this.rendered = true;

        this.innerHTML = `
            <span class="score">Score: <span class="score-counter">0</span></span>
            <span class="lives"></span>`;
        this.scoreCounter = this.querySelector<HTMLElement>('.score-counter') ?? undefined;
        this.lives = this.querySelector<HTMLElement>('.lives') ?? undefined;
    }

    show(stats: HudStats): void {
        if (!this.scoreCounter || !this.lives) {
            return;
        }
        this.scoreCounter.textContent = String(Math.floor(stats.score));

        const standing = this.standingLives(this.lives);
        if (stats.lives > standing.length) {
            this.showFullRow(this.lives, stats.lives);
        } else {
            // Blinking balls are always the leftmost ones, so the next loss takes the first ball still standing.
            standing.slice(0, standing.length - stats.lives).forEach(life => this.loseLife(life));
        }
    }

    private standingLives(lives: HTMLElement): HTMLElement[] {
        return Array.from(lives.querySelectorAll<HTMLElement>(`.${LIFE_CLASS}:not(.${LIFE_LOST_CLASS})`));
    }

    private showFullRow(lives: HTMLElement, count: number): void {
        lives.replaceChildren();
        for (let i = 0; i < count; i++) {
            const life = document.createElement('span');
            life.className = LIFE_CLASS;
            lives.append(life);
        }
    }

    private loseLife(life: HTMLElement): void {
        life.classList.add(LIFE_LOST_CLASS);
        life.style.animationDuration = `${BLINK_PERIOD_MS}ms`;
        life.style.animationIterationCount = String(BLINKS);
        window.setTimeout(() => life.remove(), LIFE_BLINK_MS);
    }
}

export const GameHud = defineOnce('game-hud', GameHudElement);
export type GameHud = GameHudElement;

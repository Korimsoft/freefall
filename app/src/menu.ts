import { defineOnce } from './custom-element';

export const MENU_START_EVENT = 'start';

class GameMenuElement extends HTMLElement {
    private rendered = false;
    private gameOver?: HTMLElement;
    private finalScore?: HTMLElement;

    connectedCallback(): void {
        // Moving the menu connects it again, which must not build a second set of buttons.
        if (this.rendered) {
            return;
        }
        this.rendered = true;

        this.innerHTML = `
            <div class="game-over" hidden>
                <div class="game-over-title">Game Over</div>
                <div>Score: <span class="final-score">0</span></div>
            </div>
            <button class="game-control start">Start</button>
            <button class="game-control about">About</button>`;
        this.gameOver = this.querySelector<HTMLElement>('.game-over') ?? undefined;
        this.finalScore = this.querySelector<HTMLElement>('.final-score') ?? undefined;
        this.querySelector<HTMLButtonElement>('.start')?.addEventListener('click', (event) => {
            event.preventDefault();
            this.dispatchEvent(new CustomEvent(MENU_START_EVENT));
        });
    }

    hide(): void {
        this.hidden = true;
    }

    showGameOver(score: number): void {
        if (this.finalScore) {
            this.finalScore.textContent = String(Math.floor(score));
        }
        if (this.gameOver) {
            this.gameOver.hidden = false;
        }
        this.hidden = false;
    }
}

export const GameMenu = defineOnce('game-menu', GameMenuElement);
export type GameMenu = GameMenuElement;

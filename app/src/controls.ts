import { defineOnce } from './custom-element';

export const CONTROLS_STEER_EVENT = 'steer';

export const SteerDirection = {
    left: 'left',
    right: 'right',
    none: 'none',
} as const;

export type SteerDirection = typeof SteerDirection[keyof typeof SteerDirection];

type Held = {
    pointerId: number,
    direction: SteerDirection,
};

class GameControlsElement extends HTMLElement {
    private rendered = false;
    private directionButtonsHeld: Held[] = [];

    connectedCallback(): void {
        if (this.rendered) {
            return;
        }
        this.rendered = true;

        this.innerHTML = `
            <button class="touch-control left" aria-label="Left">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="16,5 5,12 16,19"/></svg>
            </button>
            <button class="touch-control right" aria-label="Right">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 19,12 8,19"/></svg>
            </button>`;
        this.listenToButtonActions(this.querySelector<HTMLButtonElement>('.left'), SteerDirection.left);
        this.listenToButtonActions(this.querySelector<HTMLButtonElement>('.right'), SteerDirection.right);
    }

    private listenToButtonActions(button: HTMLButtonElement | null, direction: SteerDirection): void {
        if (!button) {
            return;
        }
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            button.setPointerCapture?.(event.pointerId);
            this.directionButtonsHeld = [
                ...this.directionButtonsHeld.filter(h => h.pointerId !== event.pointerId),
                { pointerId: event.pointerId, direction },
            ];
            this.steer();
        });
        button.addEventListener('pointerup', (event) => this.lift(event));
        button.addEventListener('pointercancel', (event) => this.lift(event));
        button.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    private lift(event: PointerEvent): void {
        const before = this.directionButtonsHeld.length;
        this.directionButtonsHeld = this.directionButtonsHeld.filter(h => h.pointerId !== event.pointerId);
        if (this.directionButtonsHeld.length !== before) {
            this.steer();
        }
    }

    private steer(): void {
        const direction = this.directionButtonsHeld.at(-1)?.direction ?? SteerDirection.none;
        this.dispatchEvent(new CustomEvent<SteerDirection>(CONTROLS_STEER_EVENT, { detail: direction }));
    }
}

export const GameControls = defineOnce('game-controls', GameControlsElement);
export type GameControls = GameControlsElement;

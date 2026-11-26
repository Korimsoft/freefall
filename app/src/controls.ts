import { defineOnce } from './custom-element';

export const CONTROLS_STEER_EVENT = 'steer';

export type Steer = 'left' | 'right' | 'none';

type Held = {
    pointerId: number,
    direction: Steer,
};

class GameControlsElement extends HTMLElement {
    private rendered = false;
    // In press order, so lifting one finger hands the ball back to the button still held, like a d-pad.
    private held: Held[] = [];

    connectedCallback(): void {
        // Moving the controls connects them again, which must not build a second pair of buttons.
        if (this.rendered) {
            return;
        }
        this.rendered = true;

        // SVG, not the ◀ ▶ characters: a character sits where its font's glyph box puts it, off centre.
        // Each triangle's centroid is a little behind the middle, so it looks centred in the round button.
        this.innerHTML = `
            <button class="touch-control left" aria-label="Left">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="16,5 5,12 16,19"/></svg>
            </button>
            <button class="touch-control right" aria-label="Right">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="8,5 19,12 8,19"/></svg>
            </button>`;
        this.listenTo(this.querySelector<HTMLButtonElement>('.left'), 'left');
        this.listenTo(this.querySelector<HTMLButtonElement>('.right'), 'right');
    }

    private listenTo(button: HTMLButtonElement | null, direction: Steer): void {
        if (!button) {
            return;
        }
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            // A finger that slides off the button while held must still be heard when it lifts.
            button.setPointerCapture?.(event.pointerId);
            this.held = [...this.held.filter(h => h.pointerId !== event.pointerId), { pointerId: event.pointerId, direction }];
            this.steer();
        });
        const lift = (event: PointerEvent) => {
            const before = this.held.length;
            this.held = this.held.filter(h => h.pointerId !== event.pointerId);
            if (this.held.length !== before) {
                this.steer();
            }
        };
        button.addEventListener('pointerup', lift);
        button.addEventListener('pointercancel', lift);
        // A long press would otherwise open the context menu on a phone.
        button.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    private steer(): void {
        const direction = this.held.at(-1)?.direction ?? 'none';
        this.dispatchEvent(new CustomEvent<Steer>(CONTROLS_STEER_EVENT, { detail: direction }));
    }
}

export const GameControls = defineOnce('game-controls', GameControlsElement);
export type GameControls = GameControlsElement;

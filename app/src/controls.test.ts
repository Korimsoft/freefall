import { within } from '@testing-library/dom';
import { CONTROLS_STEER_EVENT, GameControls, SteerDirection } from './controls';

type ControlsPage = {
    controls: GameControls,
    buttons: () => string[],
    left: () => HTMLElement,
    right: () => HTMLElement,
    steered: SteerDirection[],
};

function givenControls(): ControlsPage {
    document.body.innerHTML = '';
    const controls = document.createElement('game-controls') as GameControls;
    document.body.append(controls);
    const steered: SteerDirection[] = [];
    controls.addEventListener(CONTROLS_STEER_EVENT, (event) => steered.push((event as CustomEvent<SteerDirection>).detail));
    return {
        controls,
        buttons: () => within(controls).getAllByRole('button').map(button => button.getAttribute('aria-label') ?? ''),
        left: () => within(controls).getByRole('button', { name: 'Left' }),
        right: () => within(controls).getByRole('button', { name: 'Right' }),
        steered,
    };
}

function touch(button: HTMLElement, type: 'pointerdown' | 'pointerup' | 'pointercancel', pointerId: number): void {
    button.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId }));
}

describe('GameControls', () => {
    it('shows a Left and a Right button', () => {
        const { controls, buttons } = givenControls();

        expect(controls).toBeInstanceOf(GameControls);
        expect(buttons()).toEqual(['Left', 'Right']);
    });

    it('steers left while Left is held and stops when it is lifted', () => {
        const { left, steered } = givenControls();

        touch(left(), 'pointerdown', 1);
        touch(left(), 'pointerup', 1);

        expect(steered).toEqual(['left', 'none']);
    });

    it('steers right while Right is held and stops when it is lifted', () => {
        const { right, steered } = givenControls();

        touch(right(), 'pointerdown', 1);
        touch(right(), 'pointerup', 1);

        expect(steered).toEqual(['right', 'none']);
    });

    it('goes back to the button still held when the other one is lifted', () => {
        const { left, right, steered } = givenControls();

        touch(left(), 'pointerdown', 1);
        touch(right(), 'pointerdown', 2);
        touch(right(), 'pointerup', 2);
        touch(left(), 'pointerup', 1);

        expect(steered).toEqual(['left', 'right', 'left', 'none']);
    });

    it('treats a cancelled touch as a lifted finger', () => {
        const { left, steered } = givenControls();

        touch(left(), 'pointerdown', 1);
        touch(left(), 'pointercancel', 1);

        expect(steered).toEqual(['left', 'none']);
    });

    it('stops the page from handling the press, so the phone neither scrolls nor selects', () => {
        const { left } = givenControls();
        const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1 });

        left().dispatchEvent(press);

        expect(press.defaultPrevented).toBe(true);
    });

    it('builds no second pair of buttons when it is connected again', () => {
        const { controls, buttons } = givenControls();

        document.body.append(controls);

        expect(buttons()).toEqual(['Left', 'Right']);
    });
});

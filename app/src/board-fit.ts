import type { Size } from './ball';

// The game plays on a board of this many units; on a phone it is only drawn bigger,
// so the ball and the platforms move the same on every screen.
export const BOARD_SIZE: Size = { width: 300, height: 500 };

export const BOARD_MARGIN = 16;

export type Room = {
    screen: Size,
    boardTop: number,
    // The left touch button, absent where the touch controls are hidden.
    button?: { right: number, top: number },
};

export type FitView = {
    board: HTMLElement,
    canvas: HTMLCanvasElement,
    controls: HTMLElement,
};

export function boardScale(room: Room): number {
    const { screen, boardTop, button } = room;
    if (!button) {
        return 1;
    }
    const aboveButtons = Math.min(
        (screen.width - 2 * BOARD_MARGIN) / BOARD_SIZE.width,
        (button.top - BOARD_MARGIN - boardTop) / BOARD_SIZE.height,
    );
    // Turned sideways, the screen is too low to fit the board above the buttons, but the board fits between them.
    const betweenButtons = Math.min(
        (screen.width - 2 * (button.right + BOARD_MARGIN)) / BOARD_SIZE.width,
        (screen.height - BOARD_MARGIN - boardTop) / BOARD_SIZE.height,
    );
    return Math.max(aboveButtons, betweenButtons);
}

export function fitBoard(view: FitView): void {
    const scale = boardScale(measureRoom(view));
    document.documentElement.style.setProperty('--board-scale', String(scale));

    // One canvas pixel per screen pixel, so the scaled board stays sharp; the renderer maps board units onto it.
    const pixels = scale * window.devicePixelRatio;
    view.canvas.width = Math.round(BOARD_SIZE.width * pixels);
    view.canvas.height = Math.round(BOARD_SIZE.height * pixels);
}

export function keepBoardFitted(view: FitView): void {
    fitBoard(view);
    window.addEventListener('resize', () => fitBoard(view));
}

function measureRoom(view: FitView): Room {
    const screen = { width: window.innerWidth, height: window.innerHeight };
    // The board scales from its top left corner, so its top is where it is unscaled.
    const boardTop = view.board.getBoundingClientRect().top;
    const button = view.controls.querySelector('.touch-control')?.getBoundingClientRect();
    // Hidden controls take up no room at all.
    if (!button || button.width === 0) {
        return { screen, boardTop };
    }
    return { screen, boardTop, button: { right: button.right, top: button.top } };
}

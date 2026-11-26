import { BOARD_SIZE, boardScale, fitBoard, keepBoardFitted } from './board-fit';

// A 390 × 844 phone held upright: the board starts 30 px down, under the title, and the
// 72 px left button sits 16 px from the bottom left corner.
const UPRIGHT_PHONE = {
    screen: { width: 390, height: 844 },
    boardTop: 30,
    button: { right: 88, top: 756 },
};

// The same phone turned sideways.
const SIDEWAYS_PHONE = {
    screen: { width: 844, height: 390 },
    boardTop: 30,
    button: { right: 88, top: 302 },
};

type FitPage = {
    board: HTMLElement,
    canvas: HTMLCanvasElement,
    controls: HTMLElement,
    scale: () => string,
};

function givenAPage(page: { screen: { width: number, height: number }, boardTop: number, button?: { right: number, top: number }, pixelRatio: number }): FitPage {
    document.documentElement.style.removeProperty('--board-scale');
    document.body.innerHTML = `
        <div class="board"><canvas></canvas></div>
        <game-controls><button class="touch-control left"></button></game-controls>`;
    const board = document.querySelector<HTMLElement>('.board') as HTMLElement;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const controls = document.querySelector<HTMLElement>('game-controls') as HTMLElement;
    const button = controls.querySelector('.touch-control') as HTMLElement;

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: page.screen.width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: page.screen.height });
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: page.pixelRatio });
    jest.spyOn(board, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, page.boardTop, 300, 500));
    // jsdom lays nothing out, so every element measures 0 × 0, as hidden controls do in a browser.
    if (page.button) {
        jest.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(page.button.right - 72, page.button.top, 72, 72));
    }

    return {
        board,
        canvas,
        controls,
        scale: () => document.documentElement.style.getPropertyValue('--board-scale'),
    };
}

function givenTheScreenTurned(controls: HTMLElement, turned: typeof SIDEWAYS_PHONE): void {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: turned.screen.width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: turned.screen.height });
    const button = controls.querySelector('.touch-control') as HTMLElement;
    jest.spyOn(button, 'getBoundingClientRect').mockReturnValue(new DOMRect(turned.button.right - 72, turned.button.top, 72, 72));
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe('boardScale', () => {
    it('leaves the board at its own size where there are no touch controls', () => {
        expect(boardScale({ screen: { width: 1000, height: 700 }, boardTop: 30 })).toBe(1);
    });

    it('fills the width of an upright phone, less a 16 px margin on each side', () => {
        const scale = boardScale(UPRIGHT_PHONE);

        expect(BOARD_SIZE.width * scale).toBeCloseTo(390 - 2 * 16);
    });

    it('keeps the board 16 px above the buttons when the phone is too short to fill its width', () => {
        const shortPhone = { ...UPRIGHT_PHONE, screen: { width: 390, height: 640 }, button: { right: 88, top: 552 } };

        const scale = boardScale(shortPhone);

        expect(30 + BOARD_SIZE.height * scale).toBeCloseTo(552 - 16);
    });

    it('fits the board between the buttons, 16 px above the bottom, on a phone turned sideways', () => {
        const scale = boardScale(SIDEWAYS_PHONE);

        expect(30 + BOARD_SIZE.height * scale).toBeCloseTo(390 - 16);
        expect(BOARD_SIZE.width * scale).toBeLessThanOrEqual(844 - 2 * (88 + 16));
    });
});

describe('fitBoard', () => {
    it('scales the board and gives the canvas one pixel per screen pixel', () => {
        const { canvas, controls, board, scale } = givenAPage({ ...UPRIGHT_PHONE, pixelRatio: 3 });

        fitBoard({ board, canvas, controls });

        expect(Number(scale())).toBeCloseTo(358 / 300);
        expect(canvas.width).toBe(358 * 3);
        expect(canvas.height).toBe(Math.round(500 * (358 / 300) * 3));
    });

    it('leaves the board and canvas at 300 × 500 where the touch controls are hidden', () => {
        const { canvas, controls, board, scale } = givenAPage({ screen: { width: 1000, height: 700 }, boardTop: 30, pixelRatio: 1 });

        fitBoard({ board, canvas, controls });

        expect(scale()).toBe('1');
        expect(canvas.width).toBe(300);
        expect(canvas.height).toBe(500);
    });

    it('fits the board again when the screen changes size, as when the phone is turned', () => {
        const { canvas, controls, board, scale } = givenAPage({ ...UPRIGHT_PHONE, pixelRatio: 1 });
        keepBoardFitted({ board, canvas, controls });

        givenTheScreenTurned(controls, SIDEWAYS_PHONE);
        window.dispatchEvent(new Event('resize'));

        expect(Number(scale())).toBeCloseTo(boardScale(SIDEWAYS_PHONE));
    });
});

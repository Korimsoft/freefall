import { GameMenu, MENU_START_EVENT } from './menu';

type MenuPage = {
    menu: GameMenu,
    buttons: () => string[],
    startButton: () => HTMLButtonElement,
    gameOverMessage: () => HTMLElement,
    finalScore: () => string,
};

function givenAMenu(): MenuPage {
    document.body.innerHTML = '';
    const menu = document.createElement('game-menu') as GameMenu;
    document.body.append(menu);
    return {
        menu,
        buttons: () => Array.from(menu.querySelectorAll('button')).map(button => button.textContent ?? ''),
        startButton: () => menu.querySelector('button.start') as HTMLButtonElement,
        gameOverMessage: () => menu.querySelector('.game-over') as HTMLElement,
        finalScore: () => menu.querySelector('.final-score')?.textContent ?? '',
    };
}

describe('GameMenu', () => {
    it('shows Start and About, without the Game Over message, at first', () => {
        const { menu, buttons, gameOverMessage } = givenAMenu();

        expect(menu).toBeInstanceOf(GameMenu);
        expect(menu.hidden).toBe(false);
        expect(buttons()).toEqual(['Start', 'About']);
        expect(gameOverMessage().hidden).toBe(true);
    });

    it('sends a start event when Start is clicked', () => {
        const { menu, startButton } = givenAMenu();
        const started = jest.fn();
        menu.addEventListener(MENU_START_EVENT, started);

        startButton().click();

        expect(started).toHaveBeenCalledTimes(1);
    });

    it('hides itself', () => {
        const { menu } = givenAMenu();

        menu.hide();

        expect(menu.hidden).toBe(true);
    });

    it('shows itself again with Game Over and the final score in whole points', () => {
        const { menu, gameOverMessage, finalScore } = givenAMenu();
        menu.hide();

        menu.showGameOver(1234.7);

        expect(menu.hidden).toBe(false);
        expect(gameOverMessage().hidden).toBe(false);
        expect(gameOverMessage().textContent).toContain('Game Over');
        expect(finalScore()).toBe('1234');
    });

    it('keeps one set of buttons when it is moved', () => {
        const { menu, buttons } = givenAMenu();
        const elsewhere = document.createElement('div');
        document.body.append(elsewhere);

        elsewhere.append(menu);

        expect(buttons()).toEqual(['Start', 'About']);
    });
});

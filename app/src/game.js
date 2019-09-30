
import { Ball } from './ball.js';
import { Renderer } from './renderer.js';
import { PlatformGenerator } from './platform.js';

const KEY_LEFT = 37;
const KEY_RIGHT = 39;

const GAME_LOOP_PERIOD = 20;
const GENERATOR_LOOP_PERIOD = 200;

const BALL_RADIUS = 10;

console.debug('Game module imported');



const initView = () => {
    console.debug('Initializing');

    const canvas = document.getElementById('canvas');  
    canvas.setAttribute('width', '300px');
    canvas.setAttribute('height', '500px');

    const startButton = document.getElementById('start');
    const livesCounter = document.getElementById('lives-counter');
    const scoreCounter = document.getElementById('score-counter');

    return { 
        canvas: canvas, 
        startButton: startButton,
        livesCounter: livesCounter,
        scoreCounter: scoreCounter
    };
};

class Application {
    constructor(view){
        this.view = view;
        this.canvas = view.canvas;
        this.boardDimensions = {
            width: this.canvas.offsetWidth, 
            height: this.canvas.offsetHeight
        };
        
        this.platformGenerator = new PlatformGenerator(this.boardDimensions);

        this.view.startButton.onclick = (e) => this.startClick(e);
               
    }

    startClick(event) {
        event.preventDefault();
        console.debug('Game started');

        this.view.startButton.setAttribute('disabled', true);
        
        this.view.canvas.focus();
        
        const platformGenerator = new PlatformGenerator(this.boardDimensions);
        const ball = new Ball(Math.floor(this.boardDimensions.width / 2), 3*BALL_RADIUS, BALL_RADIUS, this.boardDimensions);
        const game = new Game(ball, this.boardDimensions, platformGenerator);
        const renderer = new Renderer(this.canvas, game);
        
        onkeydown = (e) => this.keyDown(e.keyCode, game);
        onkeyup = () => this.keyUp(game);


        game.gameStatsChanged = (gs) => this.updateGameStats(gs);
        game.gameStarted(() => this.gameOver());

        renderer.draw();
        this.gameLoop = setInterval(()=> game.onGameLoopTick(), GAME_LOOP_PERIOD);
        this.platformGeneratorLoop = setInterval(()=> game.onGeneratorLoopTick(), GENERATOR_LOOP_PERIOD);
        
    }

    gameOver(){
        alert('You died');
        this.view.startButton.removeAttribute('disabled');
        clearInterval(this.gameLoop);
        clearInterval(this.platformGeneratorLoop);
        
        console.debug('Game over');
    }

    updateGameStats(gameStats){
        this.view.livesCounter.innerHTML = gameStats.lives;
        this.view.scoreCounter.innerHTML = Math.floor(gameStats.score);
    }

    keyDown(currentKey, gameState) {
        
        if(gameState.running){
            if (currentKey == KEY_LEFT) {
                gameState.ball.goLeft();
            }
            if (currentKey == KEY_RIGHT) {
                gameState.ball.goRight();
            }
        }
    }

    keyUp(game){
        game.ball.stopHorizontal();
    }

}

class Game {
    constructor(ball, boardDimensions, platformGenerator){
        this.ball = ball;
        this.boardDimensions = boardDimensions; 
        this.platformGenerator = platformGenerator;
        this.platformGenerator.platformGenerated = (p) => this.onPlatformGenerated(p);
        this.platforms = [];
        this.gameStats = new GameStats(0, 0);
    }

    onGeneratorLoopTick() {
        this.platformGenerator.randomPlatform();
    }

    onGameLoopTick() {
        for( const platform of this.platforms ){
            platform.move();
        }
        const ballYOriginal = this.ball.y;
        this.ball.move(this.platforms);
        const scoreDiff = this.ball.y - ballYOriginal;
        if(scoreDiff > 0){
            this.gameStats.score += scoreDiff;
            this.gameStatsChanged(this.gameStats);
        }


    }

    onPlatformGenerated(platform) {
        platform.overTop = (p) => this.onPlatformOverTop(p);
        this.platforms.push(platform);
    }

    onPlatformOverTop(platform) {
        platform.overTop = null;
        this.platforms = this.platforms.filter(p => p !== platform);
    }

    gameStarted(gameOverHandler){
        this.gameStats.lives = 3;
        this.running = true;
        this.ball.hitsTrap = () => {
            this.lifeLost();
            if(this.gameStats.lives <= 0){
                this.running = false;
                gameOverHandler();
            }
        };
        this.gameStatsChanged(this.gameStats);
    }

    lifeLost(){
        this.gameStats.lives--;
        this.ball.toInitialPosition();
        this.gameStatsChanged(this.gameStats);
    }
  
}

class GameStats{
    constructor(lives, score){
        this.lives = lives;
        this.score = score;
    }
}

const view = initView();

const application = new Application(view);

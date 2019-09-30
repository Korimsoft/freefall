export const PLATFORM_WIDTH = 100;
export const PLATFORM_HEIGHT = 10;
export const PLATFORM_SPEED = -3;

const MINIMUM_PLATFORM_DISTANCE = 30;
const PLATFORM_PROBABILITY = .5;

export class PlatformGenerator {
    constructor(boardDimensions){
        this.boardDimensions = boardDimensions;
        this.yOrigin = boardDimensions.height;
        this.lastPlatform = new Platform(0, 0, 0);
        this.platformGenerated = () => {};
    }

    randomPlatform(){
        if(Math.random() < PLATFORM_PROBABILITY && this.yOrigin - this.lastPlatform.y > MINIMUM_PLATFORM_DISTANCE) {
            const xOrigin = Math.floor(Math.random() * (this.boardDimensions.width - PLATFORM_WIDTH));
            const platform = new Platform(xOrigin, this.yOrigin, PLATFORM_SPEED);
            this.lastPlatform = platform;
            this.platformGenerated(platform);
        }
    }
    
}


class Platform {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = PLATFORM_WIDTH;
        this.height = PLATFORM_HEIGHT;
        this.speed = speed;
        this.overTop = () => {};
    }

    move() {
        this.y += this.speed;
        this.hitTop();    
    }

    hitTop() {
        if(this.y < 0) {
            this.overTop(this);
        }
    }

    ballHitsTop(ball){
        const xCriterium = (this.x < ball.x) && (ball.x < (this.x + this.width));
        const yCriterium = (this.y <= (ball.y + ball.radius)) && (ball.y <= this.y);

        return xCriterium && yCriterium;
    }

    ballHitsLeft(ball) {
        const directionCriterium = ball.speedX > 0;
        const xCriterium = (ball.x - ball.radius) < this.x && this.x < (ball.x + ball.radius);
        
        return directionCriterium && xCriterium && isYoverlap(this, ball);
    }

    ballHitsRight(ball) {
        const rightEdge = this.x + this.width;
        const directionCriterium = ball.speedX < 0;
        const xCriterium = (ball.x - ball.radius) < rightEdge && rightEdge < (ball.x + ball.radius);

        return directionCriterium && xCriterium && isYoverlap(this, ball);
    }

    render(renderer) {
        renderer.drawPlatform(this);
    }

}

function isYoverlap(platform, ball) {
    const topInInterval = ball.y - ball.radius < platform.y && platform.y < ball.y + ball.radius;
    const bottomInInterval = ball.y - ball.radius < platform.y + platform.height && platform.y + platform.height < ball.y + ball.radius;
    return topInInterval || bottomInInterval;
}
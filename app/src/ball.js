



const BALL_HORIZONTAL_SPEED = 5;
const GRAVITY = .1;
const BOUNCE = .25;

export class Ball {
    constructor(x, y, radius, boardDimensions) {
        this.x = x;
        this.initialX = x;
        this.y = y;
        this.initialY = y;
        this.radius = radius;
        this.speedX = 0;
        this.speedY = 0;
        this.boardDimensions = boardDimensions; 
        this.hitsTrap = () => {};
               
    }

    toInitialPosition(){
        this.x = this.initialX;
        this.y = this.initialY;
        this.speedX = 0;
        this.speedY = 0;
    }

    goLeft() {
        this.speedX = -BALL_HORIZONTAL_SPEED;
    }

    goRight() {
        this.speedX = BALL_HORIZONTAL_SPEED;
    }
 
    stopHorizontal(){
        this.speedX = 0;
    }

    move(platforms){ 
        this.x = this.x + this.speedX;

        this.speedY += GRAVITY;
        this.y = this.y + this.speedY;
        this.hitTop();
        this.hitSide();
        this.hitBottom();
        for(const platform of platforms.filter(p => Math.abs(p.y-this.y) <= 50) ) {
            this.hitPlatform(platform);
        }
    }

    hitTop(){
        if(this.y - this.radius < 0){
            this.hitsTrap();
        }
    }

    hitBottom(){
        const bottom = this.boardDimensions.height - this.radius;
        if(this.y > bottom) {
            this.y = bottom;
            this.hitsTrap();
        }
        
    }

    hitPlatform(platform) {
        if(platform.ballHitsTop(this)) {
            this.y = platform.y - this.radius;
            this.speedY = platform.speed -Math.abs(this.speedY * BOUNCE);
        } else if(platform.ballHitsLeft(this)) {
            this.x = platform.x - this.radius;
        } else if (platform.ballHitsRight(this)) {
            this.x = platform.x + platform.width + this.radius;
        }
    }

    hitSide(){
        const leftSide = this.radius;
        const rightSide = this.boardDimensions.width - this.radius;

        if(this.x < leftSide) {
            this.x = leftSide;
        } else if (this.x > rightSide) {
            this.x = rightSide;
        }
    }

    render(renderer) {
        renderer.drawBall(this);
    }

    
}





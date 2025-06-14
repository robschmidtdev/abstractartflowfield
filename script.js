const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
const image = document.getElementById('star')
canvas.width = image.naturalWidth;
canvas.height = image.naturalHeight;

// canvas settings
ctx.lineWidth = 1;

class Particle {
    constructor(effect){
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        this.speedModifier = Math.floor(Math.random() + 1);
        this.history = [{x: this.x, y: this.y}];
        this.maxLength = Math.floor(Math.random() * 60 + 50);
        this.angle = 0;
        this.newAngle = 0;
        this.angleCorrector = Math.random() * 0.5 + 0.01;
        this.timer = this.maxLength * 2;
        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.color = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
    }
    draw(context){
        context.beginPath();
        context.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 0; i < this.history.length; i++){
            context.lineTo(this.history[i].x, this.history[i].y);
        }
        context.strokeStyle = this.color;
        context.stroke();
    }
    update(){
        this.timer--;
        if (this.timer >= 1){
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            let index = y * this.effect.cols + x;

            let flowFieldIndex = this.effect.flowField[index];
            if (flowFieldIndex){
                // motion
                this.newAngle = flowFieldIndex.colorAngle;
                if (this.angle > this.newAngle){
                    this.angle -= this.angleCorrector;
                } else if (this.angle < this.newAngle){
                    this.angle += this.angleCorrector;
                } else {
                    this.angle = this.newAngle;
                }
                // color
                if (flowFieldIndex.alpha > 0){
                    this.red === flowFieldIndex.red ? this.red : this.red += (flowFieldIndex.red - this.red) * 0.5;
                    this.green === flowFieldIndex.green ? this.green : this.green += (flowFieldIndex.green - this.green) * 0.5;
                    this.blue === flowFieldIndex.blue ? this.blue : this.blue += (flowFieldIndex.blue - this.blue) * 0.5;
                    this.color = 'rgb(' + this.red + ',' + this.green + ',' + this.blue + ')';
                }
            }
    
            this.speedX = Math.cos(this.angle);
            this.speedY = Math.sin(this.angle);
            this.x += this.speedX * this.speedModifier;
            this.y += this.speedY * this.speedModifier;
    
            this.history.push({x: this.x, y: this.y});
            if (this.history.length > this.maxLength){
                this.history.shift();
            }
        } else if (this.history.length > 1){
            this.history.shift();
        } else {
            this.reset();
        }

    }
    reset(){
        let attempts = 0;
        let resetSuccess = false;

        while (attempts < 30 && !resetSuccess){
            attempts++
            let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
            if (this.effect.flowField[testIndex].alpha > 0){
                this.x = this.effect.flowField[testIndex].x;
                this.y = this.effect.flowField[testIndex].y;
                this.history = [{x: this.x, y: this.y}];
                this.timer = this.maxLength * 2;
                resetSuccess = true;
            }
        }
        if (!resetSuccess){
            this.x = Math.random() * this.effect.width;
            this.y = Math.random() * this.effect.height;
            this.history = [{x: this.x, y: this.y}];
            this.timer = this.maxLength * 2;
        }


    }
}

class Effect {
    constructor(canvas, ctx){
        this.canvas = canvas;
        this.context = ctx;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 10000;
        this.cellSize = 1;
        this.rows;
        this.cols;
        this.flowField = [];
        this.debug = false;
        this.image = document.getElementById('star');
        this.init();
    }

    drawFlowFieldImage() {
        let imageAspectRatio = this.image.width / this.image.height;
        let canvasAspectRatio = this.width / this.height;
        let drawWidth, drawHeight;
    
        if (canvasAspectRatio > imageAspectRatio) {
            drawHeight = this.height;
            drawWidth = this.height * imageAspectRatio;
        } else {
            drawWidth = this.width;
            drawHeight = this.width / imageAspectRatio;
        }
    
        this.context.drawImage(this.image, 
            (this.width - drawWidth) * 0.5, 
            (this.height - drawHeight) * 0.5, 
            drawWidth, 
            drawHeight
        );
    }
    init(){
        // create flow field
        this.rows = Math.floor(this.height / this.cellSize);
        this.cols = Math.floor(this.width / this.cellSize);
        this.flowField = [];

        // draw image
        this.drawFlowFieldImage();

        // scan pixel data
        const pixels = this.context.getImageData(0, 0, this.width, this.height).data;
        for (let y = 0; y < this.height; y += this.cellSize){
            for (let x = 0; x < this.width; x += this.cellSize){
                const index = (y * this.width + x) * 4;
                const red = pixels[index];
                const green = pixels[index + 1];
                const blue = pixels[index + 2];
                const alpha = pixels[index + 3];
                const grayscale = (red + green + blue) / 3;
                const colorAngle = ((grayscale/255) * 6.28).toFixed(2);
                this.flowField.push({
                    x: x,
                    y: y,
                    red: red,
                    green: green,
                    blue: blue,
                    alpha: alpha,
                    colorAngle: colorAngle
                });
            }
        }

        // create particles
        this.particles = [];
        for (let i = 0; i < this.numberOfParticles; i++){
            this.particles.push(new Particle(this));
        }
        this.particles.forEach(particle => particle.reset());
    }
    drawGrid(){
        this.context.save();
        this.context.strokeStyle = 'white';
        this.context.lineWidth = 0.3;
        for (let c = 0; c < this.cols; c++){
            this.context.beginPath();
            this.context.moveTo(this.cellSize * c, 0);
            this.context.lineTo(this.cellSize * c, this.height);
            this.context.stroke();
        }
        for (let r = 0; r < this.rows; r++){
            this.context.beginPath();
            this.context.moveTo(0, this.cellSize * r);
            this.context.lineTo(this.width, this.cellSize * r);
            this.context.stroke();
        }
        this.context.restore();
    }
    resize(width, height){
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.init();
    }
    render(){
        if (this.debug) {
            this.drawGrid();
            this.drawFlowFieldImage();
        }
        this.particles.forEach(particle => {
            particle.draw(this.context);
            particle.update();
        });
    }

    start() {
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.render();
            this.animationId = requestAnimationFrame(animate)
        }
        animate()
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
    }
}

const main = () => {
    try {
        const maler = new Effect(canvas, ctx)

        return {
            startAnimation: () => {
                maler.start()
            },
            stopAnimation: () => {
                maler.stop()
            }
        }

    } catch (error) {
        console.error('Error initializing microphone:', error)
    }
}

const showStartStopAlert = (message, timeout = 500) => {
    const alertBox = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertOverlay = document.getElementById('customAlertOverlay');

    alertMessage.textContent = message;

    alertBox.style.display = 'block';
    alertOverlay.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
        alertOverlay.style.display = 'none';
    }, timeout);
}

(async () => {
    try {
        const animationInstance = main()

        let isAnimationRunning = false

        canvas.addEventListener('click', () => {
            if(isAnimationRunning){
                showStartStopAlert("Stopped")
                animationInstance.stopAnimation()
            }else {
                showStartStopAlert("Started")
                animationInstance.startAnimation()
            }
            isAnimationRunning = !isAnimationRunning
        })
    } catch (error) {
        console.error('Error initializing the animation instance:', error)
    }
})()
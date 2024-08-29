class Simulation {
    constructor(context, canvas) {
        // Parameters
        this.context = context;
        this.canvas = canvas;
        this.running = false;
        this.width = 800;
        this.height = 600;
        // Other configurations
        this.period = 50;
        this.dt = this.period / 1000;
        this.vMax = 20;
        this.vMin = -this.vMax;
        this.colors = {
            background: '#181818',
            guides: '#888888',
            reference: '#AA2200',
            object: '#88AA55',
        };
        this.guides_period = 50;
        this.guides_count = (this.height / this.guides_period) - 1;
        this.objWidth = 30;
        this.objHeight = 30;
        this.yMin = this.objHeight / 2;
        this.yMax = this.height - (this.objHeight / 2);
        // Reset transform in case context has already been scaled
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        // Scale to underlying context size
        this.context.scale(this.canvas.width/this.width, this.canvas.height/this.height);
        // Initialize and Render
        this.updateConfig();
        this.reset();
        this.render();
    }

    PID(value, dt) {
        // Reset PID state?
        if (this.pidState == null) {
            this.pidState = {
                previousError: 0.0,
                integralOfError: 0.0,
            }
        }
        // Error
        let error = this.reference - value;
        // Error Delta
        let deltaError = (error - this.pidState.previousError) / dt;
        // Compute PID output
        let output = this.kp * error + this.ki * this.pidState.integralOfError + this.kd * deltaError;
        // Update PID state
        this.pidState.integralOfError += error * dt;
        this.pidState.previousError = error;
        // Return PID output
        return output;
    }

    restart() {
        if (this.running) {
            this.stop();
        }
        this.start();
    }

    start() {
        this.reset();
        this.intervalId = setInterval(() => this.step(), this.period);
        this.running = true;
    }

    stop() {
        clearInterval(this.intervalId);
        this.running = false;
    }

    render() {
        // Background
        this.context.fillStyle = this.colors.background;
        this.context.fillRect(0, 0, this.width, this.height);
        // Guides
        for(let i = 0 ; i < this.guides_count ; i++) {
            let guide_y = this.guides_period * (i + 1);
            this.context.beginPath();
            this.context.setLineDash([5, 5]);
            this.context.strokeStyle = this.colors.guides;
            this.context.lineWidth = 2;
            this.context.moveTo(0, guide_y);
            this.context.lineTo(this.width, guide_y);
            this.context.stroke();
        }
        // Reference
        let reference_y = this.reference;
        this.context.beginPath();
        this.context.setLineDash([]);
        this.context.strokeStyle = this.colors.reference;
        this.context.lineWidth = 3;
        this.context.moveTo(0, reference_y);
        this.context.lineTo(this.width, reference_y);
        this.context.stroke();
        // Object
        let obj_x = (this.width / 2) - (this.objWidth / 2);
        let obj_y = this.y - (this.objHeight / 2);
        this.context.fillStyle = this.colors.object;
        //this.context.fillRect(obj_x, obj_y, this.objWidth, this.objHeight);
        this.context.beginPath();
        this.context.arc(this.width / 2, obj_y, this.objWidth, 0, 2 * Math.PI);
        this.context.fill();
    }

    updateConfig(reference=300, kp=1, ki=0, kd=0, load=0) {
        // PID
        this.reference = reference;
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        // Environment
        this.load = load;
    }

    resetPID(state=null) {
        this.pidState = state;
    }

    resetObject() {
        this.y = this.yMax;
        this.v = 0;
        this.pidOutput = 0;
    }

    reset() {
        this.resetPID();
        this.resetObject();
    }

    updateSystem() {
        this.pidOutput = this.PID(this.y, this.dt);
        this.v = Math.min(Math.max(this.v + this.pidOutput + this.load, this.vMin), this.vMax)
        this.y = Math.min(Math.max(this.y + this.v, this.yMin), this.yMax)
        console.log(`y=${this.y};v=${this.v};pid=${this.pidOutput};`)
    }

    step() {
        this.updateSystem();
        this.render();
    }

}

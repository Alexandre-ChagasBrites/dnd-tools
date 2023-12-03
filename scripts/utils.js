class Event {
    constructor() {
        this.listeners = [];
    }

    attach(listener) {
        this.listeners.push(listener);
    }

    notify(args) {
        for (const listener of this.listeners) {
            listener(args);
        }
    }
}

class Timer {
    constructor(delay) {
        this.id = null;
        this.delay = delay;
        this.time = 0;
        this.startTime = null;
        this.remainingTime = delay;
        this.changed = new Event();
    }

    start() {
        this.time = 0;
        this.remainingTime = this.delay;
        this.resume();
    }

    stop() {
        this.pause();
        this.time = 0;
        this.remainingTime = this.delay;
        this.changed.notify({ time: 0 });
    }

    resume() {
        this.startTime = new Date();
        this.id = window.setTimeout(() => {
            this.remainingTime = this.delay;
            this.resume();
            this.time += this.delay;
            this.changed.notify({ time: this.time });
        }, this.remainingTime);
    }

    pause() {
        window.clearTimeout(this.id);
        this.id = null;
        this.remainingTime -= new Date() - this.startTime;
    }
}

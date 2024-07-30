let instance = null;

class EventsDispatcher extends Phaser.Events.EventEmitter {

    constructor() {

        super();

        if (instance == null) {

            instance = this;
        }
    }
    static getInstance() {

        if (instance == null) {

            instance = new EventsDispatcher();
        }
        return instance;
    }
}


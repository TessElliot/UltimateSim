
class TitleScene extends Phaser.Scene {

    constructor() {
        super("bootGame");
    }

    init() {

    }

    preload() {

    }

    create() {
        const text = this.add.text(500, 300, 'Utimate Sim Start');
        text.setOrigin(0.5, 0.5);
        text.setInteractive();

        text.on('pointerdown', function (pointer) {
            this.scene.start('UI');
            this.scene.start('playingGame');
        }, this);
    }
}
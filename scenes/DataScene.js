import { GameScene } from './GameScene.js';

export class DataScene extends Phaser.Scene {

    async update() {

        const info = this.GameScene.sendData();
        console.log(info);

    }
}
// main.js
import { GameScene } from './scenes/GameScene.js';
import { fetchLandUseInBoundingBox } from './os.js'; // Adjusted path
// In main.js




window.onload = function () {

    const config = {
        type: Phaser.AUTO,
        width: 1000,
        height: 600,
        backgroundColor: 0x000000,
        autoCenter: true,
        parent: 'ultimateSim',
        scene: [TitleScene, GameScene]
    };

    game = new Phaser.Game(config);

}

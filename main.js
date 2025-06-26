// main.js
import { GameScene } from "./scenes/GameScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
import NewspaperScene from "./scenes/NewspaperScene.js";

// import { DataScene } from './scenes/DataScene.js';
// import { fetchLandUseInBoundingBox } from './os.js'; // Adjusted path
// import { fetchLocation } from './os.js';
// In main.js

window.onload = function () {
  const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    backgroundColor: 0x000000,
    autoCenter: true,
    scene: [TitleScene, GameScene, NewspaperScene],
    parent: "container",

    antialias: false,
    dom: {
      createContainer: true,
    },
  };

  var game = new Phaser.Game(config);
};

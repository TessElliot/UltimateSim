// main.js
import { GameScene } from "./scenes/GameScene.js";
import { TitleScene } from "./scenes/TitleScene.js";
// import NewspaperScene from "./scenes/NewspaperScene.js"; // DEACTIVATED

window.onload = function () {
    const config = {
        type: Phaser.AUTO,
        parent: "container",
        width: 1000,
        height: 600,
        backgroundColor: 0x000000,
        scene: [TitleScene, GameScene], // NewspaperScene removed
        antialias: false,
        dom: {
            createContainer: true,
        },
        scale: {
            mode: Phaser.Scale.NONE,  // ← Changed from FIT to NONE
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1000,
            height: 600
        },
        render: {
            pixelArt: false,
            antialias: false,              // ← Change to true for smoother sprites
            roundPixels: true,
            resolution: 2                  // ← Force 2x resolution (or higher)
        }
    };

    window.game = new Phaser.Game(config);

    // Track fullscreen state
    let isFullscreen = false;

    // Get container elements
    const container = document.getElementById('container');
    const outer = document.getElementById('outer');

    // Fullscreen toggle function
    window.toggleFullscreen = function () {
        if (!isFullscreen) {
            // ENTER FULLSCREEN

            // Store original styles
            container.dataset.originalPosition = container.style.position || '';
            container.dataset.originalWidth = container.style.width || '';
            container.dataset.originalHeight = container.style.height || '';
            container.dataset.originalAspectRatio = container.style.aspectRatio || '';

            // Break out of CSS constraints
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.aspectRatio = 'unset';
            container.style.zIndex = '9999';

            // Resize the game canvas to fill screen (shows MORE map)
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            window.game.scale.resize(newWidth, newHeight);

            // Update all camera viewports
            window.game.scene.scenes.forEach(scene => {
                if (scene.cameras && scene.cameras.main) {
                    scene.cameras.main.setSize(newWidth, newHeight);
                }
                // Update any additional cameras
                if (scene.cameras && scene.cameras.cameras) {
                    scene.cameras.cameras.forEach(cam => {
                        if (cam !== scene.cameras.main) {
                            // Adjust other cameras proportionally if needed
                        }
                    });
                }
            });

            isFullscreen = true;
            console.log("Entering fullscreen:", newWidth, "x", newHeight);

            // Notify scenes to reposition UI to new edges
            window.game.scene.scenes.forEach(scene => {
                if (scene.scene.isActive() && scene.repositionUI) {
                    scene.repositionUI();
                }
            });

        } else {
            // EXIT FULLSCREEN

            // Restore original styles
            container.style.position = container.dataset.originalPosition;
            container.style.top = '';
            container.style.left = '';
            container.style.width = container.dataset.originalWidth;
            container.style.height = container.dataset.originalHeight;
            container.style.aspectRatio = container.dataset.originalAspectRatio;
            container.style.zIndex = '';

            // Resize back to original
            window.game.scale.resize(1000, 600);

            // Reset all camera viewports
            window.game.scene.scenes.forEach(scene => {
                if (scene.cameras && scene.cameras.main) {
                    scene.cameras.main.setSize(1000, 600);
                }
            });

            isFullscreen = false;
            console.log("Exiting fullscreen: 1000 x 600");

            // Notify scenes
            window.game.scene.scenes.forEach(scene => {
                if (scene.scene.isActive() && scene.repositionUI) {
                    scene.repositionUI();
                }
            });
        }

        window.game.scale.refresh();
    };

    // Resize listener
    window.addEventListener('resize', () => {
        if (isFullscreen) {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            window.game.scale.resize(newWidth, newHeight);

            // Update cameras
            window.game.scene.scenes.forEach(scene => {
                if (scene.cameras && scene.cameras.main) {
                    scene.cameras.main.setSize(newWidth, newHeight);
                }
            });

            // Notify scenes
            window.game.scene.scenes.forEach(scene => {
                if (scene.scene.isActive() && scene.repositionUI) {
                    scene.repositionUI();
                }
            });
        }
    });
};
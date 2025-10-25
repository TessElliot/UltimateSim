// RumbleSprite.js
// CHATGPT VERSION 2025-10-25
// Provides both one-shot and continuous ambient rumble effects for sprites.

export class RumbleSprite {
    /**
     * Creates a new sprite rumble effect manager for a Phaser scene.
     * @param {Phaser.Scene} scene - The Phaser scene reference.
     */
    constructor(scene) {
        this.scene = scene;
        this.activeRumbles = new Set();
        this.ambientLoops = new Map();
    }

    /**
     * Applies a short-term impact rumble to a sprite (like an explosion or hit).
     * @param {Phaser.GameObjects.Sprite} sprite - The target sprite.
     * @param {Object} [config] - Configuration options.
     * @param {number} [config.intensity=5] - Max shake offset (px).
     * @param {number} [config.duration=400] - Total duration (ms).
     * @param {number} [config.frequency=30] - Interval between shakes (ms).
     * @param {number} [config.decay=0.9] - Strength decay per step (0–1).
     * @param {boolean} [config.flicker=true] - Whether to include alpha flicker.
     */
    rumble(sprite, config = {}) {
        const {
            intensity = 5,
            duration = 400,
            frequency = 30,
            decay = 0.9,
            flicker = true
        } = config;

        if (!sprite || !this.scene) return;

        const original = { x: sprite.x, y: sprite.y, alpha: sprite.alpha };
        let currentIntensity = intensity;
        const totalSteps = Math.ceil(duration / frequency);

        const rumbleTimer = this.scene.time.addEvent({
            delay: frequency,
            repeat: totalSteps,
            callback: () => {
                if (!sprite.active) return;

                const dx = Phaser.Math.Between(-currentIntensity, currentIntensity);
                const dy = Phaser.Math.Between(-currentIntensity, currentIntensity);

                sprite.x = original.x + dx;
                sprite.y = original.y + dy;

                if (flicker) sprite.alpha = 0.9 + Math.random() * 0.1;
                currentIntensity *= decay;
            },
            callbackScope: this
        });

        rumbleTimer.once('complete', () => {
            sprite.x = original.x;
            sprite.y = original.y;
            sprite.alpha = original.alpha;
            this.activeRumbles.delete(sprite);
        });

        this.activeRumbles.add(sprite);
    }

    /**
     * Starts a looping, subtle ambient rumble.
     * Ideal for machinery, engines, or background vibration.
     * @param {Phaser.GameObjects.Sprite} sprite - The target sprite.
     * @param {Object} [config] - Configuration options.
     * @param {number} [config.intensity=2] - Max offset in pixels.
     * @param {number} [config.frequency=60] - Update interval (ms).
     * @param {number} [config.speed=2] - Oscillation speed (Hz).
     * @param {boolean} [config.flicker=false] - Whether to flicker opacity.
     */
    startAmbientRumble(sprite, config = {}) {
        const {
            intensity = 2,
            frequency = 60,
            speed = 2,
            flicker = false
        } = config;

        if (!sprite || !this.scene) return;
        if (this.ambientLoops.has(sprite)) return; // prevent duplicate loops

        const original = { x: sprite.x, y: sprite.y, alpha: sprite.alpha };
        let elapsed = 0;

        const loop = this.scene.time.addEvent({
            delay: frequency,
            loop: true,
            callback: () => {
                if (!sprite.active) return;

                elapsed += frequency / 1000;
                const dx = Math.sin(elapsed * speed * Math.PI * 2) * intensity;
                const dy = Math.cos(elapsed * speed * Math.PI * 2) * intensity;

                sprite.x = original.x + dx;
                sprite.y = original.y + dy;

                if (flicker) sprite.alpha = 0.9 + Math.random() * 0.1;
            }
        });

        this.ambientLoops.set(sprite, { loop, original });
    }

    /**
     * Stops the ambient rumble for a specific sprite.
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    stopAmbientRumble(sprite) {
        const data = this.ambientLoops.get(sprite);
        if (data) {
            data.loop.remove();
            sprite.x = data.original.x;
            sprite.y = data.original.y;
            sprite.alpha = data.original.alpha;
            this.ambientLoops.delete(sprite);
        }
    }

    /**
     * Stops all rumbles and resets sprites.
     */
    stopAll() {
        this.activeRumbles.forEach(sprite => {
            if (sprite && sprite.active) sprite.alpha = 1;
        });
        this.activeRumbles.clear();

        this.ambientLoops.forEach((data, sprite) => {
            if (sprite && sprite.active) {
                sprite.x = data.original.x;
                sprite.y = data.original.y;
                sprite.alpha = data.original.alpha;
            }
            data.loop.remove();
        });
        this.ambientLoops.clear();
    }
}

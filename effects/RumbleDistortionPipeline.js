// RumbleDistortionPipeline.js
// CHATGPT VERSION 2025-10-25
// Phaser 3 custom WebGL pipeline that distorts sprite pixels using sine/cosine noise
// to create a vibrating or "rumbling" visual effect.

export default class RumbleDistortionPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game) {
        super({
            game,
            renderer: game.renderer,
            fragShader: `
            precision mediump float;
            uniform sampler2D uMainSampler;
            uniform float time;
            uniform float intensity;
            uniform float frequency;
            varying vec2 outTexCoord;

            void main(void) {
                // Base UV coordinates
                vec2 uv = outTexCoord;

                // Distort the UVs using sine and cosine functions
                float waveX = sin(uv.y * frequency + time * 10.0) * intensity;
                float waveY = cos(uv.x * frequency + time * 12.0) * intensity;

                vec2 distortedUV = uv + vec2(waveX, waveY);

                // Sample the sprite texture at distorted coordinates
                vec4 color = texture2D(uMainSampler, distortedUV);

                // Optional subtle flicker for energy
                float flicker = 0.97 + 0.03 * sin(time * 50.0);
                gl_FragColor = vec4(color.rgb * flicker, color.a);
            }
            `
        });

        // Default effect values
        this.intensity = 0.05;   // strength of distortion (0.0–0.3 typical)
        this.frequency = 25.0;   // wave density (10–60 typical)
    }

    onPreRender() {
        // Update time and uniforms each frame
        this.set1f('time', this.game.loop.time / 1000);
        this.set1f('intensity', this.intensity);
        this.set1f('frequency', this.frequency);
    }
}

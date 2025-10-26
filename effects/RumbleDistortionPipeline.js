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
            uniform float frameStart;  // Left edge of current frame in atlas (0.0-1.0)
            uniform float frameEnd;    // Right edge of current frame in atlas (0.0-1.0)
            varying vec2 outTexCoord;

            void main(void) {
                // Base UV coordinates
                vec2 uv = outTexCoord;

                // Remap UV coordinates from atlas space to local frame space
                float frameWidth = frameEnd - frameStart;
                uv.x = (uv.x - frameStart) / frameWidth;

                // Keep UVs within 0-1 range after remapping
                uv = clamp(uv, 0.0, 1.0);

                // Distort the UVs using sine and cosine functions
                float waveX = sin(uv.y * frequency + time * 10.0) * intensity;
                float waveY = cos(uv.x * frequency + time * 12.0) * intensity;

                vec2 distortedUV = uv + vec2(waveX, waveY);

                // Map back to atlas coordinates for sampling
                vec2 atlasUV = distortedUV;
                atlasUV.x = atlasUV.x * frameWidth + frameStart;

                // Sample the sprite texture at distorted coordinates
                vec4 color = texture2D(uMainSampler, atlasUV);

                // Optional subtle flicker for energy
                float flicker = 0.97 + 0.03 * sin(time * 50.0);
                gl_FragColor = vec4(color.rgb * flicker, color.a);
            }
            `
        });

        // Default effect values
        this.intensity = 0.001;   // strength of distortion (0.0–0.3 typical)
        this.frequency = 1.0;   // wave density (10–60 typical)
        this.frameStart = 0.0;   // Default to full texture
        this.frameEnd = 1.0;     // Default to full texture
    }

    onPreRender() {
        // Update time and uniforms each frame
        this.set1f('time', this.game.loop.time / 1000);
        this.set1f('intensity', this.intensity);
        this.set1f('frequency', this.frequency);
        this.set1f('frameStart', this.frameStart);
        this.set1f('frameEnd', this.frameEnd);
    }
}

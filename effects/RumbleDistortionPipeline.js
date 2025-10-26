// RumbleDistortionPipeline.js
// CHATGPT VERSION 2025-10-26
// Opposing-drift rumble shader with block coherence and pixel-scale correction.
// Top half drifts down, bottom half drifts up; all math scaled by pixelScale.

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
      uniform float blockScale;
      uniform float pixelScale;   // scale factor for sprite-to-texture size ratio
      uniform float frameWidth;   // width of each animation frame in pixels (32)
      uniform float frameStart;   // UV start of current frame (e.g., 0.125)
      uniform float frameEnd;     // UV end of current frame (e.g., 0.25)
      varying vec2 outTexCoord;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main(void) {
        vec2 uv = outTexCoord;

        // --- Remap current frame's UV space to 0-1 local space ---
        // When animation is paused, uv.x spans only the displayed frame (e.g., 0.125 to 0.25)
        float frameRange = frameEnd - frameStart;
        float localX = (uv.x - frameStart) / frameRange;  // remap to 0-1

        // Clamp to handle edge cases
        localX = clamp(localX, 0.0, 1.0);

        // Scale the normalized frame coordinates for distortion calculations
        // Use fixed scale (32.0) since we know frames are 32px
        vec2 distortUV = vec2(localX * 32.0, uv.y * 32.0);

        // larger coherent random blocks
        float rnd = random(floor(distortUV * (256.0 / blockScale)));

        // disturbance density: 20% top → 100% bottom
        float density = mix(0.2, 1.0, uv.y);

        if (rnd < density) {
          // horizontal jitter (static, no time component)
          float waveX = sin(distortUV.y * frequency) * intensity;

          // vertical base wave (time-based for rumble effect)
          float rawY = sin((distortUV.x * frequency * 0.8) + time * 1.8);
          float amp = abs(rawY) * intensity * 0.5;

          // top half down, bottom half up
          float direction = sign(uv.y - 0.5);
          float waveY = -direction * amp;

          uv += vec2(waveX, waveY);
        }

        vec4 color = texture2D(uMainSampler, uv);

        // slight flicker
        float flicker = 0.99 + 0.01 * sin(time * 30.0);
        gl_FragColor = vec4(color.rgb * flicker, color.a);
      }
      `
    });

    this.intensity = 0.0025;
    this.frequency = 150.0;
    this.blockScale = 2.0;
    this.pixelScale = 4.0; // ← adjust for your render scale (4× for 128-px sprites)
    this.frameWidth = 32.0; // width of each animation frame in pixels
    this.frameStart = 0.0;  // UV start of current frame (default: full texture)
    this.frameEnd = 1.0;    // UV end of current frame (default: full texture)
  }

  onPreRender() {
    this.set1f("time", this.game.loop.time / 1000.0);
    this.set1f("intensity", this.intensity);
    this.set1f("frequency", this.frequency);
    this.set1f("blockScale", this.blockScale);
    this.set1f("pixelScale", this.pixelScale);
    this.set1f("frameWidth", this.frameWidth);
    this.set1f("frameStart", this.frameStart);
    this.set1f("frameEnd", this.frameEnd);
  }
}

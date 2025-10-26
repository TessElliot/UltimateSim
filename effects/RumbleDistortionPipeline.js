// RumbleDistortionPipeline.js
// CHATGPT VERSION 2025-10-27
// Opposing-drift rumble shader with per-frame UV remapping.
// Works seamlessly on animated sprites in a texture atlas.

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
      uniform float pixelScale;
      uniform float tileRepeat;

      // --- NEW: animation-frame remap uniforms ---
      uniform float frameStart;
      uniform float frameEnd;

      varying vec2 outTexCoord;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main(void) {
        // --- map from atlas UVs to local 0-1 frame space ---
        float frameWidth = frameEnd - frameStart;
        vec2 uv = outTexCoord;
        uv.x = (uv.x - frameStart) / frameWidth;

        // scale into pixel space
        vec2 scaledUV = uv * pixelScale;

        // identify local 32-px segment
        float blockIndex = floor(scaledUV.x / tileRepeat);
        float localX = mod(scaledUV.x, tileRepeat);
        vec2 localUV = vec2(localX, scaledUV.y);

        // independent time offset per block
        float localTime = time + blockIndex * 19.37;

        // random field repeats per 32 px
        float rnd = random(floor(localUV * (256.0 / blockScale)));

        // vertical density 20 % → 100 % within frame
        float density = mix(0.2, 1.0, uv.y);

        if (rnd < density) {
          float normX = localX / tileRepeat;
          float waveX = sin(normX * frequency * 6.28318 + localTime * 2.0) * intensity;
          float rawY  = sin(normX * frequency * 0.8 * 6.28318 + localTime * 1.8);
          float amp   = abs(rawY) * intensity * 0.5;
          float direction = sign(uv.y - 0.5);
          float waveY = -direction * amp;
          uv += vec2(waveX, waveY);
        }

        vec4 color = texture2D(uMainSampler, uv);
        float flicker = 0.99 + 0.01 * sin(time * 30.0);
        gl_FragColor = vec4(color.rgb * flicker, color.a);
      }
      `
    });

    this.intensity   = 0.0025;
    this.frequency   = 1.0;
    this.blockScale  = 2.0;
    this.pixelScale  = 4.0;
    this.tileRepeat  = 32.0;
    this.frameStart  = 0.0;
    this.frameEnd    = 1.0;
  }

  onPreRender() {
    this.set1f("time", this.game.loop.time / 1000.0);
    this.set1f("intensity", this.intensity);
    this.set1f("frequency", this.frequency);
    this.set1f("blockScale", this.blockScale);
    this.set1f("pixelScale", this.pixelScale);
    this.set1f("tileRepeat", this.tileRepeat);
    this.set1f("frameStart", this.frameStart);
    this.set1f("frameEnd", this.frameEnd);
  }
}

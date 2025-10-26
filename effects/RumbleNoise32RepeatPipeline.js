// RumbleNoise32RepeatPipeline.js
// CHATGPT VERSION 2025-10-27
// Procedural noise distortion that repeats every 32 px horizontally.
// Works on horizontally animated spritesheets (no atlas).

export default class RumbleNoise32RepeatPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      renderer: game.renderer,
      fragShader: `
      precision mediump float;

      uniform sampler2D uMainSampler;
      uniform float time;
      uniform float intensity;   // pixel displacement magnitude (1–2 px)
      uniform float pixelScale;  // pixels per sprite width (≈32)
      uniform float frameWidth;  // frame width in pixels (e.g. 32)
      uniform float speed;       // scroll speed
      uniform float scale;       // noise frequency

      varying vec2 outTexCoord;

      // --- small procedural 2D noise ---
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0,0.0));
        float c = hash(i + vec2(0.0,1.0));
        float d = hash(i + vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
      }

      void main(void) {
        vec2 uv = outTexCoord;

        // --- Repeat horizontally every frameWidth pixels ---
        vec2 scaledUV = uv * pixelScale;
        float localX = mod(scaledUV.x, frameWidth);
        float normX = localX / frameWidth;     // 0–1 within each 32-px frame

        // scrolling noise field in local 0–1 coordinates
        vec2 nUV = vec2(normX, uv.y) * scale + vec2(time * speed, time * speed * 0.3);
        float n1 = noise(nUV);
        float n2 = noise(nUV + 19.37);

        // combine samples for XY displacement
        vec2 offset = (vec2(n1, n2) - 0.5) * 2.0;

        // convert desired pixel shift to UV units
        float pixelUV = intensity / pixelScale;
        uv += offset * pixelUV;

        vec4 color = texture2D(uMainSampler, uv);
        gl_FragColor = color;
      }
      `
    });

    // Tuned defaults for 32 px pixel-art animation
    this.pixelScale = 32.0;   // pixels per texture width
    this.frameWidth = 32.0;   // frame width in pixels
    this.intensity  = 2.0;    // 1–2 px displacement
    this.speed      = 0.1;
    this.scale      = 3.0;
  }

  onPreRender() {
    this.set1f('time', this.game.loop.time / 1000.0);
    this.set1f('intensity', this.intensity);
    this.set1f('pixelScale', this.pixelScale);
    this.set1f('frameWidth', this.frameWidth);
    this.set1f('speed', this.speed);
    this.set1f('scale', this.scale);
  }
}

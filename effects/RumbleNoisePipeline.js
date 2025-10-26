// RumbleNoisePipeline.js
// CHATGPT VERSION 2025-10-27
// Procedural noise-based rumble tuned for 32 px scale art.
// Produces subtle 1–2 px distortion, safe for animated sprites.

export default class RumbleNoisePipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
  constructor(game) {
    super({
      game,
      renderer: game.renderer,
      fragShader: `
      precision mediump float;

      uniform sampler2D uMainSampler;
      uniform float time;
      uniform float intensity;   // max pixel displacement in UV units
      uniform float speed;       // scroll rate of noise field
      uniform float pixelScale;  // pixels per sprite unit (≈32)
      uniform float scale;       // noise frequency

      varying vec2 outTexCoord;

      // --- 2D smooth hash noise ---
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

        // world-space procedural noise
        vec2 nUV = uv * scale + vec2(time * speed, time * speed * 0.3);
        float n1 = noise(nUV);
        float n2 = noise(nUV + 17.23);

        // combine two samples for xy offset
        vec2 offset = (vec2(n1, n2) - 0.5) * 2.0;

        // convert desired pixel displacement (1–2 px) into UV units
        float pixelUV = intensity / pixelScale; // 1 px = 1/pixelScale in UV
        uv += offset * pixelUV;

        vec4 color = texture2D(uMainSampler, uv);
        gl_FragColor = color;
      }
      `
    });

    // ---- Tuned defaults for 32 px scale ----
    this.pixelScale = 32.0;   // your sprite's pixel resolution
    this.intensity  = 0.1;    // max shift in pixels (1–2 px range)
    this.speed      = 100.0;    // noise scroll speed
    this.scale      = 3.0;    // noise repetition frequency
  }

  onPreRender() {
    this.set1f('time', this.game.loop.time / 1000.0);
    this.set1f('intensity', this.intensity);
    this.set1f('speed', this.speed);
    this.set1f('scale', this.scale);
    this.set1f('pixelScale', this.pixelScale);
  }
}

const VERTEX_SHADER = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float u_seed;

void main() {
  vec2 value = gl_FragCoord.xy * 0.001 + u_seed;

  for (int index = 0; index < 96; index++) {
    value = vec2(
      sin(value.y * 1.913 + float(index)),
      cos(value.x * 1.731 - float(index))
    ) + value.yx * 0.03125;
  }

  gl_FragColor = vec4(fract(value.x), fract(value.y), fract(value.x * value.y), 1.0);
}
`;

function gpuSupportReason(scope = globalThis) {
  const hasCanvas =
    typeof scope.OffscreenCanvas === "function" ||
    (scope.document && typeof scope.document.createElement === "function");
  if (!hasCanvas) return "Canvas is unavailable";
  if (typeof scope.requestAnimationFrame !== "function") {
    return "requestAnimationFrame is unavailable";
  }
  return null;
}

export function hasGpuSupport(scope = globalThis) {
  return gpuSupportReason(scope) === null;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL could not allocate a shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "unknown shader compilation error";
    gl.deleteShader(shader);
    throw new Error(`WebGL shader compilation failed: ${message}`);
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("WebGL could not allocate a program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "unknown program link error";
    gl.deleteProgram(program);
    throw new Error(`WebGL program linking failed: ${message}`);
  }

  return program;
}

export class GpuBurner {
  constructor({ intensity }, scope = globalThis) {
    this.intensity = intensity;
    this.scope = scope;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.buffer = null;
    this.animationFrame = null;
    this.seed = 0;
  }

  start() {
    if (this.animationFrame !== null) return;

    const unsupported = gpuSupportReason(this.scope);
    if (unsupported) throw new Error(`GPU mode cannot start: ${unsupported}`);

    this.canvas =
      typeof this.scope.OffscreenCanvas === "function"
        ? new this.scope.OffscreenCanvas(512, 512)
        : this.scope.document.createElement("canvas");
    this.canvas.width = 512;
    this.canvas.height = 512;

    const gl = this.canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      desynchronized: true,
      preserveDrawingBuffer: false,
      stencil: false,
    });
    if (!gl) {
      this.canvas = null;
      throw new Error("GPU mode cannot start: WebGL is unavailable or disabled");
    }

    try {
      this.gl = gl;
      this.program = createProgram(gl);
      this.buffer = gl.createBuffer();
      if (!this.buffer) throw new Error("WebGL could not allocate a buffer");

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      gl.useProgram(this.program);

      const position = gl.getAttribLocation(this.program, "a_position");
      if (position < 0) throw new Error("WebGL could not locate the position attribute");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      const seedLocation = gl.getUniformLocation(this.program, "u_seed");
      const draw = () => {
        if (this.animationFrame === null || !this.gl) return;

        const passes = Math.max(1, Math.ceil(this.intensity * 12));
        for (let pass = 0; pass < passes; pass += 1) {
          this.seed = (this.seed + 0.000173) % 1000;
          gl.uniform1f(seedLocation, this.seed);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        gl.flush();
        this.animationFrame = this.scope.requestAnimationFrame(draw);
      };

      // A non-null sentinel makes the first draw part of the running state.
      this.animationFrame = -1;
      draw();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  setIntensity(intensity) {
    this.intensity = intensity;
  }

  stop() {
    if (this.animationFrame !== null && this.animationFrame !== -1) {
      this.scope.cancelAnimationFrame?.(this.animationFrame);
    }
    this.animationFrame = null;

    if (this.gl) {
      if (this.buffer) this.gl.deleteBuffer(this.buffer);
      if (this.program) this.gl.deleteProgram(this.program);
      this.gl.getExtension("WEBGL_lose_context")?.loseContext();
    }

    if (this.canvas) {
      this.canvas.width = 1;
      this.canvas.height = 1;
    }

    this.buffer = null;
    this.program = null;
    this.gl = null;
    this.canvas = null;
  }
}

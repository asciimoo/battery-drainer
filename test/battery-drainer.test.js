import assert from "node:assert/strict";
import test from "node:test";

import { BatteryDrainer, MODES, getSupport } from "../src/index.js";

function createFakeEnvironment() {
  const workers = [];
  const contexts = [];
  const cancelledFrames = [];
  let nextFrame = 1;

  class FakeWorker {
    constructor(url, options) {
      this.url = url;
      this.options = options;
      this.messages = [];
      this.terminated = false;
      workers.push(this);
    }

    postMessage(message) {
      this.messages.push(message);
    }

    terminate() {
      this.terminated = true;
    }
  }

  class FakeGl {
    VERTEX_SHADER = 1;
    FRAGMENT_SHADER = 2;
    COMPILE_STATUS = 3;
    LINK_STATUS = 4;
    ARRAY_BUFFER = 5;
    STATIC_DRAW = 6;
    FLOAT = 7;
    TRIANGLES = 8;

    constructor() {
      this.draws = 0;
      this.contextLost = false;
      contexts.push(this);
    }

    createShader() {
      return {};
    }
    shaderSource() {}
    compileShader() {}
    getShaderParameter() {
      return true;
    }
    getShaderInfoLog() {
      return "";
    }
    deleteShader() {}
    createProgram() {
      return {};
    }
    attachShader() {}
    linkProgram() {}
    getProgramParameter() {
      return true;
    }
    getProgramInfoLog() {
      return "";
    }
    deleteProgram() {}
    createBuffer() {
      return {};
    }
    bindBuffer() {}
    bufferData() {}
    useProgram() {}
    getAttribLocation() {
      return 0;
    }
    enableVertexAttribArray() {}
    vertexAttribPointer() {}
    viewport() {}
    getUniformLocation() {
      return {};
    }
    uniform1f() {}
    drawArrays() {
      this.draws += 1;
    }
    flush() {}
    deleteBuffer() {}
    getExtension(name) {
      if (name !== "WEBGL_lose_context") return null;
      return {
        loseContext: () => {
          this.contextLost = true;
        },
      };
    }
  }

  const scope = {
    Blob: class FakeBlob {},
    Worker: FakeWorker,
    URL: {
      createObjectURL: () => "blob:test-worker",
      revokeObjectURL: () => {},
    },
    document: {
      createElement: (name) => {
        assert.equal(name, "canvas");
        return {
          width: 0,
          height: 0,
          getContext: () => new FakeGl(),
        };
      },
    },
    navigator: { hardwareConcurrency: 8 },
    requestAnimationFrame: () => nextFrame++,
    cancelAnimationFrame: (frame) => cancelledFrames.push(frame),
  };

  return { cancelledFrames, contexts, scope, workers };
}

test("requires the caller to select a valid mode", () => {
  assert.throws(
    () => new BatteryDrainer(),
    /mode is required; choose "cpu", "gpu", or "both" explicitly/,
  );
  assert.throws(() => new BatteryDrainer({ mode: "automatic" }), /mode must be one of/);
  assert.throws(
    () => new BatteryDrainer({ mode: MODES.CPU, intensity: 0 }),
    /intensity/,
  );
  assert.throws(
    () => new BatteryDrainer({ mode: MODES.CPU, workers: 65 }),
    /workers/,
  );
});

test("starts, updates, switches, stops, and destroys explicit modes", () => {
  const environment = createFakeEnvironment();
  const drainer = new BatteryDrainer(
    { mode: MODES.BOTH, intensity: 0.5, workers: 2 },
    environment.scope,
  );

  assert.deepEqual(getSupport(environment.scope), {
    cpu: true,
    gpu: true,
    both: true,
  });

  assert.equal(drainer.start(), drainer);
  assert.equal(drainer.running, true);
  assert.equal(environment.workers.length, 2);
  assert.equal(environment.contexts.length, 1);
  assert.equal(environment.contexts[0].draws, 6);

  drainer.setIntensity(0.75);
  for (const worker of environment.workers) {
    assert.deepEqual(worker.messages.at(-1), {
      type: "intensity",
      intensity: 0.75,
    });
  }

  drainer.setMode(MODES.GPU);
  assert.equal(drainer.running, true);
  assert.equal(drainer.mode, MODES.GPU);
  assert.equal(environment.workers.every((worker) => worker.terminated), true);
  assert.equal(environment.contexts[0].contextLost, true);
  assert.equal(environment.contexts.length, 2);

  drainer.stop();
  assert.equal(drainer.running, false);
  assert.equal(environment.contexts[1].contextLost, true);
  assert.equal(environment.cancelledFrames.length, 2);

  drainer.destroy();
  assert.equal(drainer.destroyed, true);
  assert.throws(() => drainer.start(), /has been destroyed/);
});

test("never chooses a fallback when the selected mode is unsupported", () => {
  const drainer = new BatteryDrainer(
    { mode: MODES.CPU },
    {
      document: { createElement: () => ({}) },
      requestAnimationFrame: () => 1,
    },
  );

  assert.throws(
    () => drainer.start(),
    /will not select a fallback mode automatically/,
  );
  assert.equal(drainer.running, false);
});

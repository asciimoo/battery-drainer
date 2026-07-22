import {
  DEFAULT_INTENSITY,
  MODES,
  assertIntensity,
  assertMode,
  assertWorkers,
} from "./constants.js";
import { CpuBurner, hasCpuSupport } from "./cpu-burner.js";
import { GpuBurner, hasGpuSupport } from "./gpu-burner.js";

function defaultWorkerCount(scope = globalThis) {
  const cores = Number(scope.navigator?.hardwareConcurrency);
  return Number.isFinite(cores) ? Math.max(1, Math.min(64, Math.floor(cores) - 1)) : 1;
}

export function getSupport(scope = globalThis) {
  const cpu = hasCpuSupport(scope);
  const gpu = hasGpuSupport(scope);
  return Object.freeze({ cpu, gpu, both: cpu && gpu });
}

export class BatteryDrainer {
  #scope;
  #burners = [];
  #destroyed = false;
  #running = false;

  constructor(options = {}, scope = globalThis) {
    if (!("mode" in options)) {
      throw new TypeError(
        'mode is required; choose "cpu", "gpu", or "both" explicitly',
      );
    }

    const intensity = options.intensity ?? DEFAULT_INTENSITY;
    const workers = options.workers ?? defaultWorkerCount(scope);

    assertMode(options.mode);
    assertIntensity(intensity);
    assertWorkers(workers);

    this.mode = options.mode;
    this.intensity = intensity;
    this.workers = workers;
    this.#scope = scope;
  }

  get running() {
    return this.#running;
  }

  get destroyed() {
    return this.#destroyed;
  }

  get status() {
    return Object.freeze({
      mode: this.mode,
      intensity: this.intensity,
      workers: this.workers,
      running: this.#running,
      destroyed: this.#destroyed,
    });
  }

  start() {
    this.#assertAlive();
    if (this.#running) return this;

    const support = getSupport(this.#scope);
    if (!support[this.mode]) {
      throw new Error(
        `${this.mode.toUpperCase()} mode is not supported in this environment; ` +
          "Battery Drainer will not select a fallback mode automatically",
      );
    }

    const options = { intensity: this.intensity, workers: this.workers };
    this.#burners = [];
    if (this.mode === MODES.CPU || this.mode === MODES.BOTH) {
      this.#burners.push(new CpuBurner(options, this.#scope));
    }
    if (this.mode === MODES.GPU || this.mode === MODES.BOTH) {
      this.#burners.push(new GpuBurner(options, this.#scope));
    }

    try {
      for (const burner of this.#burners) burner.start();
      this.#running = true;
      return this;
    } catch (error) {
      for (const burner of this.#burners) burner.stop();
      this.#burners = [];
      throw error;
    }
  }

  stop() {
    if (this.#destroyed) return this;
    for (const burner of this.#burners) burner.stop();
    this.#burners = [];
    this.#running = false;
    return this;
  }

  setMode(mode) {
    this.#assertAlive();
    assertMode(mode);
    if (mode === this.mode) return this;

    const wasRunning = this.#running;
    if (wasRunning) this.stop();
    this.mode = mode;
    if (wasRunning) this.start();
    return this;
  }

  setIntensity(intensity) {
    this.#assertAlive();
    assertIntensity(intensity);
    this.intensity = intensity;
    for (const burner of this.#burners) burner.setIntensity(intensity);
    return this;
  }

  destroy() {
    if (this.#destroyed) return;
    this.stop();
    this.#destroyed = true;
  }

  #assertAlive() {
    if (this.#destroyed) {
      throw new Error("This BatteryDrainer has been destroyed");
    }
  }
}

export function createBatteryDrainer(options) {
  return new BatteryDrainer(options);
}

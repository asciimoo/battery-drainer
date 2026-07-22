const WORKER_SOURCE = String.raw`
let running = false;
let intensity = 0.5;
let state = (Date.now() ^ 0x9e3779b9) >>> 0;

function work() {
  if (!running) return;

  const period = 32;
  const workFor = period * intensity;
  const started = performance.now();

  do {
    for (let i = 0; i < 512; i += 1) {
      state = (Math.imul(state ^ (state >>> 16), 2246822507) + i) >>> 0;
      state ^= Math.floor(Math.sin(state) * 2147483647);
    }
  } while (performance.now() - started < workFor);

  const idleFor = Math.max(0, period - workFor);
  setTimeout(work, idleFor);
}

self.onmessage = ({ data }) => {
  if (data.type === "start") {
    intensity = data.intensity;
    if (!running) {
      running = true;
      work();
    }
  } else if (data.type === "intensity") {
    intensity = data.intensity;
  } else if (data.type === "stop") {
    running = false;
  }
};
`;

function cpuSupportReason(scope = globalThis) {
  if (typeof scope.Worker !== "function") return "Web Workers are unavailable";
  if (typeof scope.Blob !== "function") return "Blob URLs are unavailable";
  if (
    typeof scope.URL !== "function" &&
    (typeof scope.URL !== "object" || scope.URL === null)
  ) {
    return "Blob URLs are unavailable";
  }
  if (typeof scope.URL.createObjectURL !== "function") return "Blob URLs are unavailable";
  return null;
}

export function hasCpuSupport(scope = globalThis) {
  return cpuSupportReason(scope) === null;
}

export class CpuBurner {
  constructor({ intensity, workers }, scope = globalThis) {
    this.intensity = intensity;
    this.workerCount = workers;
    this.scope = scope;
    this.workerInstances = [];
  }

  start() {
    if (this.workerInstances.length > 0) return;

    const unsupported = cpuSupportReason(this.scope);
    if (unsupported) throw new Error(`CPU mode cannot start: ${unsupported}`);

    const blob = new this.scope.Blob([WORKER_SOURCE], {
      type: "text/javascript",
    });
    const workerUrl = this.scope.URL.createObjectURL(blob);

    try {
      for (let index = 0; index < this.workerCount; index += 1) {
        const worker = new this.scope.Worker(workerUrl, {
          name: `battery-drainer-${index + 1}`,
        });
        worker.postMessage({ type: "start", intensity: this.intensity });
        this.workerInstances.push(worker);
      }
    } catch (error) {
      this.stop();
      throw error;
    } finally {
      this.scope.URL.revokeObjectURL(workerUrl);
    }
  }

  setIntensity(intensity) {
    this.intensity = intensity;
    for (const worker of this.workerInstances) {
      worker.postMessage({ type: "intensity", intensity });
    }
  }

  stop() {
    for (const worker of this.workerInstances) {
      worker.postMessage({ type: "stop" });
      worker.terminate();
    }
    this.workerInstances = [];
  }
}

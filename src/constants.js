export const MODES = Object.freeze({
  CPU: "cpu",
  GPU: "gpu",
  BOTH: "both",
});

export const VALID_MODES = new Set(Object.values(MODES));

export const DEFAULT_INTENSITY = 0.5;

export function assertMode(mode) {
  if (!VALID_MODES.has(mode)) {
    throw new TypeError(
      `mode must be one of ${Array.from(VALID_MODES, (value) => `"${value}"`).join(
        ", ",
      )}; received ${JSON.stringify(mode)}`,
    );
  }
}

export function assertIntensity(intensity) {
  if (
    typeof intensity !== "number" ||
    !Number.isFinite(intensity) ||
    intensity <= 0 ||
    intensity > 1
  ) {
    throw new RangeError("intensity must be a finite number greater than 0 and at most 1");
  }
}

export function assertWorkers(workers) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 64) {
    throw new RangeError("workers must be an integer between 1 and 64");
  }
}

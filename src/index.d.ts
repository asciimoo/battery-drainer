export type DrainMode = "cpu" | "gpu" | "both";

export interface BatteryDrainerOptions {
  /** Required by design: the library never chooses a mode on the user's behalf. */
  mode: DrainMode;
  /** A value greater than 0 and at most 1. Defaults to 0.5. */
  intensity?: number;
  /** Number of CPU Web Workers, from 1 through 64. */
  workers?: number;
}

export interface BatteryDrainerStatus {
  readonly mode: DrainMode;
  readonly intensity: number;
  readonly workers: number;
  readonly running: boolean;
  readonly destroyed: boolean;
}

export interface BatteryDrainerSupport {
  readonly cpu: boolean;
  readonly gpu: boolean;
  readonly both: boolean;
}

export declare const MODES: Readonly<{
  CPU: "cpu";
  GPU: "gpu";
  BOTH: "both";
}>;

export declare class BatteryDrainer {
  constructor(options: BatteryDrainerOptions);
  mode: DrainMode;
  intensity: number;
  workers: number;
  readonly running: boolean;
  readonly destroyed: boolean;
  readonly status: BatteryDrainerStatus;
  start(): this;
  stop(): this;
  setMode(mode: DrainMode): this;
  setIntensity(intensity: number): this;
  destroy(): void;
}

export declare function createBatteryDrainer(
  options: BatteryDrainerOptions,
): BatteryDrainer;

export declare function getSupport(): BatteryDrainerSupport;

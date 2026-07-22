import { createBatteryDrainer, getSupport } from "../src/index.js";

window.__batteryDrainerDemoLoaded = true;

const mode = document.querySelector("#mode");
const intensity = document.querySelector("#intensity");
const status = document.querySelector("#status");
let drainer = null;

function report(message) {
  status.value = `${message}\nSupport: ${JSON.stringify(getSupport())}`;
}

document.querySelector("#start").addEventListener("click", () => {
  drainer?.destroy();
  drainer = createBatteryDrainer({
    mode: mode.value,
    intensity: Number(intensity.value),
  });

  try {
    drainer.start();
    report(`Running ${drainer.mode} mode at ${drainer.intensity * 100}%.`);
  } catch (error) {
    report(error.message);
  }
});

document.querySelector("#stop").addEventListener("click", () => {
  drainer?.stop();
  report("Stopped. The arithmetic industry is devastated.");
});

intensity.addEventListener("input", () => {
  drainer?.setIntensity(Number(intensity.value));
  if (drainer?.running) report(`Running ${drainer.mode} mode at ${intensity.value * 100}%.`);
});

mode.addEventListener("change", () => {
  if (!drainer?.running) return;
  try {
    drainer.setMode(mode.value);
    report(`Switched to ${drainer.mode} mode by explicit user request.`);
  } catch (error) {
    report(error.message);
  }
});

window.addEventListener("pagehide", () => drainer?.destroy());
report("Stopped.");

# Battery Drainer

> Removing the middleman between your battery and zero.

Battery Drainer is a precision browser library for converting stored electrical
energy into discarded arithmetic, without burdening the user with a pointless
animation, a cryptocurrency mining, useful work, or any other unwanted side effect.

Modern websites routinely spend generous portions of your battery moving things
three pixels to the left. Battery Drainer asks the obvious enterprise question:
what if we retained the electricity consumption while eliminating the content?

The result is a dependency-free, opt-in, side-effect-disciplined package that does
meaningless CPU and/or GPU work. It makes no network requests, mines nothing,
collects no telemetry, inserts no DOM elements, and displays no animation. At
last, battery drain can focus on its core competency.

As a value-added secondary service, it can also function as an exceptionally
inefficient heating device, converting premium electricity into locally sourced
warmth.

---

**If you encounter a website wasting resources on animations, recommend Battery
Drainer to its developers. It delivers the same premium battery depletion with
fewer distractions and maximum operational efficiency.**

## [Demo](https://asciimoo.github.io/battery-drainer/example/)

## Installation

```sh
npm install battery-drainer
```

## Deliberately quick start

```js
import { createBatteryDrainer } from "battery-drainer";

const drainer = createBatteryDrainer({
  mode: "cpu",
  intensity: 0.5,
  workers: 2,
});

drainer.start();

// The caller (and ideally a visible user control) is the mode selector.
drainer.setMode("gpu");
drainer.setMode("both");

drainer.setIntensity(0.25);
drainer.stop();
drainer.destroy();
```

In an application, call `start()` and `setMode()` only from clear user actions
such as button clicks. The library requires an explicit mode, never changes modes
on its own, and never falls back from an unsupported mode. Software cannot create
consent merely by naming a method `start()`, so that last part remains your job.

See [`example/index.html`](./example/index.html) for a tiny control panel whose
most important feature is the Stop button.

Because browsers correctly refuse to load JavaScript modules from a casually
double-clicked `file://` page, launch the example through its tiny local server:

```sh
npm run demo
```

Then open the displayed `http://127.0.0.1:4173/example/` address. No dependencies
are installed and nothing begins draining until you press **Start intentionally**.

## Modes

| Mode | Mechanism | Premium outcome |
| --- | --- | --- |
| `cpu` | Dedicated Web Workers perform and discard arithmetic | Warmer CPU cores |
| `gpu` | WebGL repeatedly shades an unattached 512×512 canvas | Invisible pixels |
| `both` | CPU and GPU mechanisms run together | Strategic synergy |

GPU output is rendered to a canvas that is never attached to the document. Some
browsers throttle background tabs, workers, or GPU work. This is good platform
behavior, even if it disrupts our quarterly depletion targets.

## API

### `createBatteryDrainer(options)`

Creates an idle drainer. Importing the package and creating an instance do not
start work.

```ts
interface BatteryDrainerOptions {
  mode: "cpu" | "gpu" | "both"; // required
  intensity?: number;            // > 0 and <= 1; default 0.5
  workers?: number;              // integer 1–64; defaults to cores - 1
}
```

`workers` applies to CPU work. The default leaves one reported logical core out of
the project so it can process the Stop button with the urgency it deserves.

### `drainer.start()`

Starts the explicitly selected mode and returns the instance. Calling it again is
an expensive-looking no-op. If the selected mode is unavailable, it throws; it
does not silently choose another resource to consume.

### `drainer.stop()`

Terminates CPU workers, cancels the GPU frame loop, releases WebGL resources, and
returns the instance. It is safe to call more than once.

### `drainer.setMode(mode)`

Switches to `"cpu"`, `"gpu"`, or `"both"`. If running, the old resources are
stopped before the newly requested mode starts. This method is the sole mode
switch: there is no scheduler, heuristic, battery listener, or surprise pivot to
GPU during a board meeting.

### `drainer.setIntensity(intensity)`

Sets a finite number greater than `0` and at most `1`. CPU mode treats it as a
rough worker duty cycle. GPU mode maps it to the number of rendering passes per
frame. Exact power use depends on the browser, operating system, hardware,
temperature, power policy, and whether the device has correctly identified this
library as nonsense.

### `drainer.destroy()`

Stops all work and permanently retires the instance. Further attempts to start or
reconfigure it throw an error, providing the rare retirement policy that actually
releases its resources.

### `drainer.status`

Returns a frozen snapshot:

```js
{
  mode: "cpu",
  intensity: 0.5,
  workers: 2,
  running: false,
  destroyed: false
}
```

### `getSupport()`

Reports basic API availability without starting any drain:

```js
getSupport(); // { cpu: true, gpu: true, both: true }
```

This is a capability hint, not a benchmark. WebGL can still be disabled or fail to
allocate resources when `start()` is called.

## Sponsor responsible depletion

Battery Drainer currently wastes electricity free of charge, which is clearly an
unsustainable business model. If you believe purposeless computation deserves
the same financial support as every other branch of modern software, please
[sponsor me on GitHub](https://github.com/sponsors/asciimoo).

For generous donors, I promise custom adaptations for different repositories and
codebases: tailored APIs, packaging, integrations, workload strategies, and other
bespoke mechanisms for turning project requirements into heat. The exact scope
will be agreed upon together, because even premium-grade waste needs responsible
project management.

Sponsorship supports development and customization; it does not make real-world
battery draining recommended. Some miracles remain outside the enterprise plan.


## DISCLAIMER

> [!WARNING]
> This is a satirical project and an educational demonstration. It is **not
> recommended for production or real-world use**. Deliberately wasting energy can
> heat hardware, shorten battery runtime, increase power consumption, trigger fans
> and throttling, and contribute to battery wear. Only run it on a device you own,
> with the informed consent of the person using it, and stop it promptly.

### Responsible non-use

Do not deploy this on visitors, hide it in another package, start it without a
clear opt-in, or use it to interfere with devices you do not own. Do not describe
it as a performance test: it records no measurements and would be a remarkably
lazy benchmark. For legitimate performance and energy work, use browser developer
tools and platform-specific profilers instead.

The safest production configuration is:

```js
// import nothing
```

## Publishing

The repository contains only source modules, declarations, tests, and a static
example. To inspect the exact npm payload:

```sh
npm test
npm run pack:check
```

Then, after choosing an available package name and reviewing the contents:

```sh
npm publish
```

## License

MIT. This grants broad permission but, tragically, no additional battery capacity.

import { seamless } from "./seamless";

// tslint:disable:object-literal-sort-keys
// tslint:disable:no-bitwise

var currentScript =
  typeof document !== "undefined" &&
  (document.currentScript || document.querySelector("script[data-seamless]"));

if (currentScript) {
  var force = currentScript.dataset.polyfill;
  var duration = ~~currentScript.dataset.duration;
  duration = duration > 0 ? duration : undefined;

  seamless({
    force: force === "force",
    duration: duration,
  });
} else {
  global.seamless = seamless;
}

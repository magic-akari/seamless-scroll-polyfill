import { seamless } from "./index.js";

// tslint:disable:no-bitwise

(function(currentScript, duration) {
    if (currentScript) {
        duration = ~~currentScript.dataset.duration;
        duration = duration > 0 ? duration : undefined;

        seamless({ duration: duration });
    }
})(document.currentScript || document.querySelector("script[data-seamless]"));

export * from "./index.js";

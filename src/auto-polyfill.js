import { seamless } from "./index.js";

// tslint:disable:no-bitwise

const currentScript =
    typeof document !== "undefined" && (document.currentScript || document.querySelector("script[data-seamless]"));

if (currentScript) {
    let duration = ~~currentScript.dataset.duration;
    duration = duration > 0 ? duration : undefined;

    seamless({ duration });
}

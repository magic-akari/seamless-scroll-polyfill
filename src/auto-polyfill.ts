import { seamless } from "./index.js";

((currentScript) => {
    if (currentScript) {
        let duration: number | undefined = ~~currentScript.dataset.duration;
        duration = duration > 0 ? duration : undefined;

        seamless({ duration });
    }
})(document.currentScript || document.querySelector("script[data-seamless]"));

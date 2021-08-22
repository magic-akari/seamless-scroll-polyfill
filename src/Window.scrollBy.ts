import { IScrollConfig, isObject, isScrollBehaviorSupported, nonFinite, original } from "./common.js";
import { windowScroll } from "./Window.scroll.js";

export const windowScrollBy = (
    currentWindow: typeof window,
    options: ScrollToOptions,
    config?: IScrollConfig,
): void => {
    const left = nonFinite(options.left || 0) + (currentWindow.scrollX || currentWindow.pageXOffset);
    const top = nonFinite(options.top || 0) + (currentWindow.scrollY || currentWindow.pageYOffset);

    if (options.behavior !== "smooth") {
        return original.windowScroll.call(currentWindow, left, top);
    }

    return windowScroll(currentWindow, { ...options, left, top }, config);
};

export const windowScrollByPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    window.scrollBy = function scrollBy() {
        if (arguments.length === 1) {
            const scrollByOptions = arguments[0];
            if (!isObject(scrollByOptions)) {
                throw new TypeError(
                    "Failed to execute 'scrollBy' on 'Window': parameter 1 ('options') is not an object.",
                );
            }

            return windowScrollBy(this, scrollByOptions, config);
        }

        const left = Number(arguments[0]);
        const top = Number(arguments[1]);

        return windowScrollBy(this, { left, top });
    };
};

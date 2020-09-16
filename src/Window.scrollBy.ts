import {
    IAnimationOptions,
    IScrollToOptions,
    isObject,
    isScrollBehaviorSupported,
    nonFinite,
    original,
} from "./common.js";
import { windowScroll } from "./Window.scroll.js";

export const windowScrollBy = (options: IScrollToOptions) => {
    const left = nonFinite(options.left || 0) + (window.scrollX || window.pageXOffset);
    const top = nonFinite(options.top || 0) + (window.scrollY || window.pageYOffset);

    if (options.behavior !== "smooth") {
        return original.windowScroll.call(window, left, top);
    }

    return windowScroll({ ...options, left, top });
};

export const windowScrollByPolyfill = (animationOptions?: IAnimationOptions) => {
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

            const left = Number(scrollByOptions.left);
            const top = Number(scrollByOptions.top);

            return windowScrollBy({ ...scrollByOptions, left, top, ...animationOptions });
        }

        const left = Number(arguments[0]);
        const top = Number(arguments[1]);

        return windowScrollBy({ left, top });
    };
};

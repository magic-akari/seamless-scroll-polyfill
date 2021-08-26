import { getOriginalMethod, isScrollBehaviorSupported, markPolyfill } from "../.internal/common.js";
import type { IScrollConfig } from "../.internal/scroll-step";
import { windowScroll, windowScrollBy, windowScrollTo } from "./scroll.js";

export const windowScrollPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = getOriginalMethod(window, "scroll");

    window.scroll = function scroll() {
        const args = arguments;
        if (args.length === 1) {
            windowScroll(this, args[0], config);
            return;
        }

        originalFunc.apply(this, args as any);
    };

    markPolyfill(window.scroll);
};

export const windowScrollToPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = getOriginalMethod(window, "scrollTo");

    window.scrollTo = function scrollTo() {
        const args = arguments;
        if (args.length === 1) {
            windowScrollTo(this, args[0], config);
            return;
        }

        originalFunc.apply(this, args as any);
    };

    markPolyfill(window.scrollTo);
};

export const windowScrollByPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    window.scrollBy = function scrollBy() {
        const args = arguments;
        if (args.length === 1) {
            windowScrollBy(this, args[0], config);
            return;
        }

        const [left, top] = args as unknown as [number, number];

        windowScrollBy(this, { left, top }, config);
    };

    markPolyfill(window.scrollBy);
};

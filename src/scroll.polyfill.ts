import {
    elementScrollXY,
    getOriginalMethod,
    isScrollBehaviorSupported,
    markPolyfill,
    modifyPrototypes,
} from "../.internal/common.js";
import type { IScrollConfig } from "../.internal/scroll-step";
import {
    elementScroll,
    elementScrollBy,
    elementScrollTo,
    windowScroll,
    windowScrollBy,
    windowScrollTo,
} from "./scroll.js";

export const elementScrollPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = getOriginalMethod(window.HTMLElement.prototype, "scroll", elementScrollXY);

    modifyPrototypes((prototype) => {
        prototype.scroll = function scroll(): void {
            const args = arguments;
            if (args.length === 1) {
                elementScroll(this, args[0], config);
                return;
            }

            originalFunc.apply(this, args as any);
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        markPolyfill(prototype.scroll);
    });
};

export const elementScrollToPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = getOriginalMethod(window.HTMLElement.prototype, "scrollTo", elementScrollXY);

    modifyPrototypes((prototype) => {
        prototype.scrollTo = function scrollTo(): void {
            const args = arguments;
            if (args.length === 1) {
                elementScrollTo(this, args[0], config);
                return;
            }

            originalFunc.apply(this, args as any);
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        markPolyfill(prototype.scrollTo);
    });
};

export const elementScrollByPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    modifyPrototypes((prototype) => {
        prototype.scrollBy = function scrollBy(): void {
            const args = arguments;
            if (args.length === 1) {
                elementScrollBy(this, args[0], config);
                return;
            }

            const [left, top] = args as unknown as [number, number];

            elementScrollBy(this, { left, top }, config);
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        markPolyfill(prototype.scrollBy);
    });
};

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

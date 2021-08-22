import {
    elementScrollXY,
    getOriginalMethod,
    isScrollBehaviorSupported,
    markPolyfill,
    modifyPrototypes,
} from "../.internal/common.js";
import type { IScrollConfig } from "../.internal/scroll-step";
import { elementScroll, elementScrollBy, elementScrollTo } from "./scroll.js";

export const elementScrollPolyfill = (config?: IScrollConfig): void => {
    const self = config?.window || window;

    if (isScrollBehaviorSupported(self)) {
        return;
    }

    const originalFunc = getOriginalMethod(self.HTMLElement.prototype, "scroll", elementScrollXY);

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
    const self = config?.window || window;

    if (isScrollBehaviorSupported(self)) {
        return;
    }

    const originalFunc = getOriginalMethod(self.HTMLElement.prototype, "scrollTo", elementScrollXY);

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
    if (isScrollBehaviorSupported(config?.window || window)) {
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

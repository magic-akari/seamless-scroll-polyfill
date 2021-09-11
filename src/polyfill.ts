import { isScrollBehaviorSupported } from "./common.js";
import type { IScrollConfig } from "./scroll-step.js";
import {
    elementScrollByPolyfill,
    elementScrollPolyfill,
    elementScrollToPolyfill,
    windowScrollByPolyfill,
    windowScrollPolyfill,
    windowScrollToPolyfill,
} from "./scroll.polyfill.js";
import { elementScrollIntoViewPolyfill } from "./scrollIntoView.polyfill.js";

export * from "./scroll.polyfill.js";
export * from "./scrollIntoView.polyfill.js";

export const polyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    elementScrollPolyfill(config);
    elementScrollToPolyfill(config);
    elementScrollByPolyfill(config);
    elementScrollIntoViewPolyfill(config);

    windowScrollPolyfill(config);
    windowScrollToPolyfill(config);
    windowScrollByPolyfill(config);
};

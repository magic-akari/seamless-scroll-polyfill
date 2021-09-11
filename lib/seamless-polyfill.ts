import { isScrollBehaviorSupported } from "../.internal/common.js";
import type { IScrollConfig } from "../.internal/scroll-step";
import {
    elementScrollByPolyfill,
    elementScrollIntoViewPolyfill,
    elementScrollPolyfill,
    elementScrollToPolyfill,
    windowScrollByPolyfill,
    windowScrollPolyfill,
    windowScrollToPolyfill,
} from "../src/polyfill.js";

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

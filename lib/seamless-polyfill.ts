import { isScrollBehaviorSupported } from "../.internal/common.js";
import type { IScrollConfig } from "../.internal/scroll-step";
import {
    elementScrollByPolyfill,
    elementScrollIntoViewPolyfill,
    elementScrollPolyfill,
    elementScrollToPolyfill,
} from "../Element/polyfill.js";
import { windowScrollByPolyfill, windowScrollPolyfill, windowScrollToPolyfill } from "../Window/polyfill.js";

export const polyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported(config?.window || window)) {
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

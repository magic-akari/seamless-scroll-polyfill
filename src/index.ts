import { IAnimationOptions } from "./common.js";
import { polyfill as elementScrollPolyfill } from "./Element.scroll.js";
import { polyfill as elementScrollByPolyfill } from "./Element.scrollBy.js";
import { polyfill as elementScrollToPolyfill } from "./Element.scrollTo.js";
import { polyfill as windowScrollPolyfill } from "./Window.scroll.js";
import { polyfill as windowScrollByPolyfill } from "./Window.scrollBy.js";
import { polyfill as windowScrollToPolyfill } from "./Window.scrollTo.js";

export const seamless = (options: IAnimationOptions) => {
    if ("scrollBehavior" in document.documentElement.style) {
        return;
    }

    windowScrollPolyfill(options);
    windowScrollToPolyfill(options);
    windowScrollByPolyfill(options);

    elementScrollPolyfill(options);
    elementScrollToPolyfill(options);
    elementScrollByPolyfill(options);
};

export { elementScroll } from "./Element.scroll.js";
export { elementScrollBy } from "./Element.scrollBy.js";
export { elementScrollTo } from "./Element.scrollTo.js";
export { windowScroll } from "./Window.scroll.js";
export { windowScrollBy } from "./Window.scrollBy.js";
export { windowScrollTo } from "./Window.scrollTo.js";
export { seamless as polyfill };

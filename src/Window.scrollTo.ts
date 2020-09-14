import { IAnimationOptions, original, supportsScrollBehavior } from "./common.js";
import { windowScroll } from "./Window.scroll.js";

export { windowScroll as windowScrollTo } from "./Window.scroll.js";

export const windowScrollToPolyfill = (options?: IAnimationOptions) => {
    if (supportsScrollBehavior()) {
        return;
    }

    const originalFunc = original.windowScroll;

    window.scrollTo = function scrollTo() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return originalFunc.call(this, arg0, arg1);
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scrollTo' on 'Window': parameter 1 ('options') is not an object.");
        }

        return windowScroll({ ...arg0, ...options });
    };
};

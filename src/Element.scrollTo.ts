import { IAnimationOptions, modifyPrototypes } from "./common.js";
import { elementScroll, getOriginalFunc } from "./Element.scroll.js";

export { elementScroll as elementScrollTo } from "./Element.scroll.js";

export const polyfill = (options?: IAnimationOptions) => {
    const originalFunc = getOriginalFunc();

    modifyPrototypes(prototype => prototype.scrollTo = function scrollTo() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return originalFunc.call(this, arg0, arg1);
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scrollTo' on 'Element': parameter 1 ('options') is not an object.");
        }

        return elementScroll(this, { ...arg0, ...options });
    })
};

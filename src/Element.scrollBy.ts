import { IAnimationOptions, IScrollToOptions, modifyPrototypes } from "./common.js";
import { elementScroll } from "./Element.scroll.js";

export const elementScrollBy = (element: Element, options: IScrollToOptions) => {
    const left = (options.left || 0) + element.scrollLeft;
    const top = (options.top || 0) + element.scrollTop;

    return elementScroll(element, { ...options, left, top });
};

export const polyfill = (options?: IAnimationOptions) => {

    modifyPrototypes(prototype => prototype.scrollBy = function scrollBy() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return elementScrollBy(this, { left: arg0, top: arg1 });
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scrollBy' on 'Element': parameter 1 ('options') is not an object.");
        }

        return elementScrollBy(this, { ...arg0, ...options });
    })

};

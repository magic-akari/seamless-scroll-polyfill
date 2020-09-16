import {
    IAnimationOptions,
    IScrollToOptions,
    isObject,
    isScrollBehaviorSupported,
    modifyPrototypes,
    nonFinite,
} from "./common.js";
import { elementScroll } from "./Element.scroll.js";

export const elementScrollBy = (element: Element, options: IScrollToOptions) => {
    const left = nonFinite(options.left || 0) + element.scrollLeft;
    const top = nonFinite(options.top || 0) + element.scrollTop;

    return elementScroll(element, { ...options, left, top });
};

export const elementScrollByPolyfill = (animationOptions?: IAnimationOptions) => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    modifyPrototypes(
        (prototype) =>
            (prototype.scrollBy = function scrollBy() {
                if (arguments.length === 1) {
                    const scrollByOptions = arguments[0];
                    if (!isObject(scrollByOptions)) {
                        throw new TypeError(
                            "Failed to execute 'scrollBy' on 'Element': parameter 1 ('options') is not an object.",
                        );
                    }

                    const left = Number(scrollByOptions.left);
                    const top = Number(scrollByOptions.top);

                    return elementScrollBy(this, { ...scrollByOptions, left, top, ...animationOptions });
                }

                const left = Number(arguments[0]);
                const top = Number(arguments[1]);

                return elementScrollBy(this, { left, top });
            }),
    );
};

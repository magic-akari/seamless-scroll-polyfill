import { IScrollConfig, isObject, isScrollBehaviorSupported, modifyPrototypes, original } from "./common.js";
import { elementScroll } from "./Element.scroll.js";

export { elementScroll as elementScrollTo } from "./Element.scroll.js";

export const elementScrollToPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = original.elementScroll;

    modifyPrototypes(
        (prototype) =>
            (prototype.scrollTo = function scrollTo() {
                if (arguments.length === 1) {
                    const scrollToOptions = arguments[0];
                    if (!isObject(scrollToOptions)) {
                        throw new TypeError(
                            "Failed to execute 'scrollTo' on 'Element': parameter 1 ('options') is not an object.",
                        );
                    }

                    const left = Number(scrollToOptions.left);
                    const top = Number(scrollToOptions.top);

                    return elementScroll(this, { ...scrollToOptions, left, top }, config);
                }

                return originalFunc.apply(this, arguments as any);
            }),
    );
};

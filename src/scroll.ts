import {
    checkBehavior,
    failedExecute,
    getOriginalMethod,
    failedExecuteInvalidEnumValue,
    isObject,
    nonFinite,
    elementScrollXY,
    scrollingElement,
} from "../.internal/common.js";
import type { IContext, IScrollConfig } from "../.internal/scroll-step";
import { now, step } from "../.internal/scroll-step.js";

const elementScrollWithOptions = (
    element: Element,
    options: Readonly<ScrollToOptions>,
    config?: IScrollConfig,
): void => {
    if (!element.isConnected) {
        return;
    }

    const startX = element.scrollLeft;
    const startY = element.scrollTop;

    const targetX = nonFinite(options.left ?? startX);
    const targetY = nonFinite(options.top ?? startY);

    if (targetX === startX && targetY === startY) {
        return;
    }

    const originalFunc = getOriginalMethod(Object.getPrototypeOf(element), "scroll", elementScrollXY);
    const originalBoundFunc = originalFunc.bind(element);

    if (options.behavior !== "smooth") {
        originalBoundFunc(targetX, targetY);
        return;
    }

    const removeEventListener = () => {
        window.removeEventListener("wheel", cancelScroll);
        window.removeEventListener("touchmove", cancelScroll);
    };

    const context: IContext = {
        ...config,
        timeStamp: now(),
        startX,
        startY,
        targetX,
        targetY,
        rafId: 0,
        method: originalBoundFunc,
        callback: removeEventListener,
    };

    const cancelScroll = () => {
        window.cancelAnimationFrame(context.rafId);
        removeEventListener();
    };

    window.addEventListener("wheel", cancelScroll, {
        passive: true,
        once: true,
    });
    window.addEventListener("touchmove", cancelScroll, {
        passive: true,
        once: true,
    });

    step(context);
};

export const elementScroll = (element: Element, scrollOptions?: ScrollToOptions, config?: IScrollConfig): void => {
    const options = scrollOptions ?? {};
    if (!isObject(options)) {
        throw new TypeError(failedExecute("scroll", "Element"));
    }

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scroll", "Element", options.behavior));
    }

    elementScrollWithOptions(element, options, config);
};

export const elementScrollTo = (element: Element, scrollToOptions?: ScrollToOptions, config?: IScrollConfig): void => {
    const options = scrollToOptions ?? {};
    if (!isObject(options)) {
        throw new TypeError(failedExecute("scrollTo", "Element"));
    }

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollTo", "Element", options.behavior));
    }

    elementScrollWithOptions(element, options, config);
};

export const elementScrollBy = (element: Element, scrollByOptions?: ScrollToOptions, config?: IScrollConfig): void => {
    const options = scrollByOptions ?? {};
    if (!isObject(options)) {
        throw new TypeError(failedExecute("scrollBy", "Element"));
    }

    const { behavior } = options;

    if (!checkBehavior(behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollBy", "Element", behavior));
    }

    const left = nonFinite(options.left) + element.scrollLeft;
    const top = nonFinite(options.top) + element.scrollTop;

    elementScrollWithOptions(element, { left, top, behavior }, config);
};

export const windowScroll = (
    currentWindow: typeof window,
    scrollOptions?: ScrollToOptions,
    config?: IScrollConfig,
): void => {
    const options = scrollOptions ?? {};

    if (!isObject(options)) {
        throw new TypeError(failedExecute("scroll", "Window"));
    }

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scroll", "Window", options.behavior));
    }

    const element = scrollingElement(currentWindow.document.documentElement);

    elementScrollWithOptions(element, options, config);
};

export const windowScrollTo = (
    currentWindow: typeof window,
    scrollToOptions?: ScrollToOptions,
    config?: IScrollConfig,
): void => {
    const options = scrollToOptions ?? {};

    if (!isObject(options)) {
        throw new TypeError(failedExecute("scrollTo", "Window"));
    }

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollTo", "Window", options.behavior));
    }

    const element = scrollingElement(currentWindow.document.documentElement);

    elementScrollWithOptions(element, options, config);
};

export const windowScrollBy = (
    currentWindow: typeof window,
    scrollByOptions?: ScrollToOptions,
    config?: IScrollConfig,
): void => {
    const options = scrollByOptions ?? {};

    if (!isObject(options)) {
        throw new TypeError(failedExecute("scrollBy", "Window"));
    }

    const { behavior } = options;

    if (!checkBehavior(behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollBy", "Window", behavior));
    }

    const left = nonFinite(options.left) + (currentWindow.scrollX || currentWindow.pageXOffset);
    const top = nonFinite(options.top) + (currentWindow.scrollY || currentWindow.pageYOffset);

    windowScroll(currentWindow, { left, top, behavior }, config);
};

import {
    checkBehavior,
    failedExecute,
    getOriginalMethod,
    failedExecuteInvalidEnumValue,
    isObject,
    nonFinite,
    elementScrollXY,
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

    const self = config?.window || window;
    const removeEventListener = () => {
        self.removeEventListener("wheel", cancelScroll);
        self.removeEventListener("touchmove", cancelScroll);
    };

    const context: IContext = {
        ...config,
        timeStamp: now(self),
        startX,
        startY,
        targetX,
        targetY,
        rafId: 0,
        method: originalBoundFunc,
        callback: removeEventListener,
    };

    const cancelScroll = () => {
        self.cancelAnimationFrame(context.rafId);
        removeEventListener();
    };

    self.addEventListener("wheel", cancelScroll, {
        passive: true,
        once: true,
    });
    self.addEventListener("touchmove", cancelScroll, {
        passive: true,
        once: true,
    });

    step(context, config);
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

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollBy", "Element", options.behavior));
    }

    const left = nonFinite(options.left) + element.scrollLeft;
    const top = nonFinite(options.top) + element.scrollTop;

    elementScrollWithOptions(element, { ...options, left, top }, config);
};

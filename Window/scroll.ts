import {
    checkBehavior,
    failedExecute,
    getOriginalMethod,
    failedExecuteInvalidEnumValue,
    isObject,
    nonFinite,
} from "../.internal/common.js";
import type { IContext, IScrollConfig } from "../.internal/scroll-step";
import { now, step } from "../.internal/scroll-step.js";

const windowScrollWithOptions = (
    currentWindow: typeof window,
    options: Readonly<ScrollToOptions>,
    config?: IScrollConfig,
): void => {
    const startX = currentWindow.scrollX || currentWindow.pageXOffset;
    const startY = currentWindow.scrollY || currentWindow.pageYOffset;

    const targetX = nonFinite(options.left ?? startX);
    const targetY = nonFinite(options.top ?? startY);

    if (targetX === startX && targetY === startY) {
        return;
    }

    const originalBoundFunc = getOriginalMethod(currentWindow, "scroll").bind(currentWindow);

    if (options.behavior !== "smooth") {
        originalBoundFunc(targetX, targetY);
        return;
    }

    const removeEventListener = () => {
        currentWindow.removeEventListener("wheel", cancelScroll);
        currentWindow.removeEventListener("touchmove", cancelScroll);
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
        currentWindow.cancelAnimationFrame(context.rafId);
        removeEventListener();
    };

    currentWindow.addEventListener("wheel", cancelScroll, {
        passive: true,
        once: true,
    });
    currentWindow.addEventListener("touchmove", cancelScroll, {
        passive: true,
        once: true,
    });

    step(context);
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

    windowScrollWithOptions(currentWindow, options, config);
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

    windowScrollWithOptions(currentWindow, options, config);
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

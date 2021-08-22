import {
    IAnimationOptions,
    IContext,
    IScrollToOptions,
    isObject,
    isScrollBehaviorSupported,
    nonFinite,
    now,
    original,
    step,
} from "./common.js";

export const windowScroll = (currentWindow: typeof window, options: IScrollToOptions): void => {
    const originalBoundFunc = original.windowScroll.bind(currentWindow);

    if (options.left === undefined && options.top === undefined) {
        return;
    }

    const startX = currentWindow.scrollX || currentWindow.pageXOffset;
    const startY = currentWindow.scrollY || currentWindow.pageYOffset;

    const targetX = nonFinite(options.left ?? startX);
    const targetY = nonFinite(options.top ?? startY);

    if (options.behavior !== "smooth") {
        return originalBoundFunc(targetX, targetY);
    }

    const removeEventListener = () => {
        currentWindow.removeEventListener("wheel", cancelScroll);
        currentWindow.removeEventListener("touchmove", cancelScroll);
    };

    const context: IContext = {
        timeStamp: now(),
        duration: options.duration,
        startX,
        startY,
        targetX,
        targetY,
        rafId: 0,
        method: originalBoundFunc,
        timingFunc: options.timingFunc,
        callback: removeEventListener,
    };

    const cancelScroll = () => {
        cancelAnimationFrame(context.rafId);
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

export const windowScrollPolyfill = (animationOptions?: IAnimationOptions): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = original.windowScroll;

    window.scroll = function scroll() {
        if (arguments.length === 1) {
            const scrollOptions = arguments[0];
            if (!isObject(scrollOptions)) {
                throw new TypeError(
                    "Failed to execute 'scroll' on 'Window': parameter 1 ('options') is not an object.",
                );
            }

            return windowScroll(this, { ...scrollOptions, ...animationOptions });
        }

        return originalFunc.apply(this, arguments as any);
    };
};

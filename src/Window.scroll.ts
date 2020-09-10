import { IAnimationOptions, IContext, IScrollToOptions, now, step } from "./common.js";

let $original: (x: number, y: number) => void;

export const getOriginalFunc = () => {
    if ($original === undefined) {
        $original = (window.scroll || window.scrollTo).bind(window);
    }
    return $original;
};

export const windowScroll = (options: IScrollToOptions) => {
    const originalBoundFunc = getOriginalFunc();

    if (options.left === undefined && options.top === undefined) {
        return;
    }

    const startX = window.scrollX || window.pageXOffset;
    const startY = window.scrollY || window.pageYOffset;

    const { left: targetX = startX, top: targetY = startY } = options;

    if (options.behavior !== "smooth") {
        return originalBoundFunc(targetX, targetY);
    }

    const removeEventListener = () => {
        window.removeEventListener("wheel", cancelScroll);
        window.removeEventListener("touchmove", cancelScroll);
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

export const windowScrollPolyfill = (options?: IAnimationOptions) => {
    const originalFunc = getOriginalFunc();

    window.scroll = function scroll() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return originalFunc.call(this, arg0, arg1);
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scroll' on 'Window': parameter 1 ('options') is not an object.");
        }

        return windowScroll({ ...arg0, ...options });
    };
};

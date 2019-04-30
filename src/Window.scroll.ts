import { IAnimationOptions, IContext, IScrollToOptions, now, step } from "./common.js";

export const originalWindowScroll = (x: number, y: number) => (window.scroll || window.scrollTo)(x, y);

export const windowScroll = (options: IScrollToOptions) => {
    if (options.left === undefined && options.top === undefined) {
        return;
    }

    const startX = window.scrollX || window.pageXOffset;
    const startY = window.scrollY || window.pageYOffset;

    const { left: targetX = startX, top: targetY = startY } = options;

    if (options.behavior !== "smooth") {
        return originalWindowScroll(targetX, targetY);
    }

    const context: IContext = {
        timeStamp: now(),
        duration: options.duration,
        startX,
        startY,
        targetX,
        targetY,
        rafId: 0,
        method: originalWindowScroll,
        timingFunc: options.timingFunc,
        callback: () => {
            window.removeEventListener("wheel", cancelScroll);
            window.removeEventListener("touchmove", cancelScroll);
        },
    };

    const cancelScroll = () => {
        cancelAnimationFrame(context.rafId);
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

export const polyfill = (options: IAnimationOptions) => {
    const originalFunc = window.scroll || window.scrollTo;
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

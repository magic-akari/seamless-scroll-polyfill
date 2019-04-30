import { IAnimationOptions, IContext, IScrollToOptions, now, step } from "./common.js";

export const originalElementScroll =
    Element.prototype.scroll ||
    Element.prototype.scrollTo ||
    function(this: Element, x: number, y: number) {
        this.scrollLeft = x;
        this.scrollTop = y;
    };

export const elementScroll = (element: Element, options: IScrollToOptions) => {
    const originalFunc = originalElementScroll.bind(element);

    if (options.left === undefined && options.top === undefined) {
        return;
    }

    const startX = element.scrollLeft;
    const startY = element.scrollTop;

    const { left: targetX = startX, top: targetY = startY } = options;

    if (options.behavior !== "smooth") {
        return originalElementScroll.call(element, targetX, startY);
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
        method: originalFunc,
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

export const polyfill = (options: IAnimationOptions) => {
    Element.prototype.scroll = function scroll() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return originalElementScroll.call(this, arg0, arg1);
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scroll' on 'Element': parameter 1 ('options') is not an object.");
        }

        return elementScroll(this, { ...arg0, ...options });
    };
};

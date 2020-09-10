import { IAnimationOptions, IContext, IScrollToOptions, now, step, modifyPrototypes } from "./common.js";

let $original: (x: number, y: number) => void;

export const getOriginalFunc = () => {
    if ($original === undefined) {
        $original =
            HTMLElement.prototype.scroll ||
            HTMLElement.prototype.scrollTo ||
            function (this: Element, x: number, y: number) {
                this.scrollLeft = x;
                this.scrollTop = y;
            };
    }
    return $original;
};

export const elementScroll = (element: Element, options: IScrollToOptions) => {
    const originalBoundFunc = getOriginalFunc().bind(element);

    if (options.left === undefined && options.top === undefined) {
        return;
    }

    const startX = element.scrollLeft;
    const startY = element.scrollTop;

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

export const polyfill = (options?: IAnimationOptions) => {
    const originalFunc = getOriginalFunc();

    modifyPrototypes(prototype => prototype.scroll = function scroll() {
        const [arg0 = 0, arg1 = 0] = arguments;

        if (typeof arg0 === "number" && typeof arg1 === "number") {
            return originalFunc.call(this, arg0, arg1);
        }

        if (Object(arg0) !== arg0) {
            throw new TypeError("Failed to execute 'scroll' on 'Element': parameter 1 ('options') is not an object.");
        }

        return elementScroll(this, { ...arg0, ...options });
    })
};

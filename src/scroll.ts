import {
    checkBehavior,
    failedExecute,
    getOriginalMethod,
    failedExecuteInvalidEnumValue,
    isObject,
    elementScrollXY,
    scrollingElement,
} from "./common.js";
import type { IContext, IScrollConfig } from "./scroll-step";
import { now, step } from "./scroll-step.js";

// https://drafts.csswg.org/cssom-view/#normalize-non-finite-values
const nonFinite = (value: unknown): number => {
    if (!isFinite(value as number)) {
        return 0;
    }
    return Number(value);
};

const scrollWithOptions = (element: Element, options: Readonly<ScrollToOptions>, config?: IScrollConfig): void => {
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

const isWindow = (obj: unknown): obj is Window => (obj as Window).window === obj;

interface ScrollMethod<T extends Element | typeof window> {
    (target: T, scrollOptions?: ScrollToOptions, config?: IScrollConfig): void;
}

const createScroll =
    <T extends Element | typeof window>(scrollName: "scroll" | "scrollTo" | "scrollBy"): ScrollMethod<T> =>
    (target, scrollOptions, config): void => {
        const [element, scrollType]: [Element, "Window" | "Element"] = isWindow(target)
            ? [scrollingElement(target.document.documentElement), "Window"]
            : [target, "Element"];

        const options = scrollOptions ?? {};

        if (!isObject(options)) {
            throw new TypeError(failedExecute(scrollName, scrollType));
        }

        if (!checkBehavior(options.behavior)) {
            throw new TypeError(failedExecuteInvalidEnumValue(scrollName, scrollType, options.behavior));
        }

        if (scrollName === "scrollBy") {
            options.left = nonFinite(options.left) + element.scrollLeft;
            options.top = nonFinite(options.top) + element.scrollTop;
        }

        scrollWithOptions(element, options, config);
    };

export const scroll = createScroll("scroll");
export const scrollTo = createScroll("scrollTo");
export const scrollBy = createScroll("scrollBy");

export const elementScroll = scroll as ScrollMethod<Element>;
export const elementScrollTo = scrollTo as ScrollMethod<Element>;
export const elementScrollBy = scrollBy as ScrollMethod<Element>;

export const windowScroll = scroll as ScrollMethod<typeof window>;
export const windowScrollTo = scrollTo as ScrollMethod<typeof window>;
export const windowScrollBy = scrollBy as ScrollMethod<typeof window>;

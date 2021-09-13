import { isObject, isScrollBehaviorSupported, markPolyfill, modifyPrototypes } from "./common.js";
import type { IScrollConfig } from "./scroll-step";
import { elementScrollIntoView } from "./scrollIntoView.js";

interface GetOriginalMethod {
    <K extends keyof Element>(proto: Element, method: K, fallback?: unknown): Element[K];
    <K extends keyof Window>(proto: Window, method: K, fallback?: unknown): Window[K];
}

/* eslint-disable */
const getOriginalMethod: GetOriginalMethod = (proto: any, method: string, fallback?: unknown) => {
    const backup = `__seamless__$$${method}$$__backup__`;
    proto[backup] ||= proto[method] ||= fallback;

    if (proto[backup]?.__isPolyfill) {
        throw new Error("unexpected_method");
    }

    return proto[backup];
};
/* eslint-enable */

export const elementScrollIntoViewPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = getOriginalMethod(window.HTMLElement.prototype, "scrollIntoView");

    modifyPrototypes((prototype) => {
        prototype.scrollIntoView = function scrollIntoView(): void {
            const args = arguments;
            const options = args[0] as unknown;

            if (args.length === 1 && isObject(options)) {
                elementScrollIntoView(this, options as ScrollIntoViewOptions, config);
                return;
            }

            originalFunc.apply(this, args as any);
        };

        // eslint-disable-next-line @typescript-eslint/unbound-method
        markPolyfill(prototype.scrollIntoView);
    });
};

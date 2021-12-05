import { backupMethod, isScrollBehaviorSupported, markPolyfill, modifyPrototypes } from "./common.js";
import type { IScrollConfig } from "./scroll-step";
import { scroll, scrollBy, scrollTo } from "./scroll.js";

type ScrollName = "scroll" | "scrollTo" | "scrollBy";

type Patch = <T extends ScrollName>(prop: T, func: (Element | typeof window)[T]) => void;

const createPolyfill =
    (scrollName: ScrollName, patch: Patch) =>
    (config?: IScrollConfig): void => {
        if (isScrollBehaviorSupported()) {
            return;
        }

        const scrollMethod = {
            scroll,
            scrollTo,
            scrollBy,
        }[scrollName];

        patch(scrollName, function (this: Element | typeof window): void {
            const args = arguments;
            if (arguments.length === 1) {
                scrollMethod(this, args[0] as ScrollToOptions, config);
                return;
            }

            const left = args[0] as number;
            const top = args[1] as number;
            scrollMethod(this, { left, top });
        });
    };

export const elementScrollPolyfill = /* #__PURE__ */ createPolyfill("scroll", modifyPrototypes);
export const elementScrollToPolyfill = /* #__PURE__ */ createPolyfill("scrollTo", modifyPrototypes);
export const elementScrollByPolyfill = /* #__PURE__ */ createPolyfill("scrollBy", modifyPrototypes);

export const modifyWindow = <T extends "scroll" | "scrollTo" | "scrollBy">(prop: T, func: typeof window[T]): void => {
    markPolyfill(func);
    backupMethod(window, prop);
    window[prop] = func;
};

export const windowScrollPolyfill = /* #__PURE__ */ createPolyfill("scroll", modifyWindow);
export const windowScrollToPolyfill = /* #__PURE__ */ createPolyfill("scrollTo", modifyWindow);
export const windowScrollByPolyfill = /* #__PURE__ */ createPolyfill("scrollBy", modifyWindow);

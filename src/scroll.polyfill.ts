import { isScrollBehaviorSupported, markPolyfill, modifyPrototypes } from "./common.js";
import type { IScrollConfig } from "./scroll-step";
import { scroll, scrollBy, scrollTo } from "./scroll.js";

type ScrollName = "scroll" | "scrollTo" | "scrollBy";

type Patch = (modification: (prototype: Record<ScrollName, (this: Element | typeof window) => void>) => void) => void;

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

        patch((prototype) => {
            prototype[scrollName] = function (): void {
                const args = arguments;
                if (arguments.length === 1) {
                    scrollMethod(this, args[0], config);
                    return;
                }

                const left = args[0] as number;
                const top = args[1] as number;
                scrollMethod(this, { left, top });
            };

            markPolyfill(prototype[scrollName]);
        });
    };

export const elementScrollPolyfill = createPolyfill("scroll", modifyPrototypes);
export const elementScrollToPolyfill = createPolyfill("scrollTo", modifyPrototypes);
export const elementScrollByPolyfill = createPolyfill("scrollBy", modifyPrototypes);

const modifyWindow: Patch = (modification) => {
    modification(window);
};

export const windowScrollPolyfill = createPolyfill("scroll", modifyWindow);
export const windowScrollToPolyfill = createPolyfill("scrollTo", modifyWindow);
export const windowScrollByPolyfill = createPolyfill("scrollBy", modifyWindow);

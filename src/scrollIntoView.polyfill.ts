import { backupMethod, isObject, isScrollBehaviorSupported, modifyPrototypes } from "./common.js";
import type { IScrollConfig } from "./scroll-step";
import { elementScrollIntoView } from "./scrollIntoView.js";

function elementScrollIntoViewBoolean(this: Element, alignToTop?: unknown) {
    elementScrollIntoView(this, {
        block: alignToTop ?? true ? "start" : "end",
        inline: "nearest",
    });
}

export const elementScrollIntoViewPolyfill = (config?: IScrollConfig): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = backupMethod(window.HTMLElement.prototype, "scrollIntoView", elementScrollIntoViewBoolean);

    modifyPrototypes("scrollIntoView", function scrollIntoView(this: Element): void {
        const args = arguments;
        const options = args[0] as unknown;

        if (args.length === 1 && isObject(options)) {
            elementScrollIntoView(this, options as ScrollIntoViewOptions, config);
            return;
        }

        originalFunc.apply(this, args as never);
    });
};

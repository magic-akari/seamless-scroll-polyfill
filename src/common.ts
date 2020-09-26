const ease = (k: number) => {
    return 0.5 * (1 - Math.cos(Math.PI * k));
};

const DURATION = 500;

export const isScrollBehaviorSupported = (): boolean => "scrollBehavior" in document.documentElement.style;

export const original = {
    _elementScroll: undefined as typeof Element.prototype.scroll | undefined,
    get elementScroll() {
        return (this._elementScroll ||=
            HTMLElement.prototype.scroll ||
            HTMLElement.prototype.scrollTo ||
            function (this: Element, x: number, y: number) {
                this.scrollLeft = x;
                this.scrollTop = y;
            });
    },

    _elementScrollIntoView: undefined as typeof Element.prototype.scrollIntoView | undefined,
    get elementScrollIntoView() {
        return (this._elementScrollIntoView ||= HTMLElement.prototype.scrollIntoView);
    },

    _windowScroll: undefined as typeof window.scroll | undefined,
    get windowScroll() {
        return (this._windowScroll ||= window.scroll || window.scrollTo);
    },
};

type Prototype = typeof HTMLElement.prototype | typeof SVGElement.prototype | typeof Element.prototype;

export const modifyPrototypes = (modification: (prototype: Prototype) => void): void => {
    const prototypes = [HTMLElement.prototype, SVGElement.prototype, Element.prototype];
    prototypes.forEach((prototype) => modification(prototype));
};

export interface IAnimationOptions {
    duration?: number;
    timingFunc?: (k: number) => number;
}

export interface IScrollToOptions extends ScrollToOptions, IAnimationOptions {}

export interface IScrollIntoViewOptions extends ScrollIntoViewOptions, IAnimationOptions {}

export interface IContext extends IAnimationOptions {
    timeStamp: number;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    rafId: number;
    method: (x: number, y: number) => void;
    callback: () => void;
}

export const now = (): number => window.performance?.now?.() ?? Date.now();

export const step = (context: IContext): void => {
    const currentTime = now();

    const elapsed = (currentTime - context.timeStamp) / (context.duration || DURATION);
    if (elapsed > 1) {
        context.method(context.targetX, context.targetY);
        context.callback();
        return;
    }
    const value = (context.timingFunc || ease)(elapsed);

    const currentX = context.startX + (context.targetX - context.startX) * value;
    const currentY = context.startY + (context.targetY - context.startY) * value;

    context.method(currentX, currentY);

    context.rafId = requestAnimationFrame(() => {
        step(context);
    });
};

// https://drafts.csswg.org/cssom-view/#normalize-non-finite-values
export const nonFinite = (value: number): number => {
    if (!isFinite(value)) {
        return 0;
    }
    return Number(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
    const type = typeof value;
    return value !== null && (type === "object" || type === "function");
};

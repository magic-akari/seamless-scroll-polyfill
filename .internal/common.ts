export const checkBehavior = (behavior?: string): behavior is undefined | ScrollBehavior => {
    return behavior === undefined || behavior === "auto" || behavior === "instant" || behavior === "smooth";
};

export function elementScrollXY(this: Element, x: number, y: number): void {
    this.scrollLeft = x;
    this.scrollTop = y;
}

export const failedExecute = (method: string, object: string, reason: string = "cannot convert to dictionary.") =>
    `Failed to execute '${method}' on '${object}': ${reason}`;

export const failedExecuteInvalidEnumValue = (method: string, object: string, value: string) =>
    failedExecute(method, object, `The provided value '${value}' is not a valid enum value of type ScrollBehavior.`);

interface GetOriginalMethod {
    <K extends keyof Element>(proto: Element, method: K, fallback?: unknown): Element[K];
    <K extends keyof Window>(proto: Window, method: K, fallback?: unknown): Window[K];
}

export const getOriginalMethod: GetOriginalMethod = (proto: any, method: string, fallback?: unknown) => {
    const backup = `__seamless__$$${method}$$__backup__`;
    proto[backup] ||= proto[method] ||= fallback;

    if (proto[backup]?.__isPolyfill) {
        throw new Error("unexpected_method");
    }

    return proto[backup];
};

export const isObject = (value: unknown): boolean => {
    const type = typeof value;
    return value !== null && (type === "object" || type === "function");
};

export const isScrollBehaviorSupported = (): boolean => "scrollBehavior" in window.document.documentElement.style;

export const markPolyfill = (method: Record<never, never>) => {
    Object.defineProperty(method, "__isPolyfill", { value: true });
};

type Prototype = typeof HTMLElement.prototype | typeof SVGElement.prototype | typeof Element.prototype;

export const modifyPrototypes = (modification: (prototype: Prototype) => void): void => {
    [HTMLElement.prototype, SVGElement.prototype, Element.prototype].forEach((prototype) => {
        modification(prototype);
    });
};

// https://drafts.csswg.org/cssom-view/#normalize-non-finite-values

export const nonFinite = (value: unknown): number => {
    if (!isFinite(value as number)) {
        return 0;
    }
    return Number(value);
};

/**
 * - On Chrome and Firefox, document.scrollingElement will return the <html> element.
 * - Safari, document.scrollingElement will return the <body> element.
 * - On Edge, document.scrollingElement will return the <body> element.
 * - IE11 does not support document.scrollingElement, but you can assume its <html>.
 */
export const scrollingElement = (element: Element) =>
    element.ownerDocument.scrollingElement || element.ownerDocument.documentElement;

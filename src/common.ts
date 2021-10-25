export const checkBehavior = (behavior?: string): behavior is undefined | ScrollBehavior => {
    return behavior === undefined || behavior === "auto" || behavior === "instant" || behavior === "smooth";
};

export function elementScrollXY(this: Element, x: number, y: number): void {
    this.scrollLeft = x;
    this.scrollTop = y;
}

export const failedExecute = (method: string, object: string, reason = "cannot convert to dictionary."): string =>
    `Failed to execute '${method}' on '${object}': ${reason}`;

export const failedExecuteInvalidEnumValue = (method: string, object: string, value: string): string =>
    failedExecute(method, object, `The provided value '${value}' is not a valid enum value of type ScrollBehavior.`);

interface BackupMethod {
    <K extends keyof Element>(proto: Element, method: K): Element[K] | undefined;
    <K extends keyof Element>(proto: Element, method: K, fallback: unknown): Element[K];
    <K extends keyof Window>(proto: Window, method: K): Window[K] | undefined;
    <K extends keyof Window>(proto: Window, method: K, fallback: unknown): Window[K];
}

/* eslint-disable */
export const backupMethod: BackupMethod = (proto: any, method: string, fallback?: unknown) => {
    const backup = `__SEAMLESS.BACKUP$${method}`;

    if (!proto[backup] && proto[method] && !proto[method]?.__isPolyfill) {
        proto[backup] = proto[method];
    }

    return proto[backup] || fallback;
};
/* eslint-enable */

export const isObject = (value: unknown): boolean => {
    const type = typeof value;
    return value !== null && (type === "object" || type === "function");
};

export const isScrollBehaviorSupported = (): boolean => "scrollBehavior" in window.document.documentElement.style;

export const markPolyfill = (method: () => void): void => {
    Object.defineProperty(method, "__isPolyfill", { value: true });
};

type Prototype = typeof HTMLElement.prototype | typeof SVGElement.prototype | typeof Element.prototype;

export const modifyPrototypes = <T extends "scroll" | "scrollTo" | "scrollBy" | "scrollIntoView">(
    prop: T,
    func: Prototype[T],
): void => {
    markPolyfill(func);
    [HTMLElement.prototype, SVGElement.prototype, Element.prototype].forEach((prototype) => {
        backupMethod(prototype, prop);
        prototype[prop] = func;
    });
};

/**
 * - On Chrome and Firefox, document.scrollingElement will return the <html> element.
 * - Safari, document.scrollingElement will return the <body> element.
 * - On Edge, document.scrollingElement will return the <body> element.
 * - IE11 does not support document.scrollingElement, but you can assume its <html>.
 */
export const scrollingElement = (element: Element): Element =>
    element.ownerDocument.scrollingElement || element.ownerDocument.documentElement;

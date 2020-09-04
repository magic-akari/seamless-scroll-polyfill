const ease = (k: number) => {
    return 0.5 * (1 - Math.cos(Math.PI * k));
};

const DURATION = 500;

export const supportsScrollBehavior = "scrollBehavior" in document.documentElement.style

export interface IAnimationOptions {
    duration?: number;
    timingFunc?: (k: number) => number;
}

export interface IScrollToOptions extends ScrollToOptions, IAnimationOptions { }

export interface IScrollIntoViewOptions extends ScrollIntoViewOptions, IAnimationOptions { }

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

export const now = () => (performance && performance.now ? performance : Date).now();

export const step = (context: IContext) => {
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

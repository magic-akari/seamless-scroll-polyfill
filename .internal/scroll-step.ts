export interface IScrollConfig {
    readonly duration?: number;
    readonly timingFunc?: (k: number) => number;
    readonly window?: typeof window;
}

export interface IContext extends IScrollConfig {
    readonly timeStamp: number;
    readonly startX: number;
    readonly startY: number;
    readonly targetX: number;
    readonly targetY: number;
    readonly method: (x: number, y: number) => void;
    readonly callback: () => void;
    rafId: number;
}

const ease = (k: number) => {
    return 0.5 * (1 - Math.cos(Math.PI * k));
};

export const now = (self: typeof window): number => self.performance?.now?.() ?? self.Date.now();

const DURATION = 500;

export const step = (context: IContext, config?: IScrollConfig): void => {
    const self = config?.window || window;
    const currentTime = now(self);

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

    context.rafId = self.requestAnimationFrame(() => {
        step(context, config);
    });
};

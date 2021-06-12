import {
    IAnimationOptions,
    IScrollIntoViewOptions,
    isObject,
    isScrollBehaviorSupported,
    modifyPrototypes,
    original,
} from "./common.js";
import { elementScroll } from "./Element.scroll.js";

const enum ScrollAlignment {
    ToEdgeIfNeeded,
    CenterAlways,
    LeftOrTop,
    RightOrBottom,
}

const enum WritingMode {
    HorizontalTb,
    VerticalRl,
    VerticalLr,
    SidewaysRl,
    SidewaysLr,
}

// https://drafts.csswg.org/css-writing-modes-4/#block-flow
const normalizeWritingMode = (writingMode: string): WritingMode => {
    switch (writingMode) {
        case "horizontal-tb":
        case "lr":
        case "lr-tb":
        case "rl":
        case "rl-tb":
            return WritingMode.HorizontalTb;

        case "vertical-rl":
        case "tb":
        case "tb-rl":
            return WritingMode.VerticalRl;

        case "vertical-lr":
        case "tb-lr":
            return WritingMode.VerticalLr;

        case "sideways-rl":
            return WritingMode.SidewaysRl;

        case "sideways-lr":
            return WritingMode.SidewaysLr;
    }

    return WritingMode.HorizontalTb;
};

type Tuple2<T> = [T, T];

// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/dom/element.cc;l=1097-1189;drc=6a7533d4a1e9f2372223a9d912a9e53a6fa35ae0
const toPhysicalAlignment = (
    options: ScrollIntoViewOptions,
    writingMode: WritingMode,
    isLTR: boolean,
): Tuple2<ScrollAlignment> => {
    let [xPos, yPos] = [options.block || "start", options.inline || "nearest"];

    /**  0b{vertical}{horizontal}  0: normal, 1: reverse */
    let layout = 0b00;

    const enum OP {
        ReverseHorizontal = 0b01,
        ReverseVertical = 0b10,
    }

    /**
     * WritingMode.VerticalLr: ↓→
     * | 1 | 4 |   |
     * | 2 | 5 |   |
     * | 3 |   |   |
     *
     * RTL: ↑→
     * | 3 |   |   |
     * | 2 | 5 |   |
     * | 1 | 4 |   |
     */
    if (!isLTR) {
        layout ^= OP.ReverseVertical;
    }

    switch (writingMode) {
        /**
         * ↓→
         * | 1 | 2 | 3 |
         * | 4 | 5 |   |
         * |   |   |   |
         *
         * RTL: ↓←
         * | 3 | 2 | 1 |
         * |   | 5 | 4 |
         * |   |   |   |
         */
        case WritingMode.HorizontalTb:
            // swap horizontal and vertical
            layout = (layout >> 1) | ((layout & 1) << 1);
            [xPos, yPos] = [yPos, xPos];
            break;

        /**
         * ↓←
         * |   | 4 | 1 |
         * |   | 5 | 2 |
         * |   |   | 3 |
         *
         * RTL: ↑←
         * |   |   | 3 |
         * |   | 5 | 2 |
         * |   | 4 | 1 |
         */
        case WritingMode.VerticalRl:
        case WritingMode.SidewaysRl:
            //  reverse horizontal
            layout ^= OP.ReverseHorizontal;
            break;

        /**
         * ↑→
         * | 3 |   |   |
         * | 2 | 5 |   |
         * | 1 | 4 |   |
         *
         * RTL: ↓→
         * | 1 | 4 |   |
         * | 2 | 5 |   |
         * | 3 |   |   |
         */
        case WritingMode.SidewaysLr:
            // reverse vertical
            layout ^= OP.ReverseVertical;
            break;
    }

    return [xPos, yPos].map((value, index) => {
        switch (value) {
            case "center":
                return ScrollAlignment.CenterAlways;
            case "nearest":
                return ScrollAlignment.ToEdgeIfNeeded;

            default: {
                const reverse = (layout >> index) & 1;
                return (value === "start") === !reverse ? ScrollAlignment.LeftOrTop : ScrollAlignment.RightOrBottom;
            }
        }
    }) as Tuple2<ScrollAlignment>;
};

// code from stipsan/compute-scroll-into-view
// https://github.com/stipsan/compute-scroll-into-view/blob/5396c6b78af5d0bbce11a7c4e93cc3146546fcd3/src/index.ts
/**
 * Find out which edge to align against when logical scroll position is "nearest"
 * Interesting fact: "nearest" works similarily to "if-needed", if the element is fully visible it will not scroll it
 *
 * Legends:
 * ┌────────┐ ┏ ━ ━ ━ ┓
 * │ target │   frame
 * └────────┘ ┗ ━ ━ ━ ┛
 */
const alignNearest = (
    scrollingEdgeStart: number,
    scrollingEdgeEnd: number,
    scrollingSize: number,
    scrollingBorderStart: number,
    scrollingBorderEnd: number,
    elementEdgeStart: number,
    elementEdgeEnd: number,
    elementSize: number,
): number => {
    /**
     * If element edge A and element edge B are both outside scrolling box edge A and scrolling box edge B
     *
     *          ┌──┐
     *        ┏━│━━│━┓
     *          │  │
     *        ┃ │  │ ┃        do nothing
     *          │  │
     *        ┗━│━━│━┛
     *          └──┘
     *
     *  If element edge C and element edge D are both outside scrolling box edge C and scrolling box edge D
     *
     *    ┏ ━ ━ ━ ━ ┓
     *   ┌───────────┐
     *   │┃         ┃│        do nothing
     *   └───────────┘
     *    ┗ ━ ━ ━ ━ ┛
     */
    if (
        (elementEdgeStart < scrollingEdgeStart && elementEdgeEnd > scrollingEdgeEnd) ||
        (elementEdgeStart > scrollingEdgeStart && elementEdgeEnd < scrollingEdgeEnd)
    ) {
        return 0;
    }

    /**
     * If element edge A is outside scrolling box edge A and element height is less than scrolling box height
     *
     *          ┌──┐
     *        ┏━│━━│━┓         ┏━┌━━┐━┓
     *          └──┘             │  │
     *  from  ┃      ┃     to  ┃ └──┘ ┃
     *
     *        ┗━ ━━ ━┛         ┗━ ━━ ━┛
     *
     * If element edge B is outside scrolling box edge B and element height is greater than scrolling box height
     *
     *        ┏━ ━━ ━┓         ┏━┌━━┐━┓
     *                           │  │
     *  from  ┃ ┌──┐ ┃     to  ┃ │  │ ┃
     *          │  │             │  │
     *        ┗━│━━│━┛         ┗━│━━│━┛
     *          │  │             └──┘
     *          │  │
     *          └──┘
     *
     * If element edge C is outside scrolling box edge C and element width is less than scrolling box width
     *
     *       from                 to
     *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
     *  ┌───┐                 ┌───┐
     *  │ ┃ │       ┃         ┃   │     ┃
     *  └───┘                 └───┘
     *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
     *
     * If element edge D is outside scrolling box edge D and element width is greater than scrolling box width
     *
     *       from                 to
     *    ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
     *        ┌───────────┐   ┌───────────┐
     *    ┃   │     ┃     │   ┃         ┃ │
     *        └───────────┘   └───────────┘
     *    ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
     */
    if (
        (elementEdgeStart <= scrollingEdgeStart && elementSize <= scrollingSize) ||
        (elementEdgeEnd >= scrollingEdgeEnd && elementSize >= scrollingSize)
    ) {
        return elementEdgeStart - scrollingEdgeStart - scrollingBorderStart;
    }

    /**
     * If element edge B is outside scrolling box edge B and element height is less than scrolling box height
     *
     *        ┏━ ━━ ━┓         ┏━ ━━ ━┓
     *
     *  from  ┃      ┃     to  ┃ ┌──┐ ┃
     *          ┌──┐             │  │
     *        ┗━│━━│━┛         ┗━└━━┘━┛
     *          └──┘
     *
     * If element edge A is outside scrolling box edge A and element height is greater than scrolling box height
     *
     *          ┌──┐
     *          │  │
     *          │  │             ┌──┐
     *        ┏━│━━│━┓         ┏━│━━│━┓
     *          │  │             │  │
     *  from  ┃ └──┘ ┃     to  ┃ │  │ ┃
     *                           │  │
     *        ┗━ ━━ ━┛         ┗━└━━┘━┛
     *
     * If element edge C is outside scrolling box edge C and element width is greater than scrolling box width
     *
     *           from                 to
     *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
     *  ┌───────────┐           ┌───────────┐
     *  │     ┃     │   ┃       │ ┃         ┃
     *  └───────────┘           └───────────┘
     *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
     *
     * If element edge D is outside scrolling box edge D and element width is less than scrolling box width
     *
     *           from                 to
     *        ┏ ━ ━ ━ ━ ┓         ┏ ━ ━ ━ ━ ┓
     *                ┌───┐             ┌───┐
     *        ┃       │ ┃ │       ┃     │   ┃
     *                └───┘             └───┘
     *        ┗ ━ ━ ━ ━ ┛         ┗ ━ ━ ━ ━ ┛
     *
     */
    if (
        (elementEdgeEnd > scrollingEdgeEnd && elementSize < scrollingSize) ||
        (elementEdgeStart < scrollingEdgeStart && elementSize > scrollingSize)
    ) {
        return elementEdgeEnd - scrollingEdgeEnd + scrollingBorderEnd;
    }

    return 0;
};

const canOverflow = (overflow: string | null): boolean => {
    return overflow !== "visible" && overflow !== "clip";
};

const getFrameElement = (element: Element): Element | null => {
    if (!element.ownerDocument || !element.ownerDocument.defaultView) {
        return null;
    }

    try {
        return element.ownerDocument.defaultView.frameElement;
    } catch (e) {
        return null;
    }
};

const isHiddenByFrame = (element: Element): boolean => {
    const frame = getFrameElement(element);
    if (!frame) {
        return false;
    }

    return frame.clientHeight < element.scrollHeight || frame.clientWidth < element.scrollWidth;
};

const isScrollable = (element: Element, computedStyle: CSSStyleDeclaration): boolean => {
    if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
        return canOverflow(computedStyle.overflowY) || canOverflow(computedStyle.overflowX) || isHiddenByFrame(element);
    }

    return false;
};

const parentElement = (element: Element): Element | null => {
    const parentNode = element.parentNode;

    if (parentNode !== null && parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        return (parentNode as ShadowRoot).host;
    }

    return parentNode as Element | null;
};

const clamp = (value: number, width: number): number => {
    if (value < -width) {
        return -width;
    }

    if (value > width) {
        return width;
    }

    return value;
};

const isCSSPropertySupported = (property: string): boolean => property in document.documentElement.style;

const getSupportedScrollMarginProperty = (): string => {
    // Webkit uses "scroll-snap-margin" https://bugs.webkit.org/show_bug.cgi?id=189265.
    return ["scroll-margin", "scroll-snap-margin"].filter(isCSSPropertySupported)[0];
};

const getElementScrollSnapArea = (element: Element, computedStyle: CSSStyleDeclaration) => {
    const { top, right, bottom, left } = element.getBoundingClientRect();
    const [scrollMarginTop, scrollMarginRight, scrollMarginBottom, scrollMarginLeft] = [
        "top",
        "right",
        "bottom",
        "left",
    ].map((edge) => {
        const scrollProperty = getSupportedScrollMarginProperty();
        const value = computedStyle.getPropertyValue(`${scrollProperty}-${edge}`);
        return parseInt(value, 10) || 0;
    });

    return [top - scrollMarginTop, right + scrollMarginRight, bottom + scrollMarginBottom, left - scrollMarginLeft];
};

export const elementScrollIntoView = (element: Element, options: IScrollIntoViewOptions): void => {
    if (!element.ownerDocument.documentElement.contains(element)) {
        return;
    }

    // On Chrome and Firefox, document.scrollingElement will return the <html> element.
    // Safari, document.scrollingElement will return the <body> element.
    // On Edge, document.scrollingElement will return the <body> element.
    // IE11 does not support document.scrollingElement, but you can assume its <html>.
    // Used to handle the top most element that can be scrolled
    const scrollingElement = document.scrollingElement || document.documentElement;

    // Collect all the scrolling boxes, as defined in the spec: https://drafts.csswg.org/cssom-view/#scrolling-box
    const frames: Element[] = [];

    const documentElementStyle = getComputedStyle(document.documentElement);

    for (let cursor = parentElement(element); cursor !== null; cursor = parentElement(cursor)) {
        // Stop when we reach the viewport
        if (cursor === scrollingElement) {
            frames.push(cursor);
            break;
        }

        const cursorStyle = getComputedStyle(cursor);

        // Skip document.body if it's not the scrollingElement and documentElement isn't independently scrollable
        if (
            cursor === document.body &&
            isScrollable(cursor, cursorStyle) &&
            !isScrollable(document.documentElement, documentElementStyle)
        ) {
            continue;
        }

        // Now we check if the element is scrollable,
        // this code only runs if the loop haven't already hit the viewport or a custom boundary
        if (isScrollable(cursor, cursorStyle)) {
            frames.push(cursor);
        }

        if (cursorStyle.position === "fixed") {
            break;
        }
    }

    // Support pinch-zooming properly, making sure elements scroll into the visual viewport
    // Browsers that don't support visualViewport
    // will report the layout viewport dimensions on document.documentElement.clientWidth/Height
    // and viewport dimensions on window.innerWidth/Height
    // https://www.quirksmode.org/mobile/viewports2.html
    // https://bokand.github.io/viewport/index.html
    const viewportWidth = window.visualViewport ? window.visualViewport.width : innerWidth;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : innerHeight;

    // Newer browsers supports scroll[X|Y], page[X|Y]Offset is
    const viewportX = window.scrollX || window.pageXOffset;
    const viewportY = window.scrollY || window.pageYOffset;

    const computedStyle = getComputedStyle(element);

    const [targetTop, targetRight, targetBottom, targetLeft] = getElementScrollSnapArea(element, computedStyle);
    const targetHeight = targetBottom - targetTop;
    const targetWidth = targetRight - targetLeft;

    const writingMode = normalizeWritingMode(
        computedStyle.writingMode ||
            computedStyle.getPropertyValue("-webkit-writing-mode") ||
            computedStyle.getPropertyValue("-ms-writing-mode"),
    );

    const isLTR = computedStyle.direction !== "rtl";

    const [alignX, alignY] = toPhysicalAlignment(options, writingMode, isLTR);

    let targetBlock = (() => {
        switch (alignY) {
            case ScrollAlignment.CenterAlways:
                return targetTop + targetHeight / 2;

            case ScrollAlignment.LeftOrTop:
            case ScrollAlignment.ToEdgeIfNeeded:
                return targetTop;

            case ScrollAlignment.RightOrBottom:
                return targetBottom;
        }
    })();

    let targetInline = (() => {
        switch (alignX) {
            case ScrollAlignment.CenterAlways:
                return targetLeft + targetWidth / 2;

            case ScrollAlignment.RightOrBottom:
                return targetRight;

            case ScrollAlignment.LeftOrTop:
            case ScrollAlignment.ToEdgeIfNeeded:
                return targetLeft;
        }
    })();

    type IAction = () => void;

    const actions: IAction[] = [];
    frames.forEach((frame) => {
        const { height, width, top, right, bottom, left } = frame.getBoundingClientRect();

        const frameStyle = getComputedStyle(frame);
        const borderLeft = parseInt(frameStyle.borderLeftWidth, 10);
        const borderTop = parseInt(frameStyle.borderTopWidth, 10);
        const borderRight = parseInt(frameStyle.borderRightWidth, 10);
        const borderBottom = parseInt(frameStyle.borderBottomWidth, 10);

        let blockScroll = 0;
        let inlineScroll = 0;

        // The property existance checks for offfset[Width|Height] is because only HTMLElement objects have them,
        // but any Element might pass by here
        // @TODO find out if the "as HTMLElement" overrides can be dropped
        const scrollbarWidth =
            "offsetWidth" in frame
                ? (frame as HTMLElement).offsetWidth - (frame as HTMLElement).clientWidth - borderLeft - borderRight
                : 0;
        const scrollbarHeight =
            "offsetHeight" in frame
                ? (frame as HTMLElement).offsetHeight - (frame as HTMLElement).clientHeight - borderTop - borderBottom
                : 0;

        if (scrollingElement === frame) {
            // Handle viewport logic (document.documentElement or document.body)

            switch (alignY) {
                case ScrollAlignment.LeftOrTop: {
                    blockScroll = targetBlock;
                    break;
                }
                case ScrollAlignment.RightOrBottom: {
                    blockScroll = targetBlock - viewportHeight;
                    break;
                }
                case ScrollAlignment.CenterAlways: {
                    blockScroll = targetBlock - viewportHeight / 2;
                    break;
                }
                case ScrollAlignment.ToEdgeIfNeeded: {
                    blockScroll = alignNearest(
                        viewportY,
                        viewportY + viewportHeight,
                        viewportHeight,
                        borderTop,
                        borderBottom,
                        viewportY + targetBlock,
                        viewportY + targetBlock + targetHeight,
                        targetHeight,
                    );
                    break;
                }
            }

            switch (alignX) {
                case ScrollAlignment.LeftOrTop: {
                    inlineScroll = targetInline;
                    break;
                }
                case ScrollAlignment.RightOrBottom: {
                    inlineScroll = targetInline - viewportWidth;
                    break;
                }
                case ScrollAlignment.CenterAlways: {
                    inlineScroll = targetInline - viewportWidth / 2;
                    break;
                }
                case ScrollAlignment.ToEdgeIfNeeded: {
                    inlineScroll = alignNearest(
                        viewportX,
                        viewportX + viewportWidth,
                        viewportWidth,
                        borderLeft,
                        borderRight,
                        viewportX + targetInline,
                        viewportX + targetInline + targetWidth,
                        targetWidth,
                    );
                    break;
                }
            }

            blockScroll += viewportY;
            inlineScroll += viewportX;
        } else {
            // Handle each scrolling frame that might exist between the target and the viewport

            switch (alignY) {
                case ScrollAlignment.LeftOrTop: {
                    blockScroll = targetBlock - top - borderTop;
                    break;
                }
                case ScrollAlignment.RightOrBottom: {
                    blockScroll = targetBlock - bottom + borderBottom + scrollbarHeight;
                    break;
                }
                case ScrollAlignment.CenterAlways: {
                    blockScroll = targetBlock - (top + height / 2) + scrollbarHeight / 2;
                    break;
                }
                case ScrollAlignment.ToEdgeIfNeeded: {
                    blockScroll = alignNearest(
                        top,
                        bottom,
                        height,
                        borderTop,
                        borderBottom + scrollbarHeight,
                        targetBlock,
                        targetBlock + targetHeight,
                        targetHeight,
                    );
                    break;
                }
            }

            switch (alignX) {
                case ScrollAlignment.LeftOrTop: {
                    inlineScroll = targetInline - left - borderLeft;
                    break;
                }
                case ScrollAlignment.RightOrBottom: {
                    inlineScroll = targetInline - right + borderRight + scrollbarWidth;
                    break;
                }
                case ScrollAlignment.CenterAlways: {
                    inlineScroll = targetInline - (left + width / 2) + scrollbarWidth / 2;
                    break;
                }
                case ScrollAlignment.ToEdgeIfNeeded: {
                    inlineScroll = alignNearest(
                        left,
                        right,
                        width,
                        borderLeft,
                        borderRight + scrollbarWidth,
                        targetInline,
                        targetInline + targetWidth,
                        targetWidth,
                    );
                    break;
                }
            }

            const { scrollLeft, scrollTop } = frame;
            // Ensure scroll coordinates are not out of bounds while applying scroll offsets
            blockScroll = clamp(scrollTop + blockScroll, frame.scrollHeight - height + scrollbarHeight);
            inlineScroll = clamp(scrollLeft + inlineScroll, frame.scrollWidth - width + scrollbarWidth);

            // Cache the offset so that parent frames can scroll this into view correctly
            targetBlock += scrollTop - blockScroll;
            targetInline += scrollLeft - inlineScroll;
        }

        actions.push(() => elementScroll(frame, { ...options, top: blockScroll, left: inlineScroll }));
    });

    actions.forEach((run) => run());
};

export const elementScrollIntoViewPolyfill = (animationOptions?: IAnimationOptions): void => {
    if (isScrollBehaviorSupported()) {
        return;
    }

    const originalFunc = original.elementScrollIntoView;

    modifyPrototypes(
        (prototype) =>
            (prototype.scrollIntoView = function scrollIntoView(): void {
                const scrollIntoViewOptions = arguments[0];

                if (arguments.length === 1 && isObject(scrollIntoViewOptions)) {
                    return elementScrollIntoView(this, { ...scrollIntoViewOptions, ...animationOptions });
                }

                return originalFunc.apply(this, arguments as any);
            }),
    );
};

/* eslint-disable no-bitwise */
import { checkBehavior, failedExecuteInvalidEnumValue, scrollingElement } from "./common.js";
import type { IScrollConfig } from "./scroll-step";
import { elementScroll } from "./scroll.js";

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

const calcPhysicalAxis = <T>(writingMode: WritingMode, isLTR: boolean, hPos: T, vPos: T): [number, T, T] => {
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
            [hPos, vPos] = [vPos, hPos];
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

    return [layout, hPos, vPos];
};

const isXReversed = (computedStyle: Readonly<CSSStyleDeclaration>): boolean => {
    const layout = calcPhysicalAxis(
        normalizeWritingMode(computedStyle.writingMode),
        computedStyle.direction !== "rtl",
        undefined,
        undefined,
    )[0];
    return (layout & 1) === 1;
};

// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/dom/element.cc;l=1097-1189;drc=6a7533d4a1e9f2372223a9d912a9e53a6fa35ae0
const toPhysicalAlignment = (
    options: Readonly<ScrollIntoViewOptions>,
    writingMode: WritingMode,
    isLTR: boolean,
): Tuple2<ScrollAlignment> => {
    const [layout, hPos, vPos] = calcPhysicalAxis(
        writingMode,
        isLTR,
        options.block || "start",
        options.inline || "nearest",
    );

    return [hPos, vPos].map((value, index) => {
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
const mapNearest = (
    align: ScrollAlignment,
    scrollingEdgeStart: number,
    scrollingEdgeEnd: number,
    scrollingSize: number,
    elementEdgeStart: number,
    elementEdgeEnd: number,
    elementSize: number,
): Exclude<ScrollAlignment, ScrollAlignment.ToEdgeIfNeeded> | null => {
    if (align !== ScrollAlignment.ToEdgeIfNeeded) {
        return align;
    }

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
        return null;
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
        return ScrollAlignment.LeftOrTop;
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
        return ScrollAlignment.RightOrBottom;
    }

    return null;
};

const canOverflow = (overflow: string | null): boolean => {
    return overflow !== "visible" && overflow !== "clip";
};

const getFrameElement = (element: Element): Element | null => {
    try {
        return element.ownerDocument.defaultView?.frameElement || null;
    } catch {
        return null;
    }
};

const isScrollable = (element: Element, computedStyle: Readonly<CSSStyleDeclaration>): boolean => {
    if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
        return (
            canOverflow(computedStyle.overflowY) ||
            canOverflow(computedStyle.overflowX) ||
            element === scrollingElement(element)
        );
    }

    return false;
};

const parentElement = (element: Element): Element | null => {
    const pNode = element.parentNode;
    const pElement = element.parentElement;

    if (pElement === null && pNode !== null) {
        if (pNode.nodeType === /** Node.DOCUMENT_FRAGMENT_NODE */ 11) {
            return (pNode as ShadowRoot).host;
        }
        if (pNode.nodeType === /** Node.DOCUMENT_NODE */ 9) {
            return getFrameElement(element);
        }
    }

    return pElement;
};

const clamp = (value: number, min: number, max: number): number => {
    if (value < min) {
        return min;
    }

    if (value > max) {
        return max;
    }

    return value;
};

const getSupportedScrollMarginProperty = (
    ownerDocument: Document,
): "scroll-margin" | "scroll-snap-margin" | undefined => {
    // Webkit uses "scroll-snap-margin" https://bugs.webkit.org/show_bug.cgi?id=189265.
    return (["scroll-margin", "scroll-snap-margin"] as const).filter(
        (property) => property in ownerDocument.documentElement.style,
    )[0];
};

const getElementScrollSnapArea = (
    element: Element,
    elementRect: Readonly<DOMRect>,
    computedStyle: Readonly<CSSStyleDeclaration>,
): [top: number, right: number, bottom: number, left: number] => {
    const { top, right, bottom, left } = elementRect;
    const scrollProperty = getSupportedScrollMarginProperty(element.ownerDocument);
    if (!scrollProperty) {
        return [top, right, bottom, left];
    }

    const scrollMarginValue = (edge: "top" | "right" | "bottom" | "left"): number => {
        const value = computedStyle.getPropertyValue(`${scrollProperty}-${edge}`);
        return parseInt(value, 10) || 0;
    };

    return [
        top - scrollMarginValue("top"),
        right + scrollMarginValue("right"),
        bottom + scrollMarginValue("bottom"),
        left - scrollMarginValue("left"),
    ];
};

const calcAlignEdge = (align: ScrollAlignment, start: number, end: number): number => {
    switch (align) {
        case ScrollAlignment.CenterAlways:
            return (start + end) / 2;

        case ScrollAlignment.RightOrBottom:
            return end;

        case ScrollAlignment.LeftOrTop:
        case ScrollAlignment.ToEdgeIfNeeded:
            return start;
    }
};

const getFrameViewport = (frame: Element, frameRect: Readonly<DOMRect>) => {
    const visualViewport = frame.ownerDocument.defaultView?.visualViewport;
    const [x, y, width, height] =
        frame === scrollingElement(frame)
            ? [0, 0, visualViewport?.width ?? frame.clientWidth, visualViewport?.height ?? frame.clientHeight]
            : [frameRect.left, frameRect.top, frame.clientWidth, frame.clientHeight];

    const left = x + frame.clientLeft;
    const top = y + frame.clientTop;
    const right = left + width;
    const bottom = top + height;

    return [top, right, bottom, left] as const;
};

const computeScrollIntoView = (element: Element, options: ScrollIntoViewOptions): [Element, ScrollToOptions][] => {
    // Collect all the scrolling boxes, as defined in the spec: https://drafts.csswg.org/cssom-view/#scrolling-box
    const actions: [Element, ScrollToOptions][] = [];

    let ownerDocument = element.ownerDocument;
    let ownerWindow = ownerDocument.defaultView;

    if (!ownerWindow) {
        return actions;
    }

    const computedStyle = window.getComputedStyle(element);
    const isLTR = computedStyle.direction !== "rtl";

    const writingMode = normalizeWritingMode(
        computedStyle.writingMode ||
            computedStyle.getPropertyValue("-webkit-writing-mode") ||
            computedStyle.getPropertyValue("-ms-writing-mode"),
    );

    const [alignH, alignV] = toPhysicalAlignment(options, writingMode, isLTR);

    let [top, right, bottom, left] = getElementScrollSnapArea(element, element.getBoundingClientRect(), computedStyle);

    for (let frame = parentElement(element); frame !== null; frame = parentElement(frame)) {
        if (ownerDocument !== frame.ownerDocument) {
            ownerDocument = frame.ownerDocument;
            ownerWindow = ownerDocument.defaultView;
            if (!ownerWindow) {
                break;
            }

            const { left: dX, top: dY } = frame.getBoundingClientRect();
            top += dY;
            right += dX;
            bottom += dY;
            left += dX;
        }

        const frameStyle = ownerWindow.getComputedStyle(frame);

        if (frameStyle.position === "fixed") {
            break;
        }

        if (!isScrollable(frame, frameStyle)) {
            continue;
        }

        const frameRect = frame.getBoundingClientRect();

        const [frameTop, frameRight, frameBottom, frameLeft] = getFrameViewport(frame, frameRect);

        const eAlignH = mapNearest(alignH, frameLeft, frameRight, frame.clientWidth, left, right, right - left);
        const eAlignV = mapNearest(alignV, frameTop, frameBottom, frame.clientHeight, top, bottom, bottom - top);

        const diffX =
            eAlignH === null ? 0 : calcAlignEdge(eAlignH, left, right) - calcAlignEdge(eAlignH, frameLeft, frameRight);
        const diffY =
            eAlignV === null ? 0 : calcAlignEdge(eAlignV, top, bottom) - calcAlignEdge(eAlignV, frameTop, frameBottom);

        const moveX = isXReversed(frameStyle)
            ? clamp(diffX, -frame.scrollWidth + frame.clientWidth - frame.scrollLeft, -frame.scrollLeft)
            : clamp(diffX, -frame.scrollLeft, frame.scrollWidth - frame.clientWidth - frame.scrollLeft);
        const moveY = clamp(diffY, -frame.scrollTop, frame.scrollHeight - frame.clientHeight - frame.scrollTop);

        actions.push([
            frame,
            { left: frame.scrollLeft + moveX, top: frame.scrollTop + moveY, behavior: options.behavior },
        ]);

        top = Math.max(top - moveY, frameTop);
        right = Math.min(right - moveX, frameRight);
        bottom = Math.min(bottom - moveY, frameBottom);
        left = Math.max(left - moveX, frameLeft);
    }

    return actions;
};

export const scrollIntoView = (
    element: Element,
    scrollIntoViewOptions?: ScrollIntoViewOptions,
    config?: IScrollConfig,
): void => {
    const options = scrollIntoViewOptions || {};

    if (!checkBehavior(options.behavior)) {
        throw new TypeError(failedExecuteInvalidEnumValue("scrollIntoView", "Element", options.behavior));
    }

    const actions = computeScrollIntoView(element, options);

    actions.forEach(([frame, scrollToOptions]) => {
        elementScroll(frame, scrollToOptions, config);
    });
};

export const elementScrollIntoView = scrollIntoView;

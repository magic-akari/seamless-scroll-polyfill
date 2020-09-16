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
    AlignToEdgeIfNeeded,
    AlignCenterAlways,
    AlignTopAlways,
    AlignBottomAlways,
    AlignLeftAlways,
    AlignRightAlways,
}
const enum ScrollOrientation {
    HorizontalScroll,
    VerticalScroll,
}

// https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/element.cc?l=647-681&rcl=02a6466f4efa021e4e198f373eccda3cfc56142b
const toPhysicalAlignment = (
    options: ScrollIntoViewOptions,
    axis: ScrollOrientation,
    isHorizontalWritingMode: boolean,
    isFlippedBlocksMode: boolean,
): ScrollAlignment => {
    const alignment =
        (axis === ScrollOrientation.HorizontalScroll && isHorizontalWritingMode) ||
        (axis === ScrollOrientation.VerticalScroll && !isHorizontalWritingMode)
            ? options.inline
            : options.block;

    if (alignment === "center") {
        return ScrollAlignment.AlignCenterAlways;
    }
    if (alignment === "nearest") {
        return ScrollAlignment.AlignToEdgeIfNeeded;
    }
    if (alignment === "start") {
        return axis === ScrollOrientation.HorizontalScroll
            ? isFlippedBlocksMode
                ? ScrollAlignment.AlignRightAlways
                : ScrollAlignment.AlignLeftAlways
            : ScrollAlignment.AlignTopAlways;
    }
    if (alignment === "end") {
        return axis === ScrollOrientation.HorizontalScroll
            ? isFlippedBlocksMode
                ? ScrollAlignment.AlignLeftAlways
                : ScrollAlignment.AlignRightAlways
            : ScrollAlignment.AlignBottomAlways;
    }

    // Default values
    if (isHorizontalWritingMode) {
        return axis === ScrollOrientation.HorizontalScroll
            ? ScrollAlignment.AlignToEdgeIfNeeded
            : ScrollAlignment.AlignTopAlways;
    }
    return axis === ScrollOrientation.HorizontalScroll
        ? ScrollAlignment.AlignLeftAlways
        : ScrollAlignment.AlignToEdgeIfNeeded;
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

const canOverflow = (overflow: string | null) => {
    return overflow !== "visible" && overflow !== "clip";
};

const isScrollable = (element: Element) => {
    if (element.clientHeight < element.scrollHeight || element.clientWidth < element.scrollWidth) {
        const style = getComputedStyle(element);
        return canOverflow(style.overflowY) || canOverflow(style.overflowX);
    }

    return false;
};

const parentElement = (element: Element): Element | null => {
    const parentNode = element.parentNode;
    return (
        parentNode &&
        (parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE
            ? (parentNode as ShadowRoot).host
            : (parentNode as Element))
    );
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

    for (let cursor = parentElement(element); cursor !== null; cursor = parentElement(cursor)) {
        // Stop when we reach the viewport
        if (cursor === scrollingElement) {
            frames.push(cursor);
            break;
        }

        // Skip document.body if it's not the scrollingElement and documentElement isn't independently scrollable
        if (cursor === document.body && isScrollable(cursor) && !isScrollable(document.documentElement)) {
            continue;
        }

        // Now we check if the element is scrollable,
        // this code only runs if the loop haven't already hit the viewport or a custom boundary
        if (isScrollable(cursor)) {
            frames.push(cursor);
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

    const {
        height: targetHeight,
        width: targetWidth,
        top: targetTop,
        right: targetRight,
        bottom: targetBottom,
        left: targetLeft,
    } = element.getBoundingClientRect();

    const computedStyle = getComputedStyle(element);
    const writingMode =
        computedStyle.writingMode ||
        computedStyle.getPropertyValue("-webkit-writing-mode") ||
        computedStyle.getPropertyValue("-ms-writing-mode") ||
        "horizontal-tb";

    const isHorizontalWritingMode = ["horizontal-tb", "lr", "lr-tb", "rl"].some((mode) => mode === writingMode);
    const isFlippedBlocksWritingMode = ["vertical-rl", "tb-rl"].some((mode) => mode === writingMode);

    const alignX = toPhysicalAlignment(
        options,
        ScrollOrientation.HorizontalScroll,
        isHorizontalWritingMode,
        isFlippedBlocksWritingMode,
    );
    const alignY = toPhysicalAlignment(
        options,
        ScrollOrientation.VerticalScroll,
        isHorizontalWritingMode,
        isFlippedBlocksWritingMode,
    );

    let targetBlock = (() => {
        switch (alignY) {
            case ScrollAlignment.AlignTopAlways:
            case ScrollAlignment.AlignToEdgeIfNeeded:
                return targetTop;
            case ScrollAlignment.AlignBottomAlways:
                return targetBottom;
            // case ScrollAlignment.AlignCenterAlways:
            default:
                return targetTop + targetHeight / 2;
        }
    })();

    let targetInline = (() => {
        switch (alignX) {
            case ScrollAlignment.AlignCenterAlways:
                return targetLeft + targetWidth / 2;
            case ScrollAlignment.AlignRightAlways:
                return targetRight;
            // case ScrollAlignment.AlignLeftAlways:
            // case ScrollAlignment.AlignToEdgeIfNeeded:
            default:
                return targetLeft;
        }
    })();

    type IAction = () => void;

    const actions: IAction[] = [];
    for (const frame of frames) {
        const { height, width, top, right, bottom, left } = frame.getBoundingClientRect();

        const frameStyle = getComputedStyle(frame);
        const borderLeft = parseInt(frameStyle.borderLeftWidth as string, 10);
        const borderTop = parseInt(frameStyle.borderTopWidth as string, 10);
        const borderRight = parseInt(frameStyle.borderRightWidth as string, 10);
        const borderBottom = parseInt(frameStyle.borderBottomWidth as string, 10);

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
                case ScrollAlignment.AlignTopAlways: {
                    blockScroll = targetBlock;
                    break;
                }
                case ScrollAlignment.AlignBottomAlways: {
                    blockScroll = targetBlock - viewportHeight;
                    break;
                }
                case ScrollAlignment.AlignCenterAlways: {
                    blockScroll = targetBlock - viewportHeight / 2;
                    break;
                }
                case ScrollAlignment.AlignToEdgeIfNeeded: {
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
                case ScrollAlignment.AlignLeftAlways: {
                    inlineScroll = targetInline;
                    break;
                }
                case ScrollAlignment.AlignRightAlways: {
                    inlineScroll = targetInline - viewportWidth;
                    break;
                }
                case ScrollAlignment.AlignCenterAlways: {
                    inlineScroll = targetInline - viewportWidth / 2;
                    break;
                }
                case ScrollAlignment.AlignToEdgeIfNeeded: {
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

            // Apply scroll position offsets and ensure they are within bounds
            blockScroll = Math.max(0, blockScroll + viewportY);
            inlineScroll = Math.max(0, inlineScroll + viewportX);
        } else {
            // Handle each scrolling frame that might exist between the target and the viewport

            switch (alignY) {
                case ScrollAlignment.AlignTopAlways: {
                    blockScroll = targetBlock - top - borderTop;
                    break;
                }
                case ScrollAlignment.AlignBottomAlways: {
                    blockScroll = targetBlock - bottom + borderBottom + scrollbarHeight;
                    break;
                }
                case ScrollAlignment.AlignCenterAlways: {
                    blockScroll = targetBlock - (top + height / 2) + scrollbarHeight / 2;
                    break;
                }
                case ScrollAlignment.AlignToEdgeIfNeeded: {
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
                case ScrollAlignment.AlignLeftAlways: {
                    inlineScroll = targetInline - left - borderLeft;
                    break;
                }
                case ScrollAlignment.AlignRightAlways: {
                    inlineScroll = targetInline - right + borderRight + scrollbarWidth;
                    break;
                }
                case ScrollAlignment.AlignCenterAlways: {
                    inlineScroll = targetInline - (left + width / 2) + scrollbarWidth / 2;
                    break;
                }
                case ScrollAlignment.AlignToEdgeIfNeeded: {
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
            blockScroll = Math.max(0, Math.min(scrollTop + blockScroll, frame.scrollHeight - height + scrollbarHeight));
            inlineScroll = Math.max(0, Math.min(scrollLeft + inlineScroll, frame.scrollWidth - width + scrollbarWidth));

            // Cache the offset so that parent frames can scroll this into view correctly
            targetBlock += scrollTop - blockScroll;
            targetInline += scrollLeft - inlineScroll;
        }

        actions.push(() => elementScroll(frame, { ...options, top: blockScroll, left: inlineScroll }));
    }

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

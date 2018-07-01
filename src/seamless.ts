interface IWindow extends Window {
  Element: typeof Element;
}

interface Ioption {
  force?: boolean;
  duration?: number;
  win?: IWindow;
  doc?: Document;
}

export const seamless = ({
  force = false,
  duration = 468,
  win = window as IWindow,
  doc = document,
}: Ioption = {}) => {
  // return if scroll behavior is supported and polyfill is not forced
  if ("scrollBehavior" in doc.documentElement.style && force !== true) {
    return;
  }

  // globals
  const SCROLL_TIME = ~~duration;

  const scrollElement = function(this: Element, x: number, y: number) {
    this.scrollLeft = x;
    this.scrollTop = y;
  };

  // object gathering original scroll methods
  const original = {
    scroll: win.scroll || win.scrollTo,
    scrollBy: win.scrollBy,
    elementScroll: win.Element.prototype.scroll || scrollElement,
    scrollIntoView: win.Element.prototype.scrollIntoView,
  };

  // define timing method
  const now: (() => number) =
    win.performance && win.performance.now
      ? win.performance.now.bind(win.performance)
      : Date.now;

  const isMicrosoftBrowser = (userAgent: string) => {
    const userAgentPatterns = ["MSIE ", "Trident/", "Edge/"];

    return new RegExp(userAgentPatterns.join("|")).test(userAgent);
  };

  /*
   * IE has rounding bug rounding down clientHeight and clientWidth and
   * rounding up scrollHeight and scrollWidth causing false positives
   * on hasScrollableSpace
   */
  const ROUNDING_TOLERANCE = isMicrosoftBrowser(win.navigator.userAgent)
    ? 1
    : 0;

  const ease = (k: number) => {
    return 0.5 * (1 - Math.cos(Math.PI * k));
  };

  const shouldBailOut = (firstArg?: number | ScrollOptions): boolean => {
    if (
      firstArg === null ||
      typeof firstArg !== "object" ||
      firstArg.behavior === undefined ||
      firstArg.behavior === "auto" ||
      firstArg.behavior === "instant"
    ) {
      // first argument is not an object/null
      // or behavior is auto, instant or undefined
      return true;
    }

    if (typeof firstArg === "object" && firstArg.behavior === "smooth") {
      // first argument is an object and behavior is smooth
      return false;
    }

    // throw error when behavior is not supported
    throw new TypeError(
      "behavior member of ScrollOptions " +
        firstArg.behavior +
        " is not a valid value for enumeration ScrollBehavior.",
    );
  };

  const hasScrollableSpace = (el: Element, axis: "X" | "Y"): boolean => {
    if (axis === "Y") {
      return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
    }

    if (axis === "X") {
      return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
    }

    return false;
  };

  const canOverflow = (el: Element, axis: "X" | "Y"): boolean => {
    const overflowValue = win.getComputedStyle(el, null)[
      ("overflow" + axis) as "overflowX" | "overflowY"
    ];

    return overflowValue === "auto" || overflowValue === "scroll";
  };

  const isScrollable = (el: Element) => {
    const isScrollableY = hasScrollableSpace(el, "Y") && canOverflow(el, "Y");
    const isScrollableX = hasScrollableSpace(el, "X") && canOverflow(el, "X");

    return isScrollableY || isScrollableX;
  };

  const findScrollableParent = (el: Element) => {
    let parent = el;

    do {
      parent = parent.parentElement!;
    } while (parent !== doc.body && isScrollable(parent) === false);

    return parent;
  };

  interface Icontext {
    startTime: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    scrollable: Element | Window;
    method: any;
  }

  const step = (context: Icontext) => {
    if (userInterrupt) {
      return;
    }
    const time = now();
    let elapsed = (time - context.startTime) / SCROLL_TIME;

    // avoid elapsed times higher than one
    elapsed = elapsed > 1 ? 1 : elapsed;

    // apply easing to elapsed time
    const value = ease(elapsed);

    const currentX = context.startX + (context.x - context.startX) * value;
    const currentY = context.startY + (context.y - context.startY) * value;

    context.method.call(context.scrollable, currentX, currentY);

    // scroll more if we have not reached our destination
    if (currentX !== context.x || currentY !== context.y) {
      win.requestAnimationFrame(step.bind(win, context));
    }
  };

  let userInterrupt = false;
  let timeOutHandler: number;

  function userIsScrilling() {
    userInterrupt = true;
    win.clearTimeout(timeOutHandler);
    timeOutHandler = win.setTimeout(userEndScroll, SCROLL_TIME);
  }

  function userEndScroll() {
    userInterrupt = false;
    win.removeEventListener("wheel", userIsScrilling);
    win.removeEventListener("touchmove", userIsScrilling);
  }

  const seamlessScroll = (el: Element, x: number, y: number) => {
    let scrollable: Element | Window;
    let startX: number;
    let startY: number;
    let method;
    const startTime = now();

    // define scroll context
    if (el === doc.body) {
      scrollable = win;
      startX = win.scrollX || win.pageXOffset;
      startY = win.scrollY || win.pageYOffset;
      method = original.scroll;
    } else {
      scrollable = el;
      startX = el.scrollLeft;
      startY = el.scrollTop;
      method = scrollElement;
    }

    win.addEventListener("wheel", userIsScrilling, {
      passive: true,
      once: true,
    });
    win.addEventListener("touchmove", userIsScrilling, {
      passive: true,
      once: true,
    });

    // scroll looping over a frame
    step({
      scrollable,
      method,
      startTime,
      startX,
      startY,
      x,
      y,
    });
  };

  // ORIGINAL METHODS OVERRIDES
  // w.scroll and w.scrollTo
  function winScrollTo(options?: ScrollToOptions): void;
  function winScrollTo(x: number, y: number): void;
  function winScrollTo(firstArg?: any, secondArg?: any): void {
    // avoid action when no arguments are passed
    if (firstArg === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(firstArg) === true) {
      original.scroll.call(
        win,
        firstArg.left !== undefined
          ? firstArg.left
          : typeof firstArg !== "object"
            ? firstArg
            : win.scrollX || win.pageXOffset,
        // use top prop, second argument if present or fallback to scrollY
        firstArg.top !== undefined
          ? firstArg.top
          : secondArg !== undefined
            ? secondArg
            : win.scrollY || win.pageYOffset,
      );

      return;
    }

    const {
      left = win.scrollX || win.pageXOffset,
      top = win.scrollY || win.pageYOffset,
    } = firstArg as ScrollToOptions;

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(win, doc.body, ~~left, ~~top);
  }

  win.scroll = win.scrollTo = winScrollTo;

  // w.scrollBy
  function winScrollBy(options?: ScrollToOptions): void;
  function winScrollBy(x?: number, y?: number): void;
  function winScrollBy(firstArg?: any, secondArg?: any): void {
    // avoid action when no arguments are passed
    if (firstArg === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(firstArg)) {
      original.scrollBy.call(
        win,
        firstArg.left !== undefined
          ? firstArg.left
          : typeof firstArg !== "object"
            ? firstArg
            : 0,
        firstArg.top !== undefined
          ? firstArg.top
          : secondArg !== undefined
            ? secondArg
            : 0,
      );

      return;
    }

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(
      win,
      doc.body,
      ~~firstArg.left + (win.scrollX || win.pageXOffset),
      ~~firstArg.top + (win.scrollY || win.pageYOffset),
    );
  }
  win.scrollBy = winScrollBy;

  // Element.prototype.scroll and Element.prototype.scrollTo
  function eleScrollTo(options?: ScrollToOptions): void;
  function eleScrollTo(x: number, y: number): void;
  function eleScrollTo(this: Element, firstArg?: any, secondArg?: any): void {
    // avoid action when no arguments are passed
    if (firstArg === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(firstArg) === true) {
      // if one number is passed, throw error to match Firefox implementation
      if (typeof firstArg === "number" && secondArg === undefined) {
        throw new SyntaxError("Value could not be converted");
      }

      original.elementScroll.call(
        this,
        // use left prop, first number argument or fallback to scrollLeft
        firstArg.left !== undefined
          ? ~~firstArg.left
          : typeof firstArg !== "object"
            ? ~~firstArg
            : this.scrollLeft,
        // use top prop, second argument or fallback to scrollTop
        firstArg.top !== undefined
          ? ~~firstArg.top
          : secondArg !== undefined
            ? ~~secondArg
            : this.scrollTop,
      );

      return;
    }

    const {
      left = this.scrollLeft,
      top = this.scrollTop,
    } = firstArg as ScrollToOptions;

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(this, this, ~~left, ~~top);
  }
  win.Element.prototype.scroll = win.Element.prototype.scrollTo = eleScrollTo;

  // Element.prototype.scrollBy
  function eleScrollBy(options?: ScrollToOptions): void;
  function eleScrollBy(x: number, y: number): void;
  function eleScrollBy(this: Element, firstArg?: any, secondArg?: any) {
    // avoid action when no arguments are passed
    if (firstArg === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(firstArg) === true) {
      original.elementScroll.call(
        this,
        firstArg.left !== undefined
          ? ~~firstArg.left + this.scrollLeft
          : ~~firstArg + this.scrollLeft,
        firstArg.top !== undefined
          ? ~~firstArg.top + this.scrollTop
          : ~~secondArg + this.scrollTop,
      );

      return;
    }

    this.scroll({
      left: ~~firstArg.left + this.scrollLeft,
      top: ~~firstArg.top + this.scrollTop,
      behavior: firstArg.behavior,
    });
  }
  win.Element.prototype.scrollBy = eleScrollBy;

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

  // https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/dom/element.cc?l=498-532&rcl=b0f7ee7dfea5ecef6850808aefd4beebc753bd06
  const ToPhysicalAlignment = (
    options: ScrollIntoViewOptions,
    axis: ScrollOrientation,
    isHorizontalWritingMode: boolean,
    isFlippedBlocksMode: boolean,
  ): ScrollAlignment => {
    const alignment =
      (axis === ScrollOrientation.HorizontalScroll &&
        isHorizontalWritingMode) ||
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

  // Element.prototype.scrollIntoView
  win.Element.prototype.scrollIntoView = function(
    this: Element,
    arg?: boolean | ScrollIntoViewOptions,
  ): void {
    // avoid smooth behavior if not required
    if (
      arg === undefined ||
      arg === true ||
      arg === false ||
      shouldBailOut(arg) === true
    ) {
      original.scrollIntoView.call(this, arg === undefined ? true : arg);

      return;
    }

    // LET THE SMOOTHNESS BEGIN!
    const scrollableParent = findScrollableParent(this);
    const parentRects = scrollableParent.getBoundingClientRect();
    const clientRects = this.getBoundingClientRect();

    const {
      left: parentLeft,
      right: parentRight,
      top: parentTop,
      bottom: parentBottom,
      height: parentHeight,
      width: parentWidth,
    } = parentRects;

    const {
      left: clientLeft,
      right: clientRight,
      top: clientTop,
      bottom: clientBottom,
      height: clientHeight,
      width: clientWidth,
    } = clientRects;

    const { innerHeight: winInnerHeight, innerWidth: winInnerWidth } = win;

    const { writingMode } = win.getComputedStyle(this);

    const isHorizontalWritingMode = writingMode === "horizontal-tb";
    const isFlippedBlocksWritingMode = writingMode === "vertical-rl";
    const alignX = ToPhysicalAlignment(
      arg,
      ScrollOrientation.HorizontalScroll,
      isHorizontalWritingMode,
      isFlippedBlocksWritingMode,
    );
    const alignY = ToPhysicalAlignment(
      arg,
      ScrollOrientation.VerticalScroll,
      isHorizontalWritingMode,
      isFlippedBlocksWritingMode,
    );

    let cx = 0;
    let cy = 0;
    let dx = 0;
    let dy = 0;
    let px = 0;
    let py = 0;

    switch (alignX) {
      case ScrollAlignment.AlignLeftAlways:
        cx = clientLeft - parentLeft;
        px = parentLeft;
        dx = clientLeft;
        break;
      case ScrollAlignment.AlignCenterAlways:
        cx = clientLeft - parentLeft + clientWidth / 2 - parentWidth / 2;
        px = (parentLeft + parentRight - winInnerWidth) / 2;
        dx = (clientLeft + clientRight - winInnerWidth) / 2;
        break;
      case ScrollAlignment.AlignRightAlways:
        cx = clientRight - parentRight;
        px = parentRight - winInnerWidth;
        dx = clientRight - winInnerWidth;
        break;
      case ScrollAlignment.AlignToEdgeIfNeeded:
        {
          let targetStart = clientLeft + cx;
          if (
            (clientLeft < parentLeft && clientWidth < parentWidth) ||
            (clientRight > parentRight && clientWidth > parentWidth)
          ) {
            cx = clientLeft - parentLeft;
            targetStart = parentLeft;
          } else if (
            (clientLeft < parentLeft && clientWidth > parentWidth) ||
            (clientRight > parentRight && clientWidth < parentWidth)
          ) {
            cx = clientRight - parentRight;
            targetStart = parentRight - clientWidth;
          }

          if (
            (targetStart < 0 && clientWidth < winInnerWidth) ||
            (targetStart + clientWidth > winInnerWidth &&
              clientWidth > winInnerWidth)
          ) {
            px = targetStart;
          } else if (
            (targetStart < 0 && clientWidth > winInnerWidth) ||
            (targetStart + clientWidth > winInnerWidth &&
              clientWidth < winInnerWidth)
          ) {
            px = targetStart + clientWidth - winInnerWidth;
          }
          dx = cx + px;
        }
        break;
    }

    switch (alignY) {
      case ScrollAlignment.AlignTopAlways:
        cy = clientTop - parentTop;
        py = parentTop;
        dy = clientTop;
        break;
      case ScrollAlignment.AlignCenterAlways:
        cy = clientTop - parentTop + clientHeight / 2 - parentHeight / 2;
        py = (parentTop + parentBottom - winInnerHeight) / 2;
        dy = (clientTop + clientBottom - winInnerHeight) / 2;
        break;
      case ScrollAlignment.AlignBottomAlways:
        cy = clientBottom - parentBottom;
        py = parentBottom - winInnerHeight;
        dy = clientBottom - winInnerHeight;
        break;
      case ScrollAlignment.AlignToEdgeIfNeeded:
        {
          let targetStart = clientTop + cy;
          if (
            (clientTop < parentTop && clientHeight < parentHeight) ||
            (clientBottom > parentBottom && clientHeight > parentHeight)
          ) {
            cy = clientTop - parentTop;
            targetStart = parentTop;
          } else if (
            (clientTop < parentTop && clientHeight > parentHeight) ||
            (clientBottom > parentBottom && clientHeight < parentHeight)
          ) {
            cy = clientBottom - parentBottom;
            targetStart = parentBottom - clientHeight;
          }

          if (
            (targetStart < 0 && clientHeight < winInnerHeight) ||
            (targetStart + clientHeight > winInnerHeight &&
              clientHeight > winInnerHeight)
          ) {
            py = targetStart;
          } else if (
            (targetStart < 0 && clientHeight > winInnerHeight) ||
            (targetStart + clientHeight > winInnerHeight &&
              clientHeight < winInnerHeight)
          ) {
            py = targetStart + clientHeight - winInnerHeight;
          }
          dy = cy + py;
        }
        break;
    }

    if (scrollableParent !== doc.body) {
      // reveal element inside parent
      seamlessScroll.call(
        this,
        scrollableParent,
        scrollableParent.scrollLeft + cx,
        scrollableParent.scrollTop + cy,
      );

      // reveal parent in viewport unless is fixed
      if (win.getComputedStyle(scrollableParent).position !== "fixed") {
        win.scrollBy({
          left: px,
          top: py,
          behavior: "smooth",
        });
      }
    } else {
      // reveal element in viewport
      win.scrollBy({
        left: dx,
        top: dy,
        behavior: "smooth",
      });
    }
  };
};

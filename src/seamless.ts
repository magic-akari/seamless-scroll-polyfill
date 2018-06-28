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

  const shouldBailOut = (
    firstArg: number | { behavior?: "auto" | "instant" | "smooth" },
  ): boolean => {
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
    let parent;

    do {
      parent = el.parentElement;
    } while (parent !== doc.body && isScrollable(parent!) === false);

    return parent!;
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
    let scrollable;
    let startX;
    let startY;
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
  win.scroll = win.scrollTo = (...args: any[]) => {
    // avoid action when no arguments are passed
    if (args[0] === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(args[0]) === true) {
      original.scroll.call(
        win,
        args[0].left !== undefined
          ? args[0].left
          : typeof args[0] !== "object"
            ? args[0]
            : win.scrollX || win.pageXOffset,
        // use top prop, second argument if present or fallback to scrollY
        args[0].top !== undefined
          ? args[0].top
          : args[1] !== undefined
            ? args[1]
            : win.scrollY || win.pageYOffset,
      );

      return;
    }

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(
      win,
      doc.body,
      args[0].left !== undefined
        ? ~~args[0].left
        : win.scrollX || win.pageXOffset,
      args[0].top !== undefined
        ? ~~args[0].top
        : win.scrollY || win.pageYOffset,
    );
  };

  // w.scrollBy
  win.scrollBy = (...args: any[]) => {
    // avoid action when no arguments are passed
    if (args[0] === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(args[0])) {
      original.scrollBy.call(
        win,
        args[0].left !== undefined
          ? args[0].left
          : typeof args[0] !== "object"
            ? args[0]
            : 0,
        args[0].top !== undefined
          ? args[0].top
          : args[1] !== undefined
            ? args[1]
            : 0,
      );

      return;
    }

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(
      win,
      doc.body,
      ~~args[0].left + (win.scrollX || win.pageXOffset),
      ~~args[0].top + (win.scrollY || win.pageYOffset),
    );
  };

  // Element.prototype.scroll and Element.prototype.scrollTo
  win.Element.prototype.scroll = win.Element.prototype.scrollTo = function() {
    // avoid action when no arguments are passed
    if (arguments[0] === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(arguments[0]) === true) {
      // if one number is passed, throw error to match Firefox implementation
      if (typeof arguments[0] === "number" && arguments[1] === undefined) {
        throw new SyntaxError("Value could not be converted");
      }

      original.elementScroll.call(
        this,
        // use left prop, first number argument or fallback to scrollLeft
        arguments[0].left !== undefined
          ? ~~arguments[0].left
          : typeof arguments[0] !== "object"
            ? ~~arguments[0]
            : this.scrollLeft,
        // use top prop, second argument or fallback to scrollTop
        arguments[0].top !== undefined
          ? ~~arguments[0].top
          : arguments[1] !== undefined
            ? ~~arguments[1]
            : this.scrollTop,
      );

      return;
    }

    const left = arguments[0].left;
    const top = arguments[0].top;

    // LET THE SMOOTHNESS BEGIN!
    seamlessScroll.call(
      this,
      this,
      typeof left === "undefined" ? this.scrollLeft : ~~left,
      typeof top === "undefined" ? this.scrollTop : ~~top,
    );
  };

  // Element.prototype.scrollBy
  win.Element.prototype.scrollBy = function() {
    // avoid action when no arguments are passed
    if (arguments[0] === undefined) {
      return;
    }

    // avoid smooth behavior if not required
    if (shouldBailOut(arguments[0]) === true) {
      original.elementScroll.call(
        this,
        arguments[0].left !== undefined
          ? ~~arguments[0].left + this.scrollLeft
          : ~~arguments[0] + this.scrollLeft,
        arguments[0].top !== undefined
          ? ~~arguments[0].top + this.scrollTop
          : ~~arguments[1] + this.scrollTop,
      );

      return;
    }

    this.scroll({
      left: ~~arguments[0].left + this.scrollLeft,
      top: ~~arguments[0].top + this.scrollTop,
      behavior: arguments[0].behavior,
    });
  };

  // Element.prototype.scrollIntoView
  win.Element.prototype.scrollIntoView = function() {
    // avoid smooth behavior if not required
    if (shouldBailOut(arguments[0]) === true) {
      original.scrollIntoView.call(
        this,
        arguments[0] === undefined ? true : arguments[0],
      );

      return;
    }

    // LET THE SMOOTHNESS BEGIN!
    const scrollableParent = findScrollableParent(this);
    const parentRects = scrollableParent.getBoundingClientRect();
    const clientRects = this.getBoundingClientRect();

    let cx = 0;
    let cy = 0;
    let dx = 0;
    let dy = 0;
    let px = 0;
    let py = 0;

    const inline = arguments[0].inline || "nearest";
    const block = arguments[0].block || "start";

    switch (inline) {
      case "start":
        cx = clientRects.left - parentRects.left;
        px = parentRects.left;
        dx = clientRects.left;
        break;
      case "center":
        cx =
          clientRects.left -
          parentRects.left +
          clientRects.width / 2 -
          parentRects.width / 2;
        px = (parentRects.left + parentRects.right - win.innerWidth) / 2;
        dx = (clientRects.left + clientRects.right - win.innerWidth) / 2;
        break;
      case "end":
        cx = clientRects.right - parentRects.right;
        px = parentRects.right - win.innerWidth;
        dx = clientRects.right - win.innerWidth;
        break;
      case "nearest":
        // There is still something to do
        // https://drafts.csswg.org/cssom-view/#element-scrolling-members
        cx = 0;
        px = 0;
        dx = 0;
        break;
      default:
        break;
    }

    switch (block) {
      case "start":
        cy = clientRects.top - parentRects.top;
        py = parentRects.top;
        dy = clientRects.top;
        break;
      case "center":
        cy =
          clientRects.top -
          parentRects.top +
          clientRects.height / 2 -
          parentRects.height / 2;
        py = (parentRects.top + parentRects.bottom - win.innerHeight) / 2;
        dy = (clientRects.top + clientRects.bottom - win.innerHeight) / 2;
        break;
      case "end":
        cy = clientRects.bottom - parentRects.bottom;
        py = parentRects.bottom - win.innerHeight;
        dy = clientRects.bottom - win.innerHeight;
        break;
      case "nearest":
        cy = 0;
        py = 0;
        dy = 0;
        break;
      default:
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

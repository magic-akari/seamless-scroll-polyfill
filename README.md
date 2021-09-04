[![Build Status](https://travis-ci.org/magic-akari/seamless-scroll-polyfill.svg?branch=master)](https://travis-ci.org/magic-akari/seamless-scroll-polyfill)

This repo is forked from iamdustan/smoothscroll and rewritten with TypeScript.

## Installation and use

```sh
# npm
npm install seamless-scroll-polyfill --save

# yarn
yarn add seamless-scroll-polyfill
```

## Use polyfill to patch all methods

```js
import { polyfill } from "seamless-scroll-polyfill";

polyfill();
```

## Use specific polyfill

```js
import { elementScrollIntoViewPolyfill } from "seamless-scroll-polyfill";

elementScrollIntoViewPolyfill();
```

## Use methods directly without patching

```js
import { elementScrollIntoView } from "seamless-scroll-polyfill";

elementScrollIntoView(document.querySelector("#target"), { behavior: "smooth", block: "center", inline: "center" });
```

## Import via script

```html
<script src="https://cdn.jsdelivr.net/npm/seamless-scroll-polyfill@2.0.0/lib/bundle.min.js"></script>
<script>
    // patch all methods
    seamless.polyfill();
    // or use specific methods
    seamless.windowScrollBy(window, { behavior: "smooth", top: 200, left: 0 });

    seamless.elementScrollIntoView(document.querySelector("#target"), {
        behavior: "smooth",
        block: "center",
        inline: "center",
    });
</script>
```

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## Thanks

-   [iamdustan/smoothscroll](https://github.com/iamdustan/smoothscroll)
-   [stipsan/compute-scroll-into-view](https://github.com/stipsan/compute-scroll-into-view)

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
import { polyfill } from "seamless-scroll-polyfill/esm/Element.scrollIntoView.js";

polyfill();
```

## Use methods directly without patching

```js
import { elementScrollIntoView } from "seamless-scroll-polyfill";

elementScrollIntoView(document.querySelector("#target"), { behavior: "smooth", block: "center", inline: "center" });
```

## Import via script

```html
<script src="https://cdn.jsdelivr.net/npm/seamless-scroll-polyfill@1.0.0/dist/es5/seamless.js"></script>
<script>
    // patch all methods
    seamless.polyfill();
    // or use specific methods
    seamless.windowScrollBy({ behavior: "smooth", top: 200, left: 0 });

    seamless.elementScrollIntoView(document.querySelector("#target"), {
        behavior: "smooth",
        block: "center",
        inline: "center",
    });
</script>
```

## Auto polyfill via script

```html
<script
    src="https://cdn.jsdelivr.net/npm/seamless-scroll-polyfill@1.0.0/dist/es5/seamless.auto-polyfill.min.js"
    data-seamless
></script>
```

## Generated files structure

|           dir | dist/esm   | dist/umd | dist/es6 | dist/es5 |
| ------------: | ---------- | -------- | -------- | -------- |
| module format | ES Modules | UMD      | UMD      | UMD      |
|    ES version | ESNext     | ESNext   | ES2015   | ES5      |

## Thanks

-   [iamdustan/smoothscroll](https://github.com/iamdustan/smoothscroll)
-   [stipsan/compute-scroll-into-view](https://github.com/stipsan/compute-scroll-into-view)

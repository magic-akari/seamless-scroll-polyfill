import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

/** @type {import('rollup').RollupOptions} */
const rollupOptions = {
    input: "src/index.ts",
    plugins: typescript({
        useTsconfigDeclarationDir: true,
        tsconfigOverride: {
            compilerOptions: {
                target: "es5",
                importHelpers: true,
            },
        },
    }),
    output: [
        {
            file: "lib/index.cjs",
            format: "cjs",
            sourcemap: true,
        },
        {
            file: "lib/bundle.umd.cjs",
            name: "seamless",
            format: "umd",
            sourcemap: true,
        },
        {
            file: "lib/browser.min.js",
            name: "seamless",
            format: "iife",
            sourcemap: true,
            plugins: [terser()],
            footer: `if(typeof module==="object")module.exports=seamless;`,
        },
    ],
};

export default rollupOptions;

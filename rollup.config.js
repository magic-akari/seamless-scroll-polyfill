import minify from "rollup-plugin-babel-minify";
import typescript from "rollup-plugin-typescript2";

const input = "src/seamless.ts";

const tsconfigOverride = {
    compilerOptions: {
        target: "es2015",
        module: "esnext",
        lib: ["dom", "es2015"],
        strict: true,
        sourceMap: true,
        downlevelIteration: true,
    },
};

const plugins = [
    typescript({
        tsconfigOverride,
    }),
];

export default [
    {
        input,
        output: [
            {
                file: "dist/seamless.js",
                name: "seamless",
                format: "umd",
                sourcemap: true,
            },
            {
                file: "dist/seamless.esm.js",
                format: "es",
                sourcemap: true,
            },
        ],
        plugins,
    },
    {
        input,
        output: [
            {
                file: "dist/seamless.min.js",
                name: "seamless",
                format: "umd",
                sourcemap: true,
            },
            {
                file: "dist/seamless.esm.min.js",
                format: "es",
                sourcemap: true,
            },
        ],
        plugins: [...plugins, minify({ comments: false })],
    },
    {
        input,
        output: {
            file: "dist/seamless.es5.js",
            name: "seamless",
            format: "umd",
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        ...tsconfigOverride.compilerOptions,
                        target: "es5",
                    },
                },
            }),
        ],
    },
    {
        input,
        output: {
            file: "dist/seamless.es5.min.js",
            name: "seamless",
            format: "umd",
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        ...tsconfigOverride.compilerOptions,
                        target: "es5",
                    },
                },
            }),
            minify({ comments: false }),
        ],
    },
    {
        input: "src/auto-polyfill.js",
        output: [
            {
                file: "dist/seamless.browser.min.js",
                format: "iife",
                sourcemap: true,
            },
            {
                file: "dist/seamless.es5.min.js",
                name: "seamless",
                format: "umd",
                sourcemap: true,
            },
        ],
        plugins: [
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        ...tsconfigOverride.compilerOptions,
                        target: "es5",
                    },
                },
            }),
            minify({ comments: false }),
        ],
    },
];

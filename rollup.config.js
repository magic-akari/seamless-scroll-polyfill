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
        declaration: true,
        declarationMap: true,
        downlevelIteration: true,
    },
};

const plugins = [
    typescript({
        tsconfigOverride,
    }),
];

const sourceMap = {
    sourcemap: true,
    sourcemapExcludeSources: true,
};

export default [
    {
        input,
        output: [
            {
                file: "dist/seamless.js",
                name: "seamless",
                format: "umd",
                ...sourceMap,
            },
            {
                file: "dist/seamless.esm.js",
                format: "es",
                ...sourceMap,
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
                ...sourceMap,
            },
            {
                file: "dist/seamless.esm.min.js",
                format: "es",
                ...sourceMap,
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
            sourcemapExcludeSources: true,
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
            sourcemapExcludeSources: true,
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
                ...sourceMap,
            },
            {
                file: "dist/seamless.es5.min.js",
                name: "seamless",
                format: "umd",
                ...sourceMap,
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

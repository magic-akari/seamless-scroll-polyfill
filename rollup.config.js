import minify from "rollup-plugin-babel-minify";
import typescript from "rollup-plugin-typescript2";

const sourceMap = {
    sourcemap: true,
    sourcemapExcludeSources: true,
};

const typescriptConfig = typescript({
    tsconfigOverride: {
        compilerOptions: {
            target: "es5",
            outDir: "./dist/es5",
        },
    },
});

export default [
    {
        input: "src/index.ts",
        output: {
            file: "dist/es5/seamless.js",
            name: "seamless",
            format: "umd",
            ...sourceMap,
        },
        plugins: [typescriptConfig],
    },
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/es5/seamless.min.js",
                name: "seamless",
                format: "umd",
                ...sourceMap,
            },
        ],
        plugins: [typescriptConfig, minify({ comments: false })],
    },
    {
        input: "src/auto-polyfill.js",
        output: [
            {
                file: "dist/es5/seamless.auto-polyfill.min.js",
                format: "iife",
                ...sourceMap,
            },
        ],
        plugins: [typescriptConfig, minify({ comments: false })],
    },
];

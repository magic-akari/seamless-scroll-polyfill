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
            file: "lib/bundle.cjs",
            name: "seamless",
            format: "umd",
            sourcemap: true,
        },
        {
            file: "lib/bundle.min.cjs",
            name: "seamless",
            format: "umd",
            sourcemap: true,
            plugins: [terser()],
        },
    ],
};

export default rollupOptions;

import typescript from "rollup-plugin-typescript2";

const input = "src/index.ts";

const tsc = (target, outDir) =>
    typescript({
        tsconfigOverride: {
            compilerOptions: {
                target,
                outDir,
            },
        },
    });

const config = (target, outDir) => {
    return {
        input,
        output: {
            file: `${outDir}/seamless.js`,
            name: "seamless",
            format: "umd",
            sourcemap: true,
        },
        plugins: [tsc(target, outDir)],
    };
};

export default [config("es2018", "dist/umd"), config("es2015", "dist/es6"), config("es5", "dist/es5")];

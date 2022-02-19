## [2.1.8](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.7...v2.1.8) (2022-02-19)


### Bug Fixes

* downlevel to es2015 target ([d1d7e01](https://github.com/magic-akari/seamless-scroll-polyfill/commit/d1d7e0163f3f60230860cbd872ab07fca3145f72))

## [2.1.7](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.6...v2.1.7) (2022-02-17)


### Bug Fixes

* use `.cjs` as bundle extension ([be50916](https://github.com/magic-akari/seamless-scroll-polyfill/commit/be50916c448fc4856464767a9fb20e3e318aa094))

## [2.1.6](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.5...v2.1.6) (2021-12-05)


### Bug Fixes

* allow tree-shake if necessary ([aae469f](https://github.com/magic-akari/seamless-scroll-polyfill/commit/aae469f61abd921e40ebe87133011774e4be0d37))

## [2.1.5](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.4...v2.1.5) (2021-10-25)


### Bug Fixes

* change the output target to es2020 for more compatibility ([c0f5a08](https://github.com/magic-akari/seamless-scroll-polyfill/commit/c0f5a08c19f3a2b7f467b7f227be04db2f27910d))

## [2.1.4](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.3...v2.1.4) (2021-09-23)


### Bug Fixes

* correct nearest position ([f194982](https://github.com/magic-akari/seamless-scroll-polyfill/commit/f194982537532202d661aa158a006b519f99853d))

## [2.1.3](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.2...v2.1.3) (2021-09-20)


### Bug Fixes

* make sure Element#scroll === HTMLElement#scroll === SVGElement#scroll ([0eae3a4](https://github.com/magic-akari/seamless-scroll-polyfill/commit/0eae3a48aa89702562c2dd6e51bf0eb95a055245))

## [2.1.2](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.1...v2.1.2) (2021-09-13)


### Bug Fixes

* call scroll directly to avoid loop deps ([c61cf19](https://github.com/magic-akari/seamless-scroll-polyfill/commit/c61cf19b0e8a47bc2f91da8a9a1fa972eb5c73f3))

## [2.1.1](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.1.0...v2.1.1) (2021-09-11)


### Bug Fixes

* workaround isConnected for IE ([fc88062](https://github.com/magic-akari/seamless-scroll-polyfill/commit/fc88062b3870af90c75a39d1c5a34953a79f4079))

# [2.1.0](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.0.2...v2.1.0) (2021-09-11)


### Features

* export universe scroll, scrollTo and scrollBy functions ([89a631a](https://github.com/magic-akari/seamless-scroll-polyfill/commit/89a631a41eb25c36b560152ef006fba5439e70e8))

## [2.0.2](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.0.1...v2.0.2) (2021-09-07)


### Bug Fixes

* add noUncheckedIndexedAccess ([de61125](https://github.com/magic-akari/seamless-scroll-polyfill/commit/de611259d4f9eab825be9e7260a8afacc12d44cf))

## [2.0.1](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v2.0.0...v2.0.1) (2021-08-31)


### Bug Fixes

* element.scrollIntoView in iframe ([a7409a3](https://github.com/magic-akari/seamless-scroll-polyfill/commit/a7409a3b5ce5629cdcfde729aa84df3278b4308e))

# [2.0.0](https://github.com/magic-akari/seamless-scroll-polyfill/compare/v1.2.4...v2.0.0) (2021-08-22)


### Bug Fixes

* **prettier:** update prettier config ([1578df9](https://github.com/magic-akari/seamless-scroll-polyfill/commit/1578df9a4de46d4dafac3777f59655e19a9e9662))


### Code Refactoring

* for consistency, windowScroll series function parameters changed ([f7b76d0](https://github.com/magic-akari/seamless-scroll-polyfill/commit/f7b76d0577e4ece242fd798d2fc52a49ae98cc8a))
* reorganize scroll and polyfill functions ([f82af52](https://github.com/magic-akari/seamless-scroll-polyfill/commit/f82af529ac5101119fba555f9b69c6f45dabda01))
* the `ScrollConfig` is separated from the `ScrollOptions` as the third parameter ([c29b463](https://github.com/magic-akari/seamless-scroll-polyfill/commit/c29b4637d7741e66d2a2db769848ab87aaf7472b))
* **rollup:** remove auto-polyfill ([7ea74f7](https://github.com/magic-akari/seamless-scroll-polyfill/commit/7ea74f7691be17091963b4708ec311ef892727ea))


### BREAKING CHANGES

* The output format is only esm(es2021 syntax + es5 lib) and umd. The output file is
changed from `dist` to `lib` location. You can import functions directly from the package name
instead of nested paths.
* The `ScrollConfig` is separated from the `ScrollOptions` as the third parameter.
* `windowScroll`, `windowScrollTo` and `windowScrollBy` now accept `window` as the
first parameter.
* **rollup:** There is no more `auto-polyfill`. This package is no sideEffects now.

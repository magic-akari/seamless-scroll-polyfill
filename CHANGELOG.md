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

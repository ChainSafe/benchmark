# Changelog

## [2.1.0](https://github.com/ChainSafe/benchmark/compare/v2.0.0...v2.1.0) (2025-04-30)


### Features

* add cli flag to trigger gc ([#20](https://github.com/ChainSafe/benchmark/issues/20)) ([9dfdf16](https://github.com/ChainSafe/benchmark/commit/9dfdf166300dd7bf2a364aa43fc9157014885e57))
* add command to compare multiple benchmarks ([80d3b92](https://github.com/ChainSafe/benchmark/commit/80d3b92edfefd06615786b0a96086f8375e776aa))
* add statistical convergence and outlier detection ([#26](https://github.com/ChainSafe/benchmark/issues/26)) ([7efbd6f](https://github.com/ChainSafe/benchmark/commit/7efbd6f746fbc1006604ab1326a7794d9caa7cb5))
* add support for --setupFiles support ([#15](https://github.com/ChainSafe/benchmark/issues/15)) ([ccdf8d9](https://github.com/ChainSafe/benchmark/commit/ccdf8d9c8903d4d419a8479927c459cc47cdefb5))
* add support for embedded runner  ([#6](https://github.com/ChainSafe/benchmark/issues/6)) ([56ae4c1](https://github.com/ChainSafe/benchmark/commit/56ae4c1aceaa5d3dc2676d209e27f5df81e1bf26))
* add ts only jsr publish support ([#30](https://github.com/ChainSafe/benchmark/issues/30)) ([c6a4c6f](https://github.com/ChainSafe/benchmark/commit/c6a4c6fbd7153acc632e199493ceed0b290f35f1))
* dynamic sampling time ([#27](https://github.com/ChainSafe/benchmark/issues/27)) ([e166eb9](https://github.com/ChainSafe/benchmark/commit/e166eb98c490da92b8e0aef25bab9d1faf202557))
* enable eraseable syntax ([#31](https://github.com/ChainSafe/benchmark/issues/31)) ([77c872d](https://github.com/ChainSafe/benchmark/commit/77c872de1b9ac71c0562d1b9f7d68b6f867247e1))
* export afterEach and afterAll hooks ([#23](https://github.com/ChainSafe/benchmark/issues/23)) ([dfe1220](https://github.com/ChainSafe/benchmark/commit/dfe12200440699c4056fb6cf28aaf5665ed602bd))
* support esm and cjs build ([#28](https://github.com/ChainSafe/benchmark/issues/28)) ([7c06ba6](https://github.com/ChainSafe/benchmark/commit/7c06ba688177596447cc70c58a5121265d80fd79))


### Bug Fixes

* cleanup handler for task after completion ([#21](https://github.com/ChainSafe/benchmark/issues/21)) ([80e3bad](https://github.com/ChainSafe/benchmark/commit/80e3bad14ad438203f6ac4c666f9e898b1d6b73c))
* cleanup options when suite finishes ([#24](https://github.com/ChainSafe/benchmark/issues/24)) ([a2a13e7](https://github.com/ChainSafe/benchmark/commit/a2a13e7a94e50fba2dc95e2b1ef808f99331176f))
* fix binary for the package ([#29](https://github.com/ChainSafe/benchmark/issues/29)) ([e1052fa](https://github.com/ChainSafe/benchmark/commit/e1052fa6dfa081fd5577e4e8628aa000b8abd7f8))
* skipped suite does not show up in the report ([#28](https://github.com/ChainSafe/benchmark/issues/28)) ([dc84400](https://github.com/ChainSafe/benchmark/commit/dc84400fffb6e2a6d37c0d6b39c74b4fe8346756))
* update the files included in the build ([#30](https://github.com/ChainSafe/benchmark/issues/30)) ([6005af1](https://github.com/ChainSafe/benchmark/commit/6005af13a68a13030e6e5f93847cec321d61aed2))

## [2.0.0](https://github.com/ChainSafe/benchmark/compare/v1.2.3...v2.0.0) (2025-04-30)


### Features

* add ts only jsr publish support ([#30](https://github.com/ChainSafe/benchmark/issues/30)) ([c6a4c6f](https://github.com/ChainSafe/benchmark/commit/c6a4c6fbd7153acc632e199493ceed0b290f35f1))
* enable eraseable syntax ([#31](https://github.com/ChainSafe/benchmark/issues/31)) ([77c872d](https://github.com/ChainSafe/benchmark/commit/77c872de1b9ac71c0562d1b9f7d68b6f867247e1))


**NOTE: As this release is removing the support for CJS build so we consider it a major release.**

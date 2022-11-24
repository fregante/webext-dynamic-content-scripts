# Contributing

## Demo extension

There's a demo extension in both MV2 (manifest v2) and MV3 (manifest v3) variants. This extension can be build and run manually, via `web-ext` or as a test fixture.

### Building the extension locally

Pick one of:

```sh
npm run demo:build
npm run demo:watch
```

Both MV2 and MV3 versions will be built at the same time

### Running Jest tests

```sh
npm run jest
```

Both MV2 and MV3 versions will be tested in series.

Or pick one:

```sh
TARGET=2 npm run jest:core
TARGET=3 npm run jest:core
```

### Running the demo extension locally

```sh
npx web-ext run
```

You can add these flags to `web-ext`:

- `-t chromium` to open Chrome
- `--sourceDir test/dist/mv3` to open the Manifest v3 version instead of v2

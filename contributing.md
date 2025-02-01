# Contributing

## Demo extension

There's a demo MV3 (manifest v3) extension. This extension can be built and run manually, via `web-ext` or as a test fixture.

### Building the extension locally

Pick one of:

```sh
npm run demo:build
npm run demo:watch
```

### Running Jest tests

```sh
npm run jest
```

### Running the demo extension locally

```sh
npx web-ext run
```

You can add these flags to `web-ext`:

- `-t chromium` to open Chrome

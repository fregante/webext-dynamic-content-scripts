# webext-dynamic-content-scripts

> Automatically inject your `content_scripts` on custom domains.

This is useful when you add extra domains via `chrome.permission`. For example: https://github.com/npmhub/npmhub/issues/29

[![Travis build status](https://api.travis-ci.org/bfred-it/webext-dynamic-content-scripts.svg?branch=master)](https://travis-ci.org/bfred-it/webext-dynamic-content-scripts)
[![npm version](https://img.shields.io/npm/v/webext-dynamic-content-scripts.svg)](https://www.npmjs.com/package/webext-dynamic-content-scripts)

## Install

```sh
npm install --save webext-dynamic-content-scripts
```

## Usage

### Plain files

1. Include the file `dist/webext-dynamic-content-scripts.js` in your manifest.json, both as a `background` script and `content_script`.
2. In your background script **only**, run `injectContentScripts()`

### With a bundler

```js
// background.js
import injectContentScripts from 'webext-dynamic-content-scripts';
injectContentScripts();
```

```js
// content.js
import 'webext-dynamic-content-scripts'; // needed to make sure that scripts aren't loaded twice
```

## API

#### injectContentScripts([tab])

This will inject all the `content_scripts` and their CSS files listed in `manifest.json`.

If `tab` is not specified, `injectContentScripts()` will automatically listen to new tabs and inject the scripts as needed.

##### tab

Type: `Tab` or `number` or `undefined`

A `Tab` object or just its `id` as defined here: https://developer.chrome.com/extensions/tabs#type-Tab

## Related

* [`webext-content-script-ping`](https://github.com/bfred-it/webext-content-script-ping): One-file interface to detect whether your content script have loaded.
* [`webext-options-sync`](https://github.com/bfred-it/webext-options-sync): Helps you manage and autosave your extension's options.
* [`webext-inject-on-install`](https://github.com/bfred-it/webext-inject-on-install): Automatically add content scripts to existing tabs when your extension is installed.
* [`Awesome WebExtensions`](https://github.com/bfred-it/Awesome-WebExtensions): A curated list of awesome resources for Web Extensions development.

## License

MIT © Federico Brigante — [Twitter](http://twitter.com/bfred_it)

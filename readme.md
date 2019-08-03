# webext-dynamic-content-scripts (in short: DCS) [![Travis build status](https://api.travis-ci.org/fregante/webext-dynamic-content-scripts.svg?branch=master)](https://travis-ci.org/fregante/webext-dynamic-content-scripts) [![npm version](https://img.shields.io/npm/v/webext-dynamic-content-scripts.svg)](https://www.npmjs.com/package/webext-dynamic-content-scripts)

> WebExtension module: Dynamically inject `content_scripts`

This is an advanced version of `chrome.tabs.executeScript`/`chrome.tabs.insertCSS`:

- It accepts a mixed JS/CSS object just like in `manifest.json`. <details><summary>Example</summary>

	```js
	DCS.addToTab(tab, {
		run_at: 'document_start',
		all_frames: true,
		css: [
			'content.css'
		],
		js: [
			'jquery.slim.min.js', // example
			'browser-polyfill.min.js', // example
			'content.js'
		]
		// Not supported: all globs properties
	});
	```

	Format details: https://developer.chrome.com/extensions/content_scripts

	</details>

- It can inject scripts automatically to all permitted domains, so if you authorize new domains later, DCS will automatically inject `content_scripts`<details><summary>Example</summary>

	**Specify what you want:**
	```js
	DCS.addToFutureTabs({js: ['file.js']});
	```
	**Or automatically inject ALL scripts already defined in `manifest.json`'s `content_scripts`**, perfect when you want to inject your existing `content_scripts` to new domains authorized via `chrome.permissions`:
	```js
	DCS.addToFutureTabs();
	```

	</details>

- It will inject the scripts only once per tab, automatically, as long as DCS is included in the scripts list (or via `import`/`require`)


## Install

```sh
npm install webext-dynamic-content-scripts
```

### manifest.json

```json
{
	"background": {
		"scripts": [
			"webext-dynamic-content-scripts.js",
			"background.js"
		]
	},
	"content_scripts": [
		{
			"js": [
				"webext-dynamic-content-scripts.js",
				"content.js"
			]
		}
	]
}
```

### webpack, rollup, browserify

```js
// background.js
import DCS from 'webext-dynamic-content-scripts';
```

```js
// content.js
import 'webext-dynamic-content-scripts';
// Needed to make sure that scripts aren't loaded twice.
```


## Usage

You'll find some simple examples in the 3-point description at the start of this readme. This is a full-feature example:

<details><summary><strong>Your content scripts are enabled on <code>github.com</code> but you want to add custom domains:</strong></summary>

In combination with [`webext-domain-permission-toggle`](https://github.com/fregante/webext-domain-permission-toggle), you can implement the feature with two calls

**manifest.json**

```js
{
	"permissions": [
		"https://github.com/*",
		"contextMenus",
		"activeTab" // Required for Firefox support (webext-domain-permission-toggle)
	],
	"browser_action": { // Required for Firefox support (webext-domain-permission-toggle)
		"default_icon": "icon.png"
	},
	"optional_permissions": [
		"http://*/*",
		"https://*/*"
	],
	"background": {
		"scripts": [
			"webext-domain-permission-toggle.js",
			"webext-dynamic-content-scripts.js",
			"background.js"
		]
	},
	"content_scripts": [
		{
			"matches": [
				"https://github.com/*"
			],
			"css": [
				"content.css"
			],
			"js": [
				"webext-dynamic-content-scripts.js",
				"content.js"
			]
		}
	]
}
```

**background.js**

```js
import DPT from 'webext-domain-permission-toggle'; // only with webpack, etc
import DCS from 'webext-dynamic-content-scripts'; // only with webpack, etc

DPT.addContextMenu();
DCS.addToFutureTabs(/* Default: content_scripts from manifest.json */);
```

</details>

## API

### DCS.addToTab(tab, [scripts])

It will inject the specified scripts to the tab via `executeScript` and `insertCSS`.

#### tab

Type: `Tab` `number`

A `Tab` object or just its `id` as defined here: https://developer.chrome.com/extensions/tabs#type-Tab

#### scripts

Type: `Object` `Array`

Default: **all** the JS/CSS files specified in `content_scripts` in `manifest.json`

Format details: https://developer.chrome.com/extensions/content_scripts

It can either be an object, like:

```js
{js: ['a.js', 'b.js']}
```

Or an array of objects (unlikely to be needed but it matches `content_scripts` exactly):

```js
[
	{js: ['a.js']},
	{js: ['b.js']}
]
```


### DCS.addToFutureTabs([scripts])

Same as `DCS.addToTab`, but it will automatically listen to new tabs and inject the scripts as needed.

#### scripts

Same as `scripts` in `DCS.addToTab`.

## Related

* [webext-domain-permission-toggle](https://github.com/fregante/webext-domain-permission-toggle) - Browser-action context menu to request permission for the current tab.
* [webext-options-sync](https://github.com/fregante/webext-options-sync) - Helps you manage and autosave your extension's options.
* [webext-storage-cache](https://github.com/fregante/webext-storage-cache) - Map-like promised cache storage with expiration.
* [webext-detect-page](https://github.com/fregante/webext-detect-page) - Detects where the current browser extension code is being run.
* [webext-content-script-ping](https://github.com/fregante/webext-content-script-ping) - One-file interface to detect whether your content script have loaded.
* [`Awesome WebExtensions`](https://github.com/fregante/Awesome-WebExtensions): A curated list of awesome resources for Web Extensions development.

## License

MIT © [Federico Brigante](https://bfred.it)

# webext-dynamic-content-scripts [![Travis build status](https://api.travis-ci.org/fregante/webext-dynamic-content-scripts.svg?branch=master)](https://travis-ci.org/fregante/webext-dynamic-content-scripts) [![npm version](https://img.shields.io/npm/v/webext-dynamic-content-scripts.svg)](https://www.npmjs.com/package/webext-dynamic-content-scripts)

> WebExtension module: Automatically registers your `content_scripts` on domains added via `permission.request`

For example, when your users enable more domains via [webext-domain-permission-toggle](https://github.com/fregante/webext-domain-permission-toggle), this module will automatically register your `content_scripts` from `manifest.json` into the new domain.

The main use case is to add support for _GitHub/GitLab Enterprise_ domains to your GitHub/GitLab extension: you start with `github.com` and then users can add new domains; this way you don't need to use a broad `<all_urls>` permission.

**Notice:** this plugin includes polyfills for [contentScript.register](https://github.com/fregante/content-scripts-register-polyfill) (for Chrome) and [Permission Events](https://github.com/fregante/webext-permissions-events-polyfill) (for Firefox)

## Guides

[**Migration instructions from v5 to v6.**](https://github.com/fregante/webext-dynamic-content-scripts/pull/9)

[**How to let your users enable your extension on any domain.**](how-to-add-github-enterprise-support-to-web-extensions.md)


## Install

You can just download the [standalone bundle](https://packd.fregante.now.sh/webext-additional-permissions) (it might take a minute to download) and include the file in your `manifest.json`, or:

```sh
npm install webext-additional-permissions
```

```js
// This module is only offered as a ES Module
import 'webext-dynamic-content-scripts';
```

## Usage

Include `webext-dynamic-content-scripts` as a background script and add `optional_permissions` to allow new permissions to be added. The scripts defined in `content_scripts` will be added on the new domains (`matches` will be replaced)

```json
// example manifest.json
{
	"optional_permissions": [
		"http://*/*",
		"https://*/*"
	],
	"background": {
		"scripts": [
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
				"content.js"
			]
		}
	]
}
```

## Related

### Permissions

* [webext-domain-permission-toggle](https://github.com/fregante/webext-domain-permission-toggle) - Browser-action context menu to request permission for the current tab. Chrome and Firefox.
* [webext-additional-permissions](https://github.com/fregante/webext-additional-permissions) - Get any optional permissions that users have granted you.
* [webext-permissions-events-polyfill](https://github.com/fregante/webext-permissions-events-polyfill) - Polyfill for `onAdded` and `onRemoved` permission events for Firefox. (included in `webext-dynamic-content-scripts`)

### Others

* [webext-options-sync](https://github.com/fregante/webext-options-sync) - Helps you manage and autosave your extension's options. Chrome and Firefox.
* [webext-storage-cache](https://github.com/fregante/webext-storage-cache) - Map-like promised cache storage with expiration. Chrome and Firefox
* [webext-detect-page](https://github.com/fregante/webext-detect-page) - Detects where the current browser extension code is being run. Chrome and Firefox.
* [webext-content-script-ping](https://github.com/fregante/webext-content-script-ping) - One-file interface to detect whether your content script have loaded.
* [web-ext-submit](https://github.com/fregante/web-ext-submit) - Wrapper around Mozilla’s web-ext to submit extensions to AMO.
* [Awesome-WebExtensions](https://github.com/fregante/Awesome-WebExtensions) - A curated list of awesome resources for WebExtensions development.

## License

MIT © [Federico Brigante](https://bfred.it)

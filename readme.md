# webext-dynamic-content-scripts [![npm version](https://img.shields.io/npm/v/webext-dynamic-content-scripts.svg)](https://www.npmjs.com/package/webext-dynamic-content-scripts)

> WebExtension module: Automatically registers your `content_scripts` on domains added via `permissions.request`

- Browsers: Chrome, Firefox, and Safari
- Manifest: v2 and v3

This module will automatically register your `content_scripts` from `manifest.json` into new domains granted via `permissions.request()`, or via [webext-domain-permission-toggle](https://github.com/fregante/webext-domain-permission-toggle).

The main use case is ship your extension with a minimal set of hosts and then allow the user to enable it on any domain; this way you don't need to use a broad `<all_urls>` permission.

## Guides

[**How to let your users enable your extension on any domain.**](how-to-add-github-enterprise-support-to-web-extensions.md)

## Install

You can download the [standalone bundle](https://bundle.fregante.com/?pkg=webext-dynamic-content-scripts) and include it in your `manifest.json`. Or use npm:

```sh
npm install webext-dynamic-content-scripts
```

```js
// This module is only offered as a ES Module
import 'webext-dynamic-content-scripts';
```

## Usage

_For Manifest v2, refer to the [usage-mv2](./usage-mv2.md) documentation._

You need to:

- import `webext-dynamic-content-scripts` in the worker (no functions need to be called)
- specify `optional_host_permissions` in the manifest to allow new permissions to be added
- specify at least one `content_scripts`

```js
// example background.worker.js
navigator.importScripts('webext-dynamic-content-scripts.js');
```

```json
// example manifest.json
{
	"permissions": ["scripting"],
	"optional_host_permissions": ["*://*/*"],
	"background": {
		"service_worker": "background.worker.js"
	},
	"content_scripts": [
		{
			"matches": ["https://github.com/*"],
			"css": ["content.css"],
			"js": ["content.js"]
		}
	]
}
```

## Related

### Permissions

- [webext-domain-permission-toggle](https://github.com/fregante/webext-domain-permission-toggle) - Browser-action context menu to request permission for the current tab. Chrome and Firefox.
- [webext-additional-permissions](https://github.com/fregante/webext-additional-permissions) - Get any optional permissions that users have granted you.

### Others

- [webext-options-sync](https://github.com/fregante/webext-options-sync) - Helps you manage and autosave your extension's options. Chrome and Firefox.
- [webext-storage-cache](https://github.com/fregante/webext-storage-cache) - Map-like promised cache storage with expiration. Chrome and Firefox
- [webext-detect-page](https://github.com/fregante/webext-detect-page) - Detects where the current browser extension code is being run. Chrome and Firefox.
- [web-ext-submit](https://github.com/fregante/web-ext-submit) - Wrapper around Mozilla’s web-ext to submit extensions to AMO.
- [Awesome-WebExtensions](https://github.com/fregante/Awesome-WebExtensions) - A curated list of awesome resources for WebExtensions development.

## License

MIT © [Federico Brigante](https://fregante.com)

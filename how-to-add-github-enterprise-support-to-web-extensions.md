# How to add GitHub Enterprise support to WebExtensions

> Or rather, _how to enable your content scripts on optional domains domains, dynamically._

<img width="331" alt="Context menu" src="https://user-images.githubusercontent.com/1402241/32874388-e0c64150-cacc-11e7-9a50-eae3727fd3c2.png" align="right">

You can implement the feature effortlessly by using these 2 modules:

[webext-permission-toggle](https://github.com/fregante/webext-permission-toggle) will add a toggle in the Browser Action icon that will let the user requestion permission to any domain.

[webext-dynamic-content-scripts](https://github.com/fregante/webext-dynamic-content-scripts) will use this permission to inject the content scripts you declared in `manifest.json`, but instead of injecting just on the default domain (github.com) they'll be injected on all the new domains that the user added.

## background.js

```js
addPermissionToggle();
```

or if you use a bundler:

```js
import 'webext-dynamic-content-scripts';
import addPermissionToggle from 'webext-permission-toggle';

addPermissionToggle();
```

## manifest.json v3 example

```js
{
	"version": 3,
	"permissions": [
		"scripting",
		"contextMenus",
		"activeTab" // Required for Firefox support (webext-permission-toggle)
	],
	"action": { // Required for Firefox support (webext-permission-toggle)
		"default_icon": "icon.png"
	},
	"optional_host_permissions": [
		"*://*/*"
	],
	"background": {
		"scripts": "background.worker.js"
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

## manifest.json v2 example

```js
{
	"version": 2,
	"permissions": [
		"https://github.com/*",
		"contextMenus",
		"activeTab" // Required for Firefox support (webext-permission-toggle)
	],
	"browser_action": { // Required for Firefox support (webext-permission-toggle)
		"default_icon": "icon.png"
	},
	"optional_permissions": [
		"*://*/*"
	],
	"background": {
		"scripts": [
			"webext-permission-toggle.js",
			"webext-dynamic-content-scripts.js",
			"background.js"
		]
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
